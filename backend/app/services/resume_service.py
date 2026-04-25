from __future__ import annotations

from typing import Any

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import DatabaseOperationException, FileValidationException, NotFoundException
from app.models.job_match import JobMatch
from app.models.resume import Resume
from app.schemas.resume import (
    CandidateProfile,
    ResumeAdminMeta,
    ResumeDecisionSnapshot,
    ResumeDetailData,
    ResumeHistoryItem,
    ResumeMatchPreview,
    ResumeUpdateRequest,
    ResumeUploadData,
)
from app.services.ai_service import ai_service
from app.services.cache_service import cache_service
from app.utils.hashing import md5_text
from app.utils.masking import mask_email, mask_phone
from app.utils.pdf import extract_text_from_pdf
from app.utils.storage import build_resume_pdf_path, save_resume_pdf
from app.utils.text import clean_resume_text, compact_text


class ResumeService:
    """Resume upload, deduplication, history and management workflow."""

    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def _validate_pdf(file: UploadFile) -> None:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise FileValidationException()

    def upload_resume(self, session: Session, file: UploadFile) -> ResumeUploadData:
        self._validate_pdf(file)
        try:
            file_bytes = file.file.read()
        except Exception as exc:  # pragma: no cover - file streaming is runtime dependent
            raise FileValidationException("文件读取失败，请重新上传") from exc

        if not file_bytes:
            raise FileValidationException("上传文件为空，请选择有效 PDF")
        if len(file_bytes) > self.settings.max_upload_size_mb * 1024 * 1024:
            raise FileValidationException(
                f"文件大小不能超过 {self.settings.max_upload_size_mb}MB"
            )

        raw_text, page_count = extract_text_from_pdf(file_bytes)
        cleaned_text = clean_resume_text(raw_text)
        text_hash = md5_text(cleaned_text)
        cache_key = f"resume:md5:{text_hash}"

        cached_payload = cache_service.get_json(cache_key)
        existing_resume = session.scalar(select(Resume).where(Resume.text_hash == text_hash))
        if cached_payload and existing_resume:
            if not build_resume_pdf_path(text_hash).exists():
                save_resume_pdf(text_hash, file_bytes)
            return ResumeUploadData.model_validate(
                {**cached_payload, "cache_hit": True, "duplicate": True}
            )

        if existing_resume:
            if not build_resume_pdf_path(text_hash).exists():
                save_resume_pdf(text_hash, file_bytes)
            response = self._to_resume_upload(
                session=session,
                resume=existing_resume,
                cache_hit=False,
                duplicate=True,
            )
            cache_service.set_json(cache_key, response.model_dump(mode="json"))
            return response

        profile, ai_provider = ai_service.extract_resume_profile(cleaned_text)
        resume = Resume(
            filename=file.filename,
            text_hash=text_hash,
            page_count=page_count,
            raw_text=raw_text,
            cleaned_text=cleaned_text,
            structured_data=profile.model_dump(),
            ai_provider=ai_provider,
        )
        try:
            session.add(resume)
            session.commit()
            session.refresh(resume)
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException() from exc

        save_resume_pdf(text_hash, file_bytes)
        response = self._to_resume_upload(
            session=session,
            resume=resume,
            cache_hit=False,
            duplicate=False,
        )
        cache_service.set_json(cache_key, response.model_dump(mode="json"))
        return response

    def list_history(
        self,
        session: Session,
        keyword: str | None = None,
        stage: str | None = None,
        priority: str | None = None,
    ) -> list[ResumeHistoryItem]:
        match_count_subquery = (
            select(Resume.id, func.count().label("match_count"))
            .join(Resume.matches, isouter=True)
            .group_by(Resume.id)
            .subquery()
        )
        query = (
            select(Resume, match_count_subquery.c.match_count)
            .join(match_count_subquery, Resume.id == match_count_subquery.c.id, isouter=True)
            .order_by(Resume.created_at.desc())
        )
        rows = session.execute(query).all()
        latest_match_map = self.build_latest_match_map(session=session)
        items: list[ResumeHistoryItem] = []
        for resume, match_count in rows:
            profile = CandidateProfile.model_validate(resume.structured_data)
            masked_profile = profile.model_copy(
                update={"phone": mask_phone(profile.phone), "email": mask_email(profile.email)}
            )
            admin_meta = self.extract_admin_meta(resume.structured_data)
            decision = self.extract_decision_snapshot(latest_match_map.get(resume.id))
            items.append(
                ResumeHistoryItem(
                    id=resume.id,
                    filename=resume.filename,
                    text_hash=resume.text_hash,
                    page_count=resume.page_count,
                    has_preview_file=build_resume_pdf_path(resume.text_hash).exists(),
                    profile=masked_profile,
                    match_count=match_count or 0,
                    stage=admin_meta.stage,
                    priority=admin_meta.priority,
                    tags=admin_meta.tags,
                    notes=admin_meta.notes,
                    latest_match_score=decision.latest_match_score,
                    latest_recommendation=decision.latest_recommendation,
                    latest_risk_level=decision.latest_risk_level,
                    latest_next_action=decision.latest_next_action,
                    created_at=resume.created_at,
                )
            )
        return filter_resume_history_items(items, keyword=keyword, stage=stage, priority=priority)

    def get_resume(self, session: Session, resume_id: int) -> Resume | None:
        return session.get(Resume, resume_id)

    def get_resume_detail(self, session: Session, resume_id: int) -> ResumeDetailData:
        resume = self.get_resume(session, resume_id)
        if not resume:
            raise NotFoundException("简历不存在")
        recent_matches = list(
            session.scalars(
                select(JobMatch)
                .where(JobMatch.resume_id == resume_id)
                .order_by(JobMatch.created_at.desc())
                .limit(5)
            )
        )
        latest_match = recent_matches[0] if recent_matches else None
        return ResumeDetailData(
            **self._to_resume_upload(
                session=session,
                resume=resume,
                cache_hit=False,
                duplicate=False,
                latest_match=latest_match,
            ).model_dump(),
            recent_matches=[
                ResumeMatchPreview(
                    id=item.id,
                    score=item.match_score,
                    jd_excerpt=compact_text(item.jd_text),
                    recommendation=item.match_detail.get("recommendation", "建议进一步沟通"),
                    risk_level=item.match_detail.get("risk_level", "medium"),
                    next_action=item.match_detail.get("next_action", "安排技术面试"),
                    interview_questions=item.match_detail.get("interview_questions", []),
                    created_at=item.created_at,
                )
                for item in recent_matches
            ],
        )

    def rename_resume(
        self, session: Session, resume_id: int, payload: ResumeUpdateRequest
    ) -> ResumeUploadData:
        resume = self.get_resume(session, resume_id)
        if not resume:
            raise NotFoundException("简历不存在")

        if payload.filename:
            resume.filename = payload.filename

        structured_data = dict(resume.structured_data or {})
        admin_meta = self.extract_admin_meta(structured_data)
        updated_meta = ResumeAdminMeta(
            stage=payload.stage or admin_meta.stage,
            priority=payload.priority or admin_meta.priority,
            tags=[tag.strip() for tag in (payload.tags or admin_meta.tags) if tag.strip()],
            notes=payload.notes if payload.notes is not None else admin_meta.notes,
        )
        resume.structured_data = self.merge_admin_meta(structured_data, updated_meta)

        try:
            session.add(resume)
            session.commit()
            session.refresh(resume)
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("简历更新失败") from exc
        return self._to_resume_upload(
            session=session,
            resume=resume,
            cache_hit=False,
            duplicate=False,
        )

    def delete_resume(self, session: Session, resume_id: int) -> None:
        resume = self.get_resume(session, resume_id)
        if not resume:
            raise NotFoundException("简历不存在")
        preview_path = build_resume_pdf_path(resume.text_hash)
        try:
            session.delete(resume)
            session.commit()
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("删除简历失败") from exc
        if preview_path.exists():
            preview_path.unlink(missing_ok=True)

    def get_resume_preview_path(self, session: Session, resume_id: int) -> tuple[str, str]:
        resume = self.get_resume(session, resume_id)
        if not resume:
            raise NotFoundException("简历不存在")
        preview_path = build_resume_pdf_path(resume.text_hash)
        if not preview_path.exists():
            raise NotFoundException("当前简历暂未保存原始 PDF 文件，无法在线预览")
        return str(preview_path), resume.filename

    def build_latest_match_map(self, session: Session) -> dict[int, JobMatch]:
        matches = session.scalars(select(JobMatch).order_by(JobMatch.created_at.desc())).all()
        latest_map: dict[int, JobMatch] = {}
        for item in matches:
            latest_map.setdefault(item.resume_id, item)
        return latest_map

    @staticmethod
    def extract_admin_meta(structured_data: dict[str, Any] | None) -> ResumeAdminMeta:
        payload = structured_data or {}
        return ResumeAdminMeta(
            stage=payload.get("stage", "new"),
            priority=payload.get("priority", "medium"),
            tags=payload.get("tags", []) or [],
            notes=payload.get("notes"),
        )

    @staticmethod
    def extract_decision_snapshot(latest_match: JobMatch | None) -> ResumeDecisionSnapshot:
        if not latest_match:
            return ResumeDecisionSnapshot()
        detail = latest_match.match_detail or {}
        return ResumeDecisionSnapshot(
            latest_match_score=latest_match.match_score,
            latest_recommendation=detail.get("recommendation"),
            latest_risk_level=detail.get("risk_level"),
            latest_next_action=detail.get("next_action"),
        )

    @staticmethod
    def merge_admin_meta(
        structured_data: dict[str, Any], admin_meta: ResumeAdminMeta
    ) -> dict[str, Any]:
        payload = dict(structured_data)
        payload.update(
            {
                "stage": admin_meta.stage,
                "priority": admin_meta.priority,
                "tags": admin_meta.tags,
                "notes": admin_meta.notes,
            }
        )
        return payload

    def _to_resume_upload(
        self,
        session: Session,
        resume: Resume,
        cache_hit: bool,
        duplicate: bool,
        latest_match: JobMatch | None = None,
    ) -> ResumeUploadData:
        profile = CandidateProfile.model_validate(resume.structured_data)
        admin_meta = self.extract_admin_meta(resume.structured_data)
        if latest_match is None:
            latest_match = session.scalar(
                select(JobMatch)
                .where(JobMatch.resume_id == resume.id)
                .order_by(JobMatch.created_at.desc())
                .limit(1)
            )
        decision = self.extract_decision_snapshot(latest_match)
        return ResumeUploadData(
            resume_id=resume.id,
            filename=resume.filename,
            text_hash=resume.text_hash,
            page_count=resume.page_count,
            raw_text=resume.raw_text,
            cleaned_text=resume.cleaned_text,
            has_preview_file=build_resume_pdf_path(resume.text_hash).exists(),
            profile=profile,
            cache_hit=cache_hit,
            duplicate=duplicate,
            ai_provider=resume.ai_provider,
            stage=admin_meta.stage,
            priority=admin_meta.priority,
            tags=admin_meta.tags,
            notes=admin_meta.notes,
            latest_match_score=decision.latest_match_score,
            latest_recommendation=decision.latest_recommendation,
            latest_risk_level=decision.latest_risk_level,
            latest_next_action=decision.latest_next_action,
            created_at=resume.created_at,
        )


resume_service = ResumeService()


def filter_resume_history_items(
    items: list[ResumeHistoryItem],
    keyword: str | None,
    stage: str | None = None,
    priority: str | None = None,
) -> list[ResumeHistoryItem]:
    """Filter resume history items by keyword, stage and priority."""

    normalized = (keyword or "").strip().lower()
    normalized_stage = (stage or "").strip().lower()
    normalized_priority = (priority or "").strip().lower()

    filtered: list[ResumeHistoryItem] = []
    for item in items:
        matched_keyword = (
            not normalized
            or normalized in item.filename.lower()
            or normalized in (item.profile.name or "").lower()
            or normalized in (item.profile.job_intention or "").lower()
            or any(normalized in tag.lower() for tag in item.tags)
        )
        matched_stage = not normalized_stage or item.stage.lower() == normalized_stage
        matched_priority = not normalized_priority or item.priority.lower() == normalized_priority
        if matched_keyword and matched_stage and matched_priority:
            filtered.append(item)
    return filtered
