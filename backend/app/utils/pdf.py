from __future__ import annotations

from io import BytesIO

import pdfplumber

from app.core.exceptions import PDFParseException


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    """Extract all page text from a PDF file."""

    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            pages: list[str] = []
            for page in pdf.pages:
                pages.append(page.extract_text() or "")
    except Exception as exc:  # pragma: no cover - pdfplumber exceptions vary
        raise PDFParseException("PDF 解析失败，请确认文件内容可读取") from exc

    text = "\n".join(pages).strip()
    if not text:
        raise PDFParseException("PDF 内容为空，无法提取简历文本")
    return text, len(pages)
