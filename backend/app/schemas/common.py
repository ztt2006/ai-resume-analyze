from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict


T = TypeVar("T")


class ApiEnvelope(BaseModel, Generic[T]):
    """Standard API response model."""

    code: int = 0
    data: T | None = None
    message: str = "success"


class TimestampedSchema(BaseModel):
    """Shared timestamp schema."""

    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class PaginatedData(BaseModel):
    """Simple paginated response payload."""

    total: int
    items: list[Any]
