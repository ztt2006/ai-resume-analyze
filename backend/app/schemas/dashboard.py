from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DashboardTopCandidate(BaseModel):
    """Compact top candidate item for dashboard leaderboard."""

    resume_id: int
    filename: str
    candidate_name: str | None = None
    stage: str = "new"
    priority: str = "medium"
    latest_score: int = 0
    latest_recommendation: str | None = None


class DashboardPendingAction(BaseModel):
    """Pending action card item for recruiter follow-up."""

    resume_id: int
    filename: str
    candidate_name: str | None = None
    stage: str = "new"
    risk_level: str = "medium"
    next_action: str = "安排技术面试"
    created_at: datetime


class DashboardAggregateInput(BaseModel):
    """Internal dashboard aggregation input."""

    total_resumes: int
    total_matches: int
    cache_backend: str
    scores: list[int] = Field(default_factory=list)
    recent_resume_names: list[str] = Field(default_factory=list)
    recent_match_scores: list[int] = Field(default_factory=list)
    stage_distribution: dict[str, int] = Field(default_factory=dict)
    recommendation_distribution: dict[str, int] = Field(default_factory=dict)
    top_candidates: list[DashboardTopCandidate] = Field(default_factory=list)
    pending_actions: list[DashboardPendingAction] = Field(default_factory=list)
    generated_at: datetime


class DashboardOverview(BaseModel):
    """Dashboard overview payload."""

    total_resumes: int
    total_matches: int
    average_score: int
    highest_score: int
    cache_backend: str
    score_distribution: dict[str, int]
    stage_distribution: dict[str, int] = Field(default_factory=dict)
    recommendation_distribution: dict[str, int] = Field(default_factory=dict)
    recent_resume_names: list[str] = Field(default_factory=list)
    recent_match_scores: list[int] = Field(default_factory=list)
    top_candidates: list[DashboardTopCandidate] = Field(default_factory=list)
    pending_actions: list[DashboardPendingAction] = Field(default_factory=list)
    generated_at: datetime
