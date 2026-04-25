import unittest
from datetime import UTC, datetime

from app.schemas.dashboard import DashboardAggregateInput, DashboardPendingAction, DashboardTopCandidate
from app.schemas.match import CandidateComparisonItem, MatchDimension
from app.schemas.resume import CandidateProfile, ResumeHistoryItem
from app.services.dashboard_service import build_dashboard_overview
from app.services.match_service import is_recommended_candidate, sort_comparison_results
from app.services.resume_service import filter_resume_history_items


class ResumeWorkbenchTestCase(unittest.TestCase):
    def test_build_dashboard_overview_aggregates_counts_scores_and_management_sections(self) -> None:
        now = datetime(2026, 4, 25, 15, 30, tzinfo=UTC)

        overview = build_dashboard_overview(
            DashboardAggregateInput(
                total_resumes=3,
                total_matches=4,
                cache_backend="redis",
                scores=[92, 78, 84, 66],
                stage_distribution={"new": 1, "screening": 1, "interview": 1, "offer": 0, "rejected": 0},
                recommendation_distribution={"优先推进": 2, "建议面试": 1},
                recent_resume_names=["张三.pdf", "李四.pdf"],
                recent_match_scores=[92, 84],
                top_candidates=[
                    DashboardTopCandidate(
                        resume_id=1,
                        filename="zhangsan.pdf",
                        candidate_name="张三",
                        stage="screening",
                        priority="high",
                        latest_score=92,
                        latest_recommendation="优先推进",
                    )
                ],
                pending_actions=[
                    DashboardPendingAction(
                        resume_id=1,
                        filename="zhangsan.pdf",
                        candidate_name="张三",
                        stage="screening",
                        risk_level="medium",
                        next_action="安排技术面试",
                        created_at=now,
                    )
                ],
                generated_at=now,
            )
        )

        self.assertEqual(overview.total_resumes, 3)
        self.assertEqual(overview.total_matches, 4)
        self.assertEqual(overview.average_score, 80)
        self.assertEqual(overview.highest_score, 92)
        self.assertEqual(overview.score_distribution["90-100"], 1)
        self.assertEqual(overview.score_distribution["60-69"], 1)
        self.assertEqual(overview.stage_distribution["screening"], 1)
        self.assertEqual(overview.top_candidates[0].candidate_name, "张三")
        self.assertEqual(overview.pending_actions[0].next_action, "安排技术面试")

    def test_filter_resume_history_items_filters_by_keyword_stage_and_priority(self) -> None:
        items = [
            ResumeHistoryItem(
                id=1,
                filename="python_backend.pdf",
                text_hash="hash-1",
                page_count=2,
                profile=CandidateProfile(name="张三"),
                match_count=1,
                stage="screening",
                priority="high",
                tags=["Python", "FastAPI"],
                latest_match_score=88,
                latest_recommendation="建议面试",
                latest_risk_level="medium",
                latest_next_action="安排技术面试",
                created_at=datetime(2026, 4, 25, tzinfo=UTC),
            ),
            ResumeHistoryItem(
                id=2,
                filename="product_manager.pdf",
                text_hash="hash-2",
                page_count=1,
                profile=CandidateProfile(name="李四"),
                match_count=0,
                stage="new",
                priority="low",
                tags=["产品"],
                latest_match_score=None,
                latest_recommendation=None,
                latest_risk_level=None,
                latest_next_action=None,
                created_at=datetime(2026, 4, 24, tzinfo=UTC),
            ),
        ]

        by_keyword = filter_resume_history_items(items, keyword="python", stage=None, priority=None)
        by_stage = filter_resume_history_items(items, keyword=None, stage="screening", priority=None)
        by_priority = filter_resume_history_items(items, keyword=None, stage=None, priority="low")

        self.assertEqual(len(by_keyword), 1)
        self.assertEqual(by_keyword[0].id, 1)
        self.assertEqual(len(by_stage), 1)
        self.assertEqual(by_stage[0].id, 1)
        self.assertEqual(len(by_priority), 1)
        self.assertEqual(by_priority[0].id, 2)

    def test_sort_comparison_results_orders_by_score_desc_and_filename(self) -> None:
        results = [
            CandidateComparisonItem(
                resume_id=1,
                resume_filename="b.pdf",
                candidate_name="张三",
                score=85,
                recommendation="建议面试",
                risk_level="medium",
                next_action="安排一面",
                strengths=["FastAPI"],
                risks=["Kubernetes"],
                skill_dimension=MatchDimension(score=90),
                experience_dimension=MatchDimension(score=80),
                education_dimension=MatchDimension(score=70),
            ),
            CandidateComparisonItem(
                resume_id=2,
                resume_filename="a.pdf",
                candidate_name="李四",
                score=92,
                recommendation="优先推进",
                risk_level="low",
                next_action="安排复试",
                strengths=["React"],
                risks=[],
                skill_dimension=MatchDimension(score=95),
                experience_dimension=MatchDimension(score=90),
                education_dimension=MatchDimension(score=80),
            ),
        ]

        ordered = sort_comparison_results(results)

        self.assertEqual([item.resume_id for item in ordered], [2, 1])

    def test_is_recommended_candidate_uses_score_or_positive_recommendation(self) -> None:
        candidate = CandidateComparisonItem(
            resume_id=3,
            resume_filename="c.pdf",
            candidate_name="王五",
            score=76,
            recommendation="建议面试",
            risk_level="medium",
            next_action="安排技术面试",
            strengths=[],
            risks=[],
            skill_dimension=MatchDimension(score=75),
            experience_dimension=MatchDimension(score=76),
            education_dimension=MatchDimension(score=77),
        )

        self.assertTrue(is_recommended_candidate(candidate))


if __name__ == "__main__":
    unittest.main()
