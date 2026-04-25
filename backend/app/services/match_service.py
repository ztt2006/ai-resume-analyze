from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import DatabaseOperationException, NotFoundException
from app.models.job_match import JobMatch
from app.models.resume import Resume
from app.schemas.match import (
    CandidateComparisonItem,
    CompareMatchResponseData,
    MatchHistoryItem,
    MatchInsight,
    MatchResponseData,
)
from app.schemas.resume import CandidateProfile
from app.services.ai_service import ai_service
from app.services.cache_service import cache_service
from app.utils.hashing import md5_text
from app.utils.text import clean_resume_text, compact_text


class MatchService:
    """JD analysis and resume matching workflow."""

    def create_match(self, session: Session, resume_id: int, jd_text: str) -> MatchResponseData:
        resume = session.get(Resume, resume_id)
        if not resume:
            raise NotFoundException("简历不存在，请先上传简历")

        cleaned_jd = clean_resume_text(jd_text)
        jd_hash = md5_text(cleaned_jd)
        cache_key = f"match:{resume.text_hash}:{jd_hash}"

        cached_payload = cache_service.get_json(cache_key)
        existing_match = session.scalar(
            select(JobMatch).where(JobMatch.resume_id == resume.id, JobMatch.jd_hash == jd_hash)
        )
        if cached_payload and existing_match:
            return MatchResponseData.model_validate(
                {**cached_payload, "cache_hit": True, "duplicate": True}
            )

        if existing_match:
            response = self._to_match_response(existing_match, cache_hit=False, duplicate=True)
            cache_service.set_json(cache_key, response.model_dump(mode="json"))
            return response

        jd_analysis, _ = ai_service.analyze_jd(cleaned_jd)
        profile = CandidateProfile.model_validate(resume.structured_data)
        score, insight, _ = ai_service.build_match_insight(
            resume_text=resume.cleaned_text,
            profile=profile,
            jd_text=cleaned_jd,
            jd_analysis=jd_analysis,
        )
        job_match = JobMatch(
            resume_id=resume.id,
            jd_hash=jd_hash,
            jd_text=cleaned_jd,
            jd_analysis=jd_analysis.model_dump(),
            match_score=score,
            match_detail=insight.model_dump(),
        )
        try:
            session.add(job_match)
            session.commit()
            session.refresh(job_match)
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("匹配记录保存失败") from exc

        response = self._to_match_response(job_match, cache_hit=False, duplicate=False)
        cache_service.set_json(cache_key, response.model_dump(mode="json"))
        return response

    def list_history(self, session: Session) -> list[MatchHistoryItem]:
        query = select(JobMatch).options(joinedload(JobMatch.resume)).order_by(JobMatch.created_at.desc())
        rows = session.scalars(query).all()
        return [
            MatchHistoryItem(
                id=row.id,
                resume_id=row.resume_id,
                resume_filename=row.resume.filename,
                score=row.match_score,
                jd_excerpt=compact_text(row.jd_text),
                strengths=row.match_detail.get("strengths", []),
                recommendation=row.match_detail.get("recommendation", "建议进一步沟通"),
                risk_level=row.match_detail.get("risk_level", "medium"),
                next_action=row.match_detail.get("next_action", "安排技术面试"),
                created_at=row.created_at,
            )
            for row in rows
        ]

    def compare_resumes(
        self, session: Session, resume_ids: list[int], jd_text: str
    ) -> CompareMatchResponseData:
        ranking: list[CandidateComparisonItem] = []
        for resume_id in resume_ids:
            match = self.create_match(session=session, resume_id=resume_id, jd_text=jd_text)
            resume = session.get(Resume, resume_id)
            profile = CandidateProfile.model_validate(resume.structured_data) if resume else CandidateProfile()
            ranking.append(
                CandidateComparisonItem(
                    resume_id=resume_id,
                    resume_filename=resume.filename if resume else f"Resume-{resume_id}",
                    candidate_name=profile.name,
                    score=match.score,
                    recommendation=match.detail.recommendation,
                    risk_level=match.detail.risk_level,
                    next_action=match.detail.next_action,
                    strengths=match.detail.strengths,
                    risks=match.detail.risks,
                    skill_dimension=match.detail.skill_dimension,
                    experience_dimension=match.detail.experience_dimension,
                    education_dimension=match.detail.education_dimension,
                )
            )

        ordered_ranking = sort_comparison_results(ranking)
        average_score = round(sum(item.score for item in ordered_ranking) / len(ordered_ranking)) if ordered_ranking else 0
        recommended_count = sum(1 for item in ordered_ranking if is_recommended_candidate(item))
        high_risk_count = sum(1 for item in ordered_ranking if item.risk_level.lower() == "high")
        top_candidate = ordered_ranking[0] if ordered_ranking else None
        return CompareMatchResponseData(
            jd_text=jd_text,
            total_candidates=len(ordered_ranking),
            average_score=average_score,
            recommended_count=recommended_count,
            high_risk_count=high_risk_count,
            top_candidate_name=top_candidate.candidate_name or top_candidate.resume_filename if top_candidate else None,
            ranking=ordered_ranking,
        )

    @staticmethod
    def _to_match_response(job_match: JobMatch, cache_hit: bool, duplicate: bool) -> MatchResponseData:
        return MatchResponseData(
            match_id=job_match.id,
            resume_id=job_match.resume_id,
            jd_hash=job_match.jd_hash,
            jd_text=job_match.jd_text,
            score=job_match.match_score,
            detail=MatchInsight.model_validate(job_match.match_detail),
            cache_hit=cache_hit,
            duplicate=duplicate,
            created_at=job_match.created_at,
        )


match_service = MatchService()


def sort_comparison_results(items: list[CandidateComparisonItem]) -> list[CandidateComparisonItem]:
    """Sort batch comparison results by score and filename."""

    return sorted(items, key=lambda item: (-item.score, item.resume_filename.lower()))


def is_recommended_candidate(item: CandidateComparisonItem) -> bool:
    """Check whether a candidate should count as recommended in comparison summary."""

    recommendation = item.recommendation.lower()
    if "不推荐" in recommendation or "淘汰" in recommendation:
        return False
    return item.score >= 75 or any(word in recommendation for word in ["优先", "面试", "推进", "复试", "推荐"])
