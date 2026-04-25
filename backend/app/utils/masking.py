from __future__ import annotations


def mask_phone(value: str | None) -> str | None:
    """Mask a phone number for history display."""

    if not value or len(value) < 7:
        return value
    return f"{value[:3]}****{value[-4:]}"


def mask_email(value: str | None) -> str | None:
    """Mask an email for history display."""

    if not value or "@" not in value:
        return value
    name, domain = value.split("@", 1)
    if len(name) <= 2:
        return f"{name[0]}***@{domain}"
    return f"{name[:2]}***@{domain}"
