from __future__ import annotations

from fastapi import APIRouter

from app.core.responses import success_response
from app.services.cache_service import cache_service


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def get_health() -> dict:
    return success_response(
        data={"status": "ok", "cache_backend": cache_service.backend},
        message="服务运行正常",
    )
