from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.responses import success_response
from app.db.session import get_db_session
from app.schemas.common import PaginatedData
from app.schemas.match import CompareMatchRequest, MatchRequest
from app.schemas.resume import ResumeUpdateRequest
from app.services.match_service import match_service
from app.services.resume_service import resume_service
from app.services.template_service import template_service


router = APIRouter(prefix="/resumes", tags=["Resume"])
history_router = APIRouter(prefix="/history", tags=["History"])
match_router = APIRouter(prefix="/matches", tags=["Match"])


@router.post("/upload")
def upload_resume(
    file: UploadFile = File(..., description="仅支持 PDF 简历"),
    session: Session = Depends(get_db_session),
) -> dict:
    payload = resume_service.upload_resume(session=session, file=file)
    message = "检测到重复简历，已直接返回历史解析结果" if payload.duplicate else "简历上传并解析成功"
    return success_response(data=payload.model_dump(mode="json"), message=message)


@router.get("")
def list_resume_history(
    q: str | None = Query(default=None, description="按文件名、姓名、求职意向搜索"),
    stage: str | None = Query(default=None, description="按招聘阶段筛选"),
    priority: str | None = Query(default=None, description="按优先级筛选"),
    session: Session = Depends(get_db_session),
) -> dict:
    items = resume_service.list_history(session=session, keyword=q, stage=stage, priority=priority)
    return success_response(
        data=PaginatedData(total=len(items), items=[item.model_dump(mode="json") for item in items]).model_dump(),
        message="简历历史获取成功",
    )


@router.get("/{resume_id}")
def get_resume_detail(resume_id: int, session: Session = Depends(get_db_session)) -> dict:
    payload = resume_service.get_resume_detail(session=session, resume_id=resume_id)
    return success_response(data=payload.model_dump(mode="json"), message="简历详情获取成功")


@router.get("/{resume_id}/preview")
def preview_resume_file(resume_id: int, session: Session = Depends(get_db_session)) -> FileResponse:
    file_path, filename = resume_service.get_resume_preview_path(session=session, resume_id=resume_id)
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
        content_disposition_type="inline",
    )


@router.patch("/{resume_id}")
def rename_resume(
    resume_id: int, payload: ResumeUpdateRequest, session: Session = Depends(get_db_session)
) -> dict:
    data = resume_service.rename_resume(session=session, resume_id=resume_id, payload=payload)
    return success_response(data=data.model_dump(mode="json"), message="简历信息更新成功")


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, session: Session = Depends(get_db_session)) -> dict:
    resume_service.delete_resume(session=session, resume_id=resume_id)
    return success_response(data={"id": resume_id}, message="简历删除成功")


@match_router.post("")
def match_resume(request: MatchRequest, session: Session = Depends(get_db_session)) -> dict:
    payload = match_service.create_match(
        session=session, resume_id=request.resume_id, jd_text=request.jd_text
    )
    message = "检测到重复 JD，已直接返回历史匹配结果" if payload.duplicate else "岗位匹配成功"
    return success_response(data=payload.model_dump(mode="json"), message=message)


@match_router.post("/compare")
def compare_resumes(request: CompareMatchRequest, session: Session = Depends(get_db_session)) -> dict:
    jd_text = request.jd_text
    if request.template_id is not None and not jd_text:
        jd_text = template_service.get_template(session, request.template_id).content
    if not jd_text or len(jd_text.strip()) < 10:
        raise AppException("请提供有效的 JD 文本或选择一个模板")
    payload = match_service.compare_resumes(
        session=session,
        resume_ids=request.resume_ids,
        jd_text=jd_text or "",
    )
    return success_response(data=payload.model_dump(mode="json"), message="候选人对比完成")


@history_router.get("")
def list_history(session: Session = Depends(get_db_session)) -> dict:
    resume_items = resume_service.list_history(session=session)
    match_items = match_service.list_history(session=session)
    return success_response(
        data={
            "resumes": [item.model_dump(mode="json") for item in resume_items],
            "matches": [item.model_dump(mode="json") for item in match_items],
        },
        message="历史记录获取成功",
    )
