from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.resume import history_router, match_router, router as resume_router
from app.api.routes.template import router as template_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.db.session import SessionLocal
from app.db.session import init_database
from app.services.template_service import template_service
from app.utils.storage import ensure_resume_storage_dir


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize application resources."""

    init_database()
    ensure_resume_storage_dir()
    session = SessionLocal()
    try:
        template_service.seed_defaults(session)
    finally:
        session.close()
    yield


def create_app() -> FastAPI:
    """Application factory for local and serverless runtime."""

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        openapi_url=settings.openapi_url,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(dashboard_router, prefix=settings.api_prefix)
    app.include_router(resume_router, prefix=settings.api_prefix)
    app.include_router(match_router, prefix=settings.api_prefix)
    app.include_router(history_router, prefix=settings.api_prefix)
    app.include_router(template_router, prefix=settings.api_prefix)

    @app.get("/")
    def root() -> dict:
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "docs": settings.docs_url,
            "stage": settings.serverless_stage,
        }

    return app


app = create_app()
handler = app
