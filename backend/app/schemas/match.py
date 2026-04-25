from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema


class MatchDimension(BaseModel):
    """Single match dimension scoring."""

    score: int = 0
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)


class JDAnalysis(BaseModel):
    """Structured JD information."""

    core_skills: list[str] = Field(default_factory=list)
    qualification_keywords: list[str] = Field(default_factory=list)
    seniority_requirement: str | None = None
    education_requirement: str | None = None


class MatchInsight(BaseModel):
    """Detailed match analysis payload."""

    jd_analysis: JDAnalysis
    skill_dimension: MatchDimension
    experience_dimension: MatchDimension
    education_dimension: MatchDimension
    summary: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    recommendation: str = "建议进一步沟通"
    risk_level: str = "medium"
    next_action: str = "安排技术面试"
    interview_questions: list[str] = Field(default_factory=list)
    recommendation_reasons: list[str] = Field(default_factory=list)


class MatchRequest(BaseModel):
    """Match request body."""

    resume_id: int
    jd_text: str = Field(min_length=10, description="岗位 JD 原文")


class MatchResponseData(TimestampedSchema):
    """Match response payload."""

    match_id: int
    resume_id: int
    jd_hash: str
    jd_text: str
    score: int
    detail: MatchInsight
    cache_hit: bool
    duplicate: bool


class MatchHistoryItem(TimestampedSchema):
    """History page match item."""

    id: int
    resume_id: int
    resume_filename: str
    score: int
    jd_excerpt: str
    strengths: list[str] = Field(default_factory=list)
    recommendation: str = "建议进一步沟通"
    risk_level: str = "medium"
    next_action: str = "安排技术面试"


class CandidateComparisonItem(BaseModel):
    """Batch comparison item."""

    resume_id: int
    resume_filename: str
    candidate_name: str | None = None
    score: int
    recommendation: str
    risk_level: str = "medium"
    next_action: str = "安排技术面试"
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    skill_dimension: MatchDimension
    experience_dimension: MatchDimension
    education_dimension: MatchDimension


class CompareMatchRequest(BaseModel):
    """Batch compare request body."""

    resume_ids: list[int] = Field(min_length=2, description="待比较的简历ID列表")
    jd_text: str | None = Field(default=None, min_length=10, description="岗位 JD 原文")
    template_id: int | None = Field(default=None, description="JD 模板 ID")


class CompareMatchResponseData(BaseModel):
    """Batch comparison response payload."""

    jd_text: str
    total_candidates: int
    average_score: int = 0
    recommended_count: int = 0
    high_risk_count: int = 0
    top_candidate_name: str | None = None
    ranking: list[CandidateComparisonItem] = Field(default_factory=list)
