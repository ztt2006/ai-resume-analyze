from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import TimestampedSchema


class CandidateProfile(BaseModel):
    """Structured resume information extracted by AI."""

    name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    education_background: list[str] = Field(default_factory=list)
    years_of_experience: str | None = None
    project_experience: list[str] = Field(default_factory=list)
    job_intention: str | None = None
    expected_salary: str | None = None
    strengths: list[str] = Field(default_factory=list)


class ResumeAdminMeta(BaseModel):
    """Recruitment workflow metadata managed by recruiters."""

    stage: Literal["new", "screening", "interview", "offer", "rejected"] = "new"
    priority: Literal["low", "medium", "high"] = "medium"
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class ResumeDecisionSnapshot(BaseModel):
    """Latest match snapshot used by management dashboard and history."""

    latest_match_score: int | None = None
    latest_recommendation: str | None = None
    latest_risk_level: str | None = None
    latest_next_action: str | None = None


class ResumeUploadData(TimestampedSchema):
    """Resume upload response payload."""

    model_config = ConfigDict(from_attributes=True)

    resume_id: int
    filename: str
    text_hash: str
    page_count: int
    raw_text: str
    cleaned_text: str
    has_preview_file: bool = False
    profile: CandidateProfile
    cache_hit: bool
    duplicate: bool
    ai_provider: str
    stage: str = "new"
    priority: str = "medium"
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    latest_match_score: int | None = None
    latest_recommendation: str | None = None
    latest_risk_level: str | None = None
    latest_next_action: str | None = None


class ResumeHistoryItem(TimestampedSchema):
    """Resume history item."""

    id: int
    filename: str
    text_hash: str
    page_count: int
    has_preview_file: bool = False
    profile: CandidateProfile
    match_count: int
    stage: str = "new"
    priority: str = "medium"
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    latest_match_score: int | None = None
    latest_recommendation: str | None = None
    latest_risk_level: str | None = None
    latest_next_action: str | None = None


class ResumeMatchPreview(BaseModel):
    """Compact match preview inside resume detail."""

    id: int
    score: int
    jd_excerpt: str
    recommendation: str
    risk_level: str = "medium"
    next_action: str = "安排技术面试"
    interview_questions: list[str] = Field(default_factory=list)
    created_at: Any


class ResumeDetailData(ResumeUploadData):
    """Resume detail payload with recent matches."""

    recent_matches: list[ResumeMatchPreview] = Field(default_factory=list)


class ResumeUpdateRequest(BaseModel):
    """Resume management update request."""

    filename: str | None = Field(default=None, min_length=3, max_length=255)
    stage: Literal["new", "screening", "interview", "offer", "rejected"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    tags: list[str] | None = None
    notes: str | None = None


class ResumeEntityData(BaseModel):
    """Internal schema used by services."""

    resume_id: int
    filename: str
    text_hash: str
    page_count: int
    raw_text: str
    cleaned_text: str
    has_preview_file: bool = False
    profile: CandidateProfile
    cache_hit: bool = False
    duplicate: bool = False
    ai_provider: str = "mock"
    created_at: Any
    stage: str = "new"
    priority: str = "medium"
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    latest_match_score: int | None = None
    latest_recommendation: str | None = None
    latest_risk_level: str | None = None
    latest_next_action: str | None = None
