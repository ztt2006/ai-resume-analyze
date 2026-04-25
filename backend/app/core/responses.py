from __future__ import annotations

from typing import Any


def success_response(data: Any = None, message: str = "success", code: int = 0) -> dict[str, Any]:
    """Standard success envelope."""

    return {"code": code, "data": data, "message": message}


def error_response(message: str, code: int, data: Any = None) -> dict[str, Any]:
    """Standard error envelope."""

    return {"code": code, "data": data, "message": message}
