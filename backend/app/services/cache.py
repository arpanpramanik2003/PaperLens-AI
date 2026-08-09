"""
Multi-worker persistent document cache.

Stores processed document state (chunks, FAISS vector index, BM25 index, analysis)
both in L1 in-memory LRU cache and L2 disk storage (.cache/docs/{doc_id}/),
allowing any Uvicorn worker process or backend replica to load and serve any document.
"""
from __future__ import annotations

import json
import logging
import os
import pickle
from typing import Optional

import faiss
from app.core.config import settings

logger = logging.getLogger("paper_explainer.cache")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_DIR = os.path.join(BASE_DIR, ".cache", "docs")

# L1 In-memory cache
doc_cache: dict = {}
current_doc_id: Optional[str] = None
_active: dict = {
    "vector_index": None,
    "bm25_index": None,
    "chunks": [],
}

# Summary cache for the paper_id based pipeline
_summary_cache: dict[str, str] = {}


def _get_doc_dir(doc_id: str) -> str:
    return os.path.join(CACHE_DIR, doc_id)


def _persist_doc_to_disk(doc_id: str, payload: dict) -> None:
    """Persist document payload (FAISS index, BM25 model, JSON metadata) to disk."""
    try:
        doc_dir = _get_doc_dir(doc_id)
        os.makedirs(doc_dir, exist_ok=True)

        # 1. FAISS index
        vector_index = payload.get("vector_index")
        if vector_index is not None:
            index_path = os.path.join(doc_dir, "vector_index.bin")
            faiss.write_index(vector_index, index_path)

        # 2. BM25 index
        bm25_index = payload.get("bm25_index")
        if bm25_index is not None:
            bm25_path = os.path.join(doc_dir, "bm25_index.pkl")
            with open(bm25_path, "wb") as f:
                pickle.dump(bm25_index, f)

        # 3. Metadata & Chunks
        meta = {
            "analysis": payload.get("analysis"),
            "filename": payload.get("filename"),
            "page_count": payload.get("page_count"),
            "detected_title": payload.get("detected_title"),
            "chunks": payload.get("chunks", []),
        }
        meta_path = os.path.join(doc_dir, "meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False)

    except Exception as e:
        logger.error(f"Failed to persist doc {doc_id} to disk: {e}", exc_info=True)


def _load_doc_from_disk(doc_id: str) -> Optional[dict]:
    """Load document payload from disk into dictionary."""
    doc_dir = _get_doc_dir(doc_id)
    meta_path = os.path.join(doc_dir, "meta.json")
    if not os.path.exists(meta_path):
        return None

    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        vector_index = None
        index_path = os.path.join(doc_dir, "vector_index.bin")
        if os.path.exists(index_path):
            vector_index = faiss.read_index(index_path)

        bm25_index = None
        bm25_path = os.path.join(doc_dir, "bm25_index.pkl")
        if os.path.exists(bm25_path):
            with open(bm25_path, "rb") as f:
                bm25_index = pickle.load(f)

        payload = {
            "chunks": meta.get("chunks", []),
            "vector_index": vector_index,
            "bm25_index": bm25_index,
            "analysis": meta.get("analysis"),
            "filename": meta.get("filename"),
            "page_count": meta.get("page_count"),
            "detected_title": meta.get("detected_title"),
        }
        return payload
    except Exception as e:
        logger.error(f"Failed to load doc {doc_id} from disk: {e}", exc_info=True)
        return None


def store_doc(doc_id: str, payload: dict) -> None:
    max_cached = max(1, settings.MAX_CACHED_DOCS)

    if max_cached == 1:
        doc_cache.clear()
    else:
        while len(doc_cache) >= max_cached:
            oldest_doc_id = next(iter(doc_cache))
            doc_cache.pop(oldest_doc_id, None)

    doc_cache[doc_id] = payload
    _persist_doc_to_disk(doc_id, payload)


def has_doc(doc_id: str) -> bool:
    if doc_id in doc_cache:
        return True
    meta_path = os.path.join(_get_doc_dir(doc_id), "meta.json")
    return os.path.exists(meta_path)


def get_doc(doc_id: str) -> Optional[dict]:
    if doc_id in doc_cache:
        return doc_cache[doc_id]

    payload = _load_doc_from_disk(doc_id)
    if payload:
        doc_cache[doc_id] = payload
    return payload


def set_active_doc(doc_id: str) -> bool:
    global current_doc_id

    payload = get_doc(doc_id)
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


def get_cached_summary(paper_id: str) -> Optional[str]:
    return _summary_cache.get(paper_id)


def set_cached_summary(paper_id: str, summary: str) -> None:
    if len(_summary_cache) >= 10:
        oldest = next(iter(_summary_cache))
        _summary_cache.pop(oldest, None)
    _summary_cache[paper_id] = summary
