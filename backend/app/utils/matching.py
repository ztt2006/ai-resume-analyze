from __future__ import annotations

from typing import Iterable

from app.schemas.match import MatchDimension


def calculate_match_score(
    skill_dimension: MatchDimension,
    experience_dimension: MatchDimension,
    education_dimension: MatchDimension,
) -> tuple[int, list[str]]:
    """Calculate weighted overall score and summary copy."""

    overall_score = round(
        skill_dimension.score * 0.5
        + experience_dimension.score * 0.3
        + education_dimension.score * 0.2
    )
    summary: list[str] = []
    if skill_dimension.score >= 85:
        summary.append("技能匹配表现突出，核心技术关键词覆盖度较高。")
    if experience_dimension.score >= 75:
        summary.append("候选人的经验背景与岗位要求较为接近。")
    if education_dimension.score >= 70:
        summary.append("学历背景满足岗位基础门槛。")
    if not summary:
        summary.append("候选人与岗位存在一定适配空间，建议结合面试进一步评估。")
    return overall_score, summary


def overlap_keywords(source_text: str, keywords: Iterable[str]) -> tuple[list[str], list[str]]:
    """Return matched and missing keywords by substring containment."""

    matched: list[str] = []
    missing: list[str] = []
    normalized_source = source_text.lower()
    for keyword in keywords:
        if keyword.lower() in normalized_source:
            matched.append(keyword)
        else:
            missing.append(keyword)
    return matched, missing
