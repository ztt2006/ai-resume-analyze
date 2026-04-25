from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings


def get_resume_storage_dir() -> Path:
    """Return the directory used to persist uploaded resume PDFs."""

    settings = get_settings()
    return Path(settings.resume_storage_dir).resolve()


def ensure_resume_storage_dir() -> Path:
    """Create the resume storage directory when it does not exist."""

    directory = get_resume_storage_dir()
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def build_resume_pdf_path(text_hash: str) -> Path:
    """Build the file path for a stored resume PDF using its text hash."""

    return ensure_resume_storage_dir() / f"{text_hash}.pdf"


def save_resume_pdf(text_hash: str, file_bytes: bytes) -> Path:
    """Persist the uploaded resume PDF and return its absolute path."""

    target = build_resume_pdf_path(text_hash)
    target.write_bytes(file_bytes)
    return target
