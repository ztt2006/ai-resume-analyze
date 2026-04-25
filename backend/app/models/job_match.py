from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JobMatch(Base):
    """Resume and JD match persistence model."""

    __tablename__ = "job_match"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resume.id"), index=True, nullable=False)
    jd_hash: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    jd_text: Mapped[str] = mapped_column(Text, nullable=False)
    jd_analysis: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    match_detail: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resume = relationship("Resume", back_populates="matches")
