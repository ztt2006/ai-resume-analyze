from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db_session
from app.schemas.template import JDTemplateCreate, JDTemplateUpdate
from app.services.template_service import template_service


router = APIRouter(prefix="/jd-templates", tags=["JD Template"])


@router.get("")
def list_templates(session: Session = Depends(get_db_session)) -> dict:
    payload = template_service.list_templates(session)
    return success_response(
        data=[item.model_dump(mode="json") for item in payload],
        message="JD 模板列表获取成功",
    )


@router.post("")
def create_template(payload: JDTemplateCreate, session: Session = Depends(get_db_session)) -> dict:
    data = template_service.create_template(session, payload)
    return success_response(data=data.model_dump(mode="json"), message="JD 模板创建成功")


@router.patch("/{template_id}")
def update_template(
    template_id: int, payload: JDTemplateUpdate, session: Session = Depends(get_db_session)
) -> dict:
    data = template_service.update_template(session, template_id, payload)
    return success_response(data=data.model_dump(mode="json"), message="JD 模板更新成功")


@router.delete("/{template_id}")
def delete_template(template_id: int, session: Session = Depends(get_db_session)) -> dict:
    template_service.delete_template(session, template_id)
    return success_response(data={"id": template_id}, message="JD 模板删除成功")
