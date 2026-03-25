"""
In-memory document cache.

Stores processed document state (chunks, vector index, bm25 index, analysis)
keyed by doc_id. Also provides a thin summary cache keyed by paper_id for
the new pgvector-based pipeline.
"""
from __future__ import annotations

from typing import Optional

from app.core.config import settings

# Main document cache (in-memory, for existing analyze/ask pipeline)
doc_cache: dict = {}
current_doc_id: Optional[str] = None
_active: dict = {
    "vector_index": None,
    "bm25_index": None,
    "chunks": [],
}

# Summary cache for the new upload-paper/summarize pipeline
_summary_cache: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Existing document cache API (unchanged)
# ---------------------------------------------------------------------------

def store_doc(doc_id: str, payload: dict) -> None:
    max_cached = max(1, settings.MAX_CACHED_DOCS)

    if max_cached == 1:
        doc_cache.clear()
    else:
        while len(doc_cache) >= max_cached:
            oldest_doc_id = next(iter(doc_cache))
            doc_cache.pop(oldest_doc_id, None)

    doc_cache[doc_id] = payload


def set_active_doc(doc_id: str) -> bool:
    global current_doc_id

    payload = doc_cache.get(doc_id)
    if not payload:
        return False

    _active["vector_index"] = payload["vector_index"]
    _active["bm25_index"] = payload["bm25_index"]
    _active["chunks"] = payload["chunks"]
    current_doc_id = doc_id
    return True


def get_active_indexes():
    return _active["vector_index"], _active["bm25_index"], _active["chunks"]


def get_current_doc_id() -> Optional[str]:
    return current_doc_id


def has_doc(doc_id: str) -> bool:
    return doc_id in doc_cache


def get_doc(doc_id: str) -> Optional[dict]:
    return doc_cache.get(doc_id)


# ---------------------------------------------------------------------------
# Summary cache for new paper-id based pipeline
# ---------------------------------------------------------------------------

def get_cached_summary(paper_id: str) -> Optional[str]:
    """Returns cached summary for a paper_id, or None if not cached."""
    return _summary_cache.get(paper_id)


def set_cached_summary(paper_id: str, summary: str) -> None:
    """Caches a summary string for a paper_id."""
    # Keep max 10 summaries in memory
    if len(_summary_cache) >= 10:
        oldest = next(iter(_summary_cache))
        _summary_cache.pop(oldest, None)
    _summary_cache[paper_id] = summary
