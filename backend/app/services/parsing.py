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


class ParsingFormatError(Exception):

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

    try:
        doc = Document(docx_path)
    except Exception as exc:
        raise ParsingFormatError(
            "Invalid DOCX file structure. Please upload a valid .docx file (not .doc, PDF, or a renamed file)."
        ) from exc

    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    if not paragraphs:
        return []

    text = "\n".join(paragraphs)

    if max_total_chars > 0 and len(text) > max_total_chars:
        raise ParsingLimitError(
            "Paper is too lengthy for this deployment. Please upload a shorter paper."
        )

    return [{"page": 1, "text": text}]


def parse_pdf_bytes(pdf_bytes: bytes, filename: str = "") -> dict:
    """Parse PDF bytes in memory and return extracted pages, chunks, and metadata."""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        num_pages = len(doc)
        pages = []
        total_chars = 0
        for i, page in enumerate(doc):
            t = page.get_text("text").strip()
            if t:
                pages.append({"page": i + 1, "text": t})
                total_chars += len(t)

    # Chunk text
    from app.services.chunking import chunk_text_semantic
    chunks = chunk_text_semantic(pages)

    return {
        "filename": filename,
        "total_pages": num_pages,
        "total_chars": total_chars,
        "pages": pages,
        "chunks": chunks,
    }
