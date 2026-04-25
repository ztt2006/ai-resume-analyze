from __future__ import annotations

import re


def clean_resume_text(raw_text: str) -> str:
    """Normalize resume text extracted from PDF pages."""

    text = raw_text.replace("\u3000", " ").replace("\xa0", " ").replace("：", ":")
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", " ", text)
    text = re.sub(r"(?<=[\u4e00-\u9fff])[ \t]+(?=[\u4e00-\u9fff])", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*:\s*", ": ", text)
    text = re.sub(r"[@#`~^*_+=|<>]{2,}", " ", text)

    cleaned_lines: list[str] = []
    for line in text.splitlines():
        normalized = re.sub(r"\s+", " ", line).strip(" -\u2022\t ")
        if not normalized:
            continue
        if re.fullmatch(r"[\W_]+", normalized):
            continue
        cleaned_lines.append(normalized)

    return "\n".join(cleaned_lines)


def compact_text(value: str, limit: int = 180) -> str:
    """Return a compact single-line snippet."""

    single_line = re.sub(r"\s+", " ", value).strip()
    if len(single_line) <= limit:
        return single_line
    return f"{single_line[: limit - 3]}..."
