from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

import redis

from app.core.config import get_settings


logger = logging.getLogger(__name__)


@dataclass
class InMemoryCache:
    """Fallback cache used when Redis is unavailable."""

    store: dict[str, str] = field(default_factory=dict)

    def get(self, key: str) -> str | None:
        return self.store.get(key)

    def setex(self, key: str, _: int, value: str) -> bool:
        self.store[key] = value
        return True

    def ping(self) -> bool:
        return True


class CacheService:
    """JSON cache abstraction backed by Redis with safe fallback."""

    def __init__(self) -> None:
        settings = get_settings()
        try:
            client: Any = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            client.ping()
            self.client = client
            self.backend = "redis"
        except Exception as exc:  # pragma: no cover - depends on runtime service availability
            logger.warning("Redis unavailable, using in-memory cache: %s", exc)
            self.client = InMemoryCache()
            self.backend = "memory"
        self.ttl_seconds = settings.redis_ttl_seconds

    def get_json(self, key: str) -> dict[str, Any] | None:
        payload = self.client.get(key)
        if not payload:
            return None
        return json.loads(payload)

    def set_json(self, key: str, value: dict[str, Any]) -> None:
        self.client.setex(key, self.ttl_seconds, json.dumps(value, ensure_ascii=False))


cache_service = CacheService()
