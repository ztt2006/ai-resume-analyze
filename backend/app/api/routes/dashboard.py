from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db_session
from app.services.dashboard_service import dashboard_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
def get_dashboard_overview(session: Session = Depends(get_db_session)) -> dict:
    payload = dashboard_service.get_overview(session=session)
    return success_response(data=payload.model_dump(mode="json"), message="工作台数据获取成功")
