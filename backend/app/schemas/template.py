from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import TimestampedSchema


class JDTemplateBase(BaseModel):
    """Shared JD template fields."""

    name: str = Field(min_length=2, max_length=120)
    category: str = Field(default="通用岗位", min_length=2, max_length=80)
    content: str = Field(min_length=20, description="JD 模板全文")
    tags: list[str] = Field(default_factory=list)


class JDTemplateCreate(JDTemplateBase):
    """Create JD template request."""


class JDTemplateUpdate(BaseModel):
    """Update JD template request."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    content: str | None = Field(default=None, min_length=20)
    tags: list[str] | None = None


class JDTemplateData(JDTemplateBase, TimestampedSchema):
    """JD template response payload."""

    model_config = ConfigDict(from_attributes=True)

    id: int
