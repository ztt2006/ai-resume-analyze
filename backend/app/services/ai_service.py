from __future__ import annotations

import json
import re
from typing import Any

import requests

from app.core.config import get_settings
from app.schemas.match import JDAnalysis, MatchDimension, MatchInsight
from app.schemas.resume import CandidateProfile
from app.utils.matching import calculate_match_score, overlap_keywords


COMMON_SKILLS = [
    "Python",
    "FastAPI",
    "Django",
    "Flask",
    "SQLAlchemy",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "Linux",
    "Git",
    "React",
    "TypeScript",
    "JavaScript",
    "TailwindCSS",
    "Vue",
    "Java",
    "Spring Boot",
    "微服务",
    "数据分析",
    "机器学习",
]

EDUCATION_RANK = {"中专": 1, "大专": 2, "本科": 3, "硕士": 4, "博士": 5}


class AIService:
    """AI orchestration service with HTTP-first and heuristic fallback behavior."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def extract_resume_profile(self, resume_text: str) -> tuple[CandidateProfile, str]:
        """Extract structured resume information from text."""

        prompt = f"""
你是一名招聘系统信息抽取助手。请从以下简历文本中提取结构化信息，并严格只返回 JSON。
JSON 字段必须包含：
name, phone, email, address, education_background, years_of_experience,
project_experience, job_intention, expected_salary, strengths

简历文本：
{resume_text}
""".strip()

        ai_json = self._call_remote_json(prompt)
        if isinstance(ai_json, dict):
            return CandidateProfile.model_validate(ai_json), "remote-http"
        return self._fallback_resume_profile(resume_text), "mock"

    def analyze_jd(self, jd_text: str) -> tuple[JDAnalysis, str]:
        """Analyze JD keywords and requirements."""

        prompt = f"""
你是一名招聘 JD 分析助手。请分析以下岗位描述，并严格只返回 JSON。
JSON 字段必须包含：
core_skills, qualification_keywords, seniority_requirement, education_requirement

岗位描述：
{jd_text}
""".strip()

        ai_json = self._call_remote_json(prompt)
        if isinstance(ai_json, dict):
            return JDAnalysis.model_validate(ai_json), "remote-http"
        return self._fallback_jd_analysis(jd_text), "mock"

    def build_match_insight(
        self,
        resume_text: str,
        profile: CandidateProfile,
        jd_text: str,
        jd_analysis: JDAnalysis,
    ) -> tuple[int, MatchInsight, str]:
        """Generate overall match detail and score."""

        prompt = f"""
你是一名智能招聘匹配助手。请结合候选人简历与岗位JD，严格只返回 JSON。
JSON 字段必须包含：
skill_dimension, experience_dimension, education_dimension, summary, strengths, risks,
recommendation, risk_level, next_action, interview_questions, recommendation_reasons

候选人结构化信息：
{profile.model_dump_json(ensure_ascii=False)}

简历全文：
{resume_text}

岗位JD分析：
{jd_analysis.model_dump_json(ensure_ascii=False)}

岗位JD全文：
{jd_text}
""".strip()

        ai_json = self._call_remote_json(prompt)
        if isinstance(ai_json, dict):
            insight = MatchInsight.model_validate(
                {
                    "jd_analysis": jd_analysis.model_dump(),
                    "skill_dimension": ai_json.get("skill_dimension", {}),
                    "experience_dimension": ai_json.get("experience_dimension", {}),
                    "education_dimension": ai_json.get("education_dimension", {}),
                    "summary": ai_json.get("summary", []),
                    "strengths": ai_json.get("strengths", []),
                    "risks": ai_json.get("risks", []),
                    "recommendation": ai_json.get("recommendation", "建议进一步沟通"),
                    "risk_level": ai_json.get("risk_level", "medium"),
                    "next_action": ai_json.get("next_action", "安排技术面试"),
                    "interview_questions": ai_json.get("interview_questions", []),
                    "recommendation_reasons": ai_json.get("recommendation_reasons", []),
                }
            )
            score, summary = calculate_match_score(
                insight.skill_dimension,
                insight.experience_dimension,
                insight.education_dimension,
            )
            if not insight.summary:
                insight.summary = summary
            return score, insight, "remote-http"

        score, insight = self._fallback_match_insight(resume_text, profile, jd_analysis)
        return score, insight, "mock"

    def _call_remote_json(self, prompt: str) -> dict[str, Any] | None:
        """Call a generic HTTP LLM endpoint that behaves like chat completions."""

        if not self.settings.ai_api_url or not self.settings.ai_api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.settings.ai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.ai_model,
            "temperature": self.settings.ai_temperature,
            "messages": [
                {
                    "role": "system",
                    "content": "你必须仅返回合法 JSON，不得输出 Markdown 或额外说明。",
                },
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        try:
            response = requests.post(
                self.settings.ai_api_url,
                headers=headers,
                json=payload,
                timeout=self.settings.ai_timeout_seconds,
            )
            response.raise_for_status()
            response_json = response.json()
        except Exception:
            return None

        content = self._extract_content(response_json)
        if not content:
            return None

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None

    @staticmethod
    def _extract_content(response_json: dict[str, Any]) -> str | None:
        """Extract text content from common LLM HTTP response shapes."""

        choices = response_json.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message", {})
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, str):
                    return content

        data_content = response_json.get("content")
        if isinstance(data_content, str):
            return data_content

        data = response_json.get("data")
        if isinstance(data, dict) and isinstance(data.get("content"), str):
            return data["content"]
        return None

    @staticmethod
    def _fallback_resume_profile(resume_text: str) -> CandidateProfile:
        lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
        name = None
        for line in lines[:5]:
            if re.fullmatch(r"[A-Za-z\u4e00-\u9fff·]{2,20}", line):
                name = line
                break
        phone_match = re.search(r"(?<!\d)(1[3-9]\d{9})(?!\d)", resume_text)
        email_match = re.search(r"[\w.\-+]+@[\w.\-]+\.\w+", resume_text)
        address_match = re.search(r"(?:联系地址|地址|现居地|居住地)[:：]?\s*(.+)", resume_text)
        years_match = re.search(r"(\d{1,2}\+?\s*年(?:以上)?(?:工作)?经验)", resume_text)
        intention_match = re.search(r"(?:求职意向|意向岗位|目标岗位)[:：]?\s*(.+)", resume_text)
        salary_match = re.search(r"(?:期望薪资|薪资期望)[:：]?\s*(.+)", resume_text)

        education_background = [
            line for line in lines if any(keyword in line for keyword in EDUCATION_RANK.keys())
        ][:3]
        project_experience = [
            line for line in lines if "项目" in line and len(line) >= 8
        ][:3]

        strengths = []
        for skill in COMMON_SKILLS:
            if skill.lower() in resume_text.lower():
                strengths.append(skill)
        return CandidateProfile(
            name=name,
            phone=phone_match.group(1) if phone_match else None,
            email=email_match.group(0) if email_match else None,
            address=address_match.group(1).strip() if address_match else None,
            education_background=education_background,
            years_of_experience=years_match.group(1) if years_match else None,
            project_experience=project_experience,
            job_intention=intention_match.group(1).strip() if intention_match else None,
            expected_salary=salary_match.group(1).strip() if salary_match else None,
            strengths=strengths[:6],
        )

    @staticmethod
    def _fallback_jd_analysis(jd_text: str) -> JDAnalysis:
        core_skills = [skill for skill in COMMON_SKILLS if skill.lower() in jd_text.lower()]
        if not core_skills:
            core_skills = re.findall(r"\b[A-Za-z][A-Za-z0-9.+#-]{1,20}\b", jd_text)[:8]

        qualification_keywords = []
        for token in ["负责", "架构", "优化", "沟通", "协作", "高并发", "项目管理", "交付"]:
            if token in jd_text:
                qualification_keywords.append(token)

        seniority_match = re.search(r"(\d{1,2}\+?\s*年(?:以上)?经验)", jd_text)
        education_match = next(
            (education for education in ["博士", "硕士", "本科", "大专"] if education in jd_text),
            None,
        )
        return JDAnalysis(
            core_skills=core_skills[:10],
            qualification_keywords=qualification_keywords[:8],
            seniority_requirement=seniority_match.group(1) if seniority_match else None,
            education_requirement=education_match,
        )

    def _fallback_match_insight(
        self,
        resume_text: str,
        profile: CandidateProfile,
        jd_analysis: JDAnalysis,
    ) -> tuple[int, MatchInsight]:
        matched_skills, missing_skills = overlap_keywords(resume_text, jd_analysis.core_skills)
        skill_score = (
            round(len(matched_skills) / max(len(jd_analysis.core_skills), 1) * 100)
            if jd_analysis.core_skills
            else 70
        )

        experience_score = self._evaluate_experience(
            profile.years_of_experience, jd_analysis.seniority_requirement
        )
        education_score = self._evaluate_education(
            profile.education_background, jd_analysis.education_requirement
        )

        skill_dimension = MatchDimension(
            score=skill_score, matched=matched_skills, missing=missing_skills
        )
        experience_dimension = MatchDimension(
            score=experience_score,
            matched=[profile.years_of_experience] if profile.years_of_experience else [],
            missing=[jd_analysis.seniority_requirement]
            if jd_analysis.seniority_requirement and not profile.years_of_experience
            else [],
        )
        education_dimension = MatchDimension(
            score=education_score,
            matched=profile.education_background[:1],
            missing=[jd_analysis.education_requirement]
            if jd_analysis.education_requirement and education_score < 70
            else [],
        )

        score, summary = calculate_match_score(
            skill_dimension=skill_dimension,
            experience_dimension=experience_dimension,
            education_dimension=education_dimension,
        )
        strengths = [
            f"已覆盖 {keyword}" for keyword in matched_skills[:4]
        ] or ["简历内容具备一定岗位相关性"]
        risks = [f"待补齐 {keyword}" for keyword in missing_skills[:4]]
        insight = MatchInsight(
            jd_analysis=jd_analysis,
            skill_dimension=skill_dimension,
            experience_dimension=experience_dimension,
            education_dimension=education_dimension,
            summary=summary,
            strengths=strengths,
            risks=risks,
            recommendation=self._build_recommendation(score),
            risk_level=self._build_risk_level(score),
            next_action=self._build_next_action(score),
            interview_questions=self._build_interview_questions(
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                profile=profile,
            ),
            recommendation_reasons=self._build_recommendation_reasons(
                matched_skills=matched_skills,
                experience_score=experience_score,
                education_score=education_score,
            ),
        )
        return score, insight

    @staticmethod
    def _build_recommendation(score: int) -> str:
        if score >= 85:
            return "优先推进"
        if score >= 70:
            return "建议面试"
        return "建议保留观察"

    @staticmethod
    def _build_risk_level(score: int) -> str:
        if score >= 85:
            return "low"
        if score >= 70:
            return "medium"
        return "high"

    @staticmethod
    def _build_next_action(score: int) -> str:
        if score >= 85:
            return "安排技术复试并确认到岗时间"
        if score >= 70:
            return "安排一轮业务/技术初面"
        return "补充更多岗位信息或候选人材料后再评估"

    @staticmethod
    def _build_interview_questions(
        matched_skills: list[str], missing_skills: list[str], profile: CandidateProfile
    ) -> list[str]:
        questions = []
        if matched_skills:
            questions.append(f"请结合实际项目讲讲你如何使用 {matched_skills[0]} 解决业务问题？")
        if profile.project_experience:
            questions.append("你最有代表性的项目中，承担了哪些核心职责？")
        if missing_skills:
            questions.append(f"岗位强调 {missing_skills[0]}，你目前的掌握程度和补齐计划是什么？")
        questions.append("如果入职前两周接手一个紧急项目，你会如何拆解优先级并推进交付？")
        return questions[:4]

    @staticmethod
    def _build_recommendation_reasons(
        matched_skills: list[str], experience_score: int, education_score: int
    ) -> list[str]:
        reasons = []
        if matched_skills:
            reasons.append(f"技能关键词命中 {', '.join(matched_skills[:3])}")
        if experience_score >= 75:
            reasons.append("候选人的经验背景与岗位阶段较为匹配")
        if education_score >= 70:
            reasons.append("学历背景满足岗位基础要求")
        if not reasons:
            reasons.append("简历具备部分岗位相关信息，但仍需进一步面试验证")
        return reasons

    @staticmethod
    def _extract_years(value: str | None) -> int:
        if not value:
            return 0
        match = re.search(r"(\d{1,2})", value)
        return int(match.group(1)) if match else 0

    def _evaluate_experience(self, resume_years: str | None, jd_years: str | None) -> int:
        resume_year_value = self._extract_years(resume_years)
        jd_year_value = self._extract_years(jd_years)
        if jd_year_value == 0:
            return 75 if resume_year_value else 65
        if resume_year_value >= jd_year_value:
            return 90
        if resume_year_value == 0:
            return 55
        gap = jd_year_value - resume_year_value
        return max(55, 85 - gap * 10)

    @staticmethod
    def _evaluate_education(background: list[str], requirement: str | None) -> int:
        if not requirement:
            return 75 if background else 65
        resume_rank = max(
            (EDUCATION_RANK.get(key, 0) for line in background for key in EDUCATION_RANK if key in line),
            default=0,
        )
        jd_rank = EDUCATION_RANK.get(requirement, 0)
        if resume_rank >= jd_rank and resume_rank > 0:
            return 88
        if resume_rank == 0:
            return 55
        if resume_rank + 1 == jd_rank:
            return 68
        return 58


ai_service = AIService()
