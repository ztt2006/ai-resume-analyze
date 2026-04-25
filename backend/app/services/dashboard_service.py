from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.job_match import JobMatch
from app.models.resume import Resume
from app.schemas.dashboard import (
    DashboardAggregateInput,
    DashboardOverview,
    DashboardPendingAction,
    DashboardTopCandidate,
)
from app.schemas.resume import CandidateProfile
from app.services.cache_service import cache_service
from app.services.resume_service import resume_service


def build_dashboard_overview(payload: DashboardAggregateInput) -> DashboardOverview:
    """Build dashboard overview from aggregate values."""

    distribution = {
        "90-100": 0,
        "80-89": 0,
        "70-79": 0,
        "60-69": 0,
        "0-59": 0,
    }
    for score in payload.scores:
        if score >= 90:
            distribution["90-100"] += 1
        elif score >= 80:
            distribution["80-89"] += 1
        elif score >= 70:
            distribution["70-79"] += 1
        elif score >= 60:
            distribution["60-69"] += 1
        else:
            distribution["0-59"] += 1

    average_score = round(sum(payload.scores) / len(payload.scores)) if payload.scores else 0
    highest_score = max(payload.scores, default=0)
    return DashboardOverview(
        total_resumes=payload.total_resumes,
        total_matches=payload.total_matches,
        average_score=average_score,
        highest_score=highest_score,
        cache_backend=payload.cache_backend,
        score_distribution=distribution,
        stage_distribution=payload.stage_distribution,
        recommendation_distribution=payload.recommendation_distribution,
        recent_resume_names=payload.recent_resume_names,
        recent_match_scores=payload.recent_match_scores,
        top_candidates=payload.top_candidates,
        pending_actions=payload.pending_actions,
        generated_at=payload.generated_at,
    )


class DashboardService:
    """Dashboard aggregation service."""

    def get_overview(self, session: Session) -> DashboardOverview:
        total_resumes = session.scalar(select(func.count(Resume.id))) or 0
        total_matches = session.scalar(select(func.count(JobMatch.id))) or 0
        match_rows = list(session.scalars(select(JobMatch).order_by(JobMatch.created_at.desc())))
        match_scores = [row.match_score for row in match_rows]
        resume_rows = list(session.scalars(select(Resume).order_by(Resume.created_at.desc())))
        latest_match_map = resume_service.build_latest_match_map(session=session)

        recent_resume_names = [item.filename for item in resume_rows[:5]]
        recent_match_scores = match_scores[:5]
        stage_distribution = build_stage_distribution(resume_rows)
        recommendation_distribution = build_recommendation_distribution(match_rows)
        top_candidates = build_top_candidates(resume_rows, latest_match_map)
        pending_actions = build_pending_actions(resume_rows, latest_match_map)

        return build_dashboard_overview(
            DashboardAggregateInput(
                total_resumes=total_resumes,
                total_matches=total_matches,
                cache_backend=cache_service.backend,
                scores=match_scores,
                stage_distribution=stage_distribution,
                recommendation_distribution=recommendation_distribution,
                recent_resume_names=recent_resume_names,
                recent_match_scores=recent_match_scores,
                top_candidates=top_candidates,
                pending_actions=pending_actions,
                generated_at=datetime.now(UTC),
            )
        )


dashboard_service = DashboardService()


def build_stage_distribution(resumes: list[Resume]) -> dict[str, int]:
    """Aggregate candidate stage distribution from resume admin metadata."""

    counter = Counter()
    for item in resumes:
        stage = resume_service.extract_admin_meta(item.structured_data).stage
        counter[stage] += 1
    return {
        "new": counter.get("new", 0),
        "screening": counter.get("screening", 0),
        "interview": counter.get("interview", 0),
        "offer": counter.get("offer", 0),
        "rejected": counter.get("rejected", 0),
    }


def build_recommendation_distribution(matches: list[JobMatch]) -> dict[str, int]:
    """Aggregate recommendation distribution from historical matches."""

    counter = Counter(
        (item.match_detail or {}).get("recommendation", "未生成建议")
        for item in matches
    )
    return dict(counter)


def build_top_candidates(
    resumes: list[Resume],
    latest_match_map: dict[int, JobMatch],
) -> list[DashboardTopCandidate]:
    """Build top candidate leaderboard using the latest match for each resume."""

    items: list[DashboardTopCandidate] = []
    for resume in resumes:
        latest_match = latest_match_map.get(resume.id)
        if not latest_match:
            continue
        profile = CandidateProfile.model_validate(resume.structured_data)
        admin_meta = resume_service.extract_admin_meta(resume.structured_data)
        items.append(
            DashboardTopCandidate(
                resume_id=resume.id,
                filename=resume.filename,
                candidate_name=profile.name,
                stage=admin_meta.stage,
                priority=admin_meta.priority,
                latest_score=latest_match.match_score,
                latest_recommendation=(latest_match.match_detail or {}).get("recommendation"),
            )
        )
    return sorted(items, key=lambda item: (-item.latest_score, item.filename.lower()))[:5]


def build_pending_actions(
    resumes: list[Resume],
    latest_match_map: dict[int, JobMatch],
) -> list[DashboardPendingAction]:
    """Build pending recruiter follow-up list from the latest match snapshot."""

    resume_lookup = {item.id: item for item in resumes}
    items: list[DashboardPendingAction] = []
    for resume_id, latest_match in latest_match_map.items():
        resume = resume_lookup.get(resume_id)
        if not resume:
            continue
        profile = CandidateProfile.model_validate(resume.structured_data)
        admin_meta = resume_service.extract_admin_meta(resume.structured_data)
        detail = latest_match.match_detail or {}
        items.append(
            DashboardPendingAction(
                resume_id=resume.id,
                filename=resume.filename,
                candidate_name=profile.name,
                stage=admin_meta.stage,
                risk_level=detail.get("risk_level", "medium"),
                next_action=detail.get("next_action", "安排技术面试"),
                created_at=latest_match.created_at,
            )
        )
    return sorted(
        items,
        key=lambda item: (
            0 if item.risk_level.lower() == "high" else 1,
            0 if item.stage == "screening" else 1,
            -item.created_at.timestamp(),
        ),
    )[:6]
