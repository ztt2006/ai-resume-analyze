from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


class Settings(BaseModel):
    """Application settings loaded from environment variables."""

    app_name: str = "AI赋能智能简历分析系统"
    app_version: str = "1.0.0"
    api_prefix: str = "/api"
    debug: bool = False
    database_url: str = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ai_resume_analyze"
    redis_url: str = "redis://127.0.0.1:6379/0"
    redis_ttl_seconds: int = 60 * 60 * 24
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    ai_api_url: str = ""
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    ai_timeout_seconds: int = 45
    ai_request_path: str = "choices.0.message.content"
    ai_temperature: float = 0.2
    github_pages_base: str = "./"
    max_upload_size_mb: int = 10
    resume_storage_dir: str = "./storage/resumes"
    serverless_stage: str = "local"
    docs_url: str = "/docs"
    openapi_url: str = "/openapi.json"
    redoc_url: str = "/redoc"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    request_log_name: str = "resume-analyzer"
    matching_weights: dict[str, float] = Field(
        default_factory=lambda: {"skill": 0.5, "experience": 0.3, "education": 0.2}
    )

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings(
        app_name=os.getenv("APP_NAME", Settings.model_fields["app_name"].default),
        app_version=os.getenv("APP_VERSION", Settings.model_fields["app_version"].default),
        api_prefix=os.getenv("API_PREFIX", Settings.model_fields["api_prefix"].default),
        debug=os.getenv("DEBUG", "false").lower() == "true",
        database_url=os.getenv("DATABASE_URL", Settings.model_fields["database_url"].default),
        redis_url=os.getenv("REDIS_URL", Settings.model_fields["redis_url"].default),
        redis_ttl_seconds=int(
            os.getenv("REDIS_TTL_SECONDS", str(Settings.model_fields["redis_ttl_seconds"].default))
        ),
        allowed_origins=os.getenv("ALLOWED_ORIGINS", Settings.model_fields["allowed_origins"].default),
        ai_api_url=os.getenv("AI_API_URL", Settings.model_fields["ai_api_url"].default),
        ai_api_key=os.getenv("AI_API_KEY", Settings.model_fields["ai_api_key"].default),
        ai_model=os.getenv("AI_MODEL", Settings.model_fields["ai_model"].default),
        ai_timeout_seconds=int(
            os.getenv("AI_TIMEOUT_SECONDS", str(Settings.model_fields["ai_timeout_seconds"].default))
        ),
        ai_request_path=os.getenv(
            "AI_REQUEST_PATH", Settings.model_fields["ai_request_path"].default
        ),
        ai_temperature=float(
            os.getenv("AI_TEMPERATURE", str(Settings.model_fields["ai_temperature"].default))
        ),
        github_pages_base=os.getenv(
            "GITHUB_PAGES_BASE", Settings.model_fields["github_pages_base"].default
        ),
        max_upload_size_mb=int(
            os.getenv("MAX_UPLOAD_SIZE_MB", str(Settings.model_fields["max_upload_size_mb"].default))
        ),
        resume_storage_dir=os.getenv(
            "RESUME_STORAGE_DIR", Settings.model_fields["resume_storage_dir"].default
        ),
        serverless_stage=os.getenv(
            "SERVERLESS_STAGE", Settings.model_fields["serverless_stage"].default
        ),
        docs_url=os.getenv("DOCS_URL", Settings.model_fields["docs_url"].default),
        openapi_url=os.getenv("OPENAPI_URL", Settings.model_fields["openapi_url"].default),
        redoc_url=os.getenv("REDOC_URL", Settings.model_fields["redoc_url"].default),
        app_host=os.getenv("APP_HOST", Settings.model_fields["app_host"].default),
        app_port=int(os.getenv("APP_PORT", str(Settings.model_fields["app_port"].default))),
        request_log_name=os.getenv(
            "REQUEST_LOG_NAME", Settings.model_fields["request_log_name"].default
        ),
    )
