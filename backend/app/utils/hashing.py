from __future__ import annotations

import hashlib


def md5_text(value: str) -> str:
    """Return an md5 hash for stable deduplication keys."""

    return hashlib.md5(value.encode("utf-8")).hexdigest()
