"""
PDF & DOCX parsing — memory-efficient, using PyMuPDF (fitz).
Generator-based extraction avoids loading full PDF into RAM.
"""
from __future__ import annotations

from typing import Generator

import fitz


class ParsingLimitError(Exception):

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


# ---------------------------------------------------------------------------
# PDF – generator (memory-efficient, never loads full file at once)
# ---------------------------------------------------------------------------

def extract_pdf_pages_generator(
    pdf_path: str,
    max_pages: int = 0,
    max_total_chars: int = 0,
) -> Generator[dict, None, None]:
    """
    Yields {page: int, text: str} dicts one at a time.
    Raises ParsingLimitError if limits are exceeded.
    """
    total_chars = 0

    with fitz.open(pdf_path) as doc:
        num_pages = len(doc)

        if max_pages > 0 and num_pages > max_pages:
            raise ParsingLimitError(
                f"Paper is too lengthy ({num_pages} pages). "
                f"Please upload up to {max_pages} pages."
            )

        for i, page in enumerate(doc):
            page_number = i + 1
            text = page.get_text("text")

            if not text or not text.strip():
                continue

            total_chars += len(text)

            if max_total_chars > 0 and total_chars > max_total_chars:
                raise ParsingLimitError(
                    "Paper is too lengthy for this deployment. "
                    "Please upload a shorter paper."
                )

            yield {"page": page_number, "text": text.strip()}


def extract_pdf_pages(
    pdf_path: str,
    max_pages: int = 0,
    max_total_chars: int = 0,
) -> list[dict]:
    """
    Convenience wrapper — returns a list.
    Keeps backward compatibility with existing routes.
    """
    return list(extract_pdf_pages_generator(pdf_path, max_pages, max_total_chars))


# ---------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------

def extract_docx_pages(
    docx_path: str,
    max_pages: int = 0,
    max_total_chars: int = 0,
) -> list[dict]:
    """
    Extracts all paragraphs from a DOCX file as a single 'page'.
    """
    from docx import Document

    doc = Document(docx_path)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        return []

    text = "\n".join(paragraphs)

    if max_total_chars > 0 and len(text) > max_total_chars:
        raise ParsingLimitError(
            "Paper is too lengthy for this deployment. Please upload a shorter paper."
        )

    return [{"page": 1, "text": text}]
