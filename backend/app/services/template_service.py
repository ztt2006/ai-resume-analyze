from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import DatabaseOperationException, NotFoundException
from app.models.jd_template import JDTemplate
from app.schemas.template import JDTemplateCreate, JDTemplateData, JDTemplateUpdate


DEFAULT_TEMPLATES = [
    {
        "name": "Python后端工程师",
        "category": "研发",
        "tags": ["Python", "FastAPI", "Redis", "PostgreSQL"],
        "content": "负责 Python / FastAPI 后端服务开发，参与 PostgreSQL 数据建模、Redis 缓存设计、接口联调与性能优化，要求 3 年以上后端经验，本科及以上学历。",
    },
    {
        "name": "前端工程师",
        "category": "研发",
        "tags": ["React", "TypeScript", "TailwindCSS"],
        "content": "负责 React + TypeScript 前端页面开发，参与组件化设计、状态管理、接口联调与性能优化，要求 3 年以上前端经验，本科及以上学历。",
    },
    {
        "name": "产品经理",
        "category": "产品",
        "tags": ["需求分析", "原型设计", "跨团队协作"],
        "content": "负责产品需求调研、PRD 编写、跨团队协同推进和上线复盘，要求具备 2 年以上互联网产品经验，沟通与项目推进能力强。",
    },
]


class TemplateService:
    """JD template CRUD service."""

    def seed_defaults(self, session: Session) -> None:
        existing_count = session.scalar(select(JDTemplate.id).limit(1))
        if existing_count:
            return
        session.add_all([JDTemplate(**payload) for payload in DEFAULT_TEMPLATES])
        session.commit()

    def list_templates(self, session: Session) -> list[JDTemplateData]:
        rows = session.scalars(select(JDTemplate).order_by(JDTemplate.created_at.desc())).all()
        return [JDTemplateData.model_validate(row) for row in rows]

    def get_template(self, session: Session, template_id: int) -> JDTemplate:
        template = session.get(JDTemplate, template_id)
        if not template:
            raise NotFoundException("JD 模板不存在")
        return template

    def create_template(self, session: Session, payload: JDTemplateCreate) -> JDTemplateData:
        template = JDTemplate(**payload.model_dump())
        try:
            session.add(template)
            session.commit()
            session.refresh(template)
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("创建 JD 模板失败") from exc
        return JDTemplateData.model_validate(template)

    def update_template(
        self, session: Session, template_id: int, payload: JDTemplateUpdate
    ) -> JDTemplateData:
        template = self.get_template(session, template_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(template, key, value)
        try:
            session.add(template)
            session.commit()
            session.refresh(template)
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("更新 JD 模板失败") from exc
        return JDTemplateData.model_validate(template)

    def delete_template(self, session: Session, template_id: int) -> None:
        template = self.get_template(session, template_id)
        try:
            session.delete(template)
            session.commit()
        except SQLAlchemyError as exc:
            session.rollback()
            raise DatabaseOperationException("删除 JD 模板失败") from exc


template_service = TemplateService()
