from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Resume(Base):
    """Resume persistence model."""

    __tablename__ = "resume"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    text_hash: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    cleaned_text: Mapped[str] = mapped_column(Text, nullable=False)
    structured_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ai_provider: Mapped[str] = mapped_column(String(64), nullable=False, default="mock")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    matches = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")
