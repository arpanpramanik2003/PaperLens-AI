"""
Embedding service — generates embeddings and manages pgvector storage in Supabase.

Uses the same model as retrieval.py (all-MiniLM-L6-v2, 384-dim) to avoid
downloading a second model. This is important for Render 500MB RAM constraint.
"""
from __future__ import annotations

import logging
from typing import Optional

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_model = None


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

def get_embedding_model():
    """Lazy-loads the sentence-transformer model (shared with retrieval.py)."""
    global _embedding_model

    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded: %s", settings.EMBEDDING_MODEL)

    return _embedding_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generates normalized embeddings for a list of texts.
    Returns a list of float lists (one per text).
    """
    model = get_embedding_model()
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
        show_progress_bar=False,
    )
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Generates a single normalized embedding for a query string."""
    return embed_texts([query])[0]


# ---------------------------------------------------------------------------
# Supabase pgvector operations
# ---------------------------------------------------------------------------

def _get_client():
    from app.core.database import get_supabase_client
    return get_supabase_client()


def paper_already_indexed(paper_id: str) -> bool:
    """
    Returns True if chunks for this paper_id already exist in pgvector.
    Used for deduplication — avoids re-processing same PDF.
    """
    client = _get_client()
    if client is None:
        return False

    try:
        result = (
            client.table("paper_chunks")
            .select("id", count="exact")
            .eq("paper_id", paper_id)
            .limit(1)
            .execute()
        )
        return (result.count or 0) > 0
    except Exception as exc:
        logger.warning("paper_already_indexed check failed: %s", exc)
        return False


def store_chunks_in_pgvector(
    paper_id: str,
    user_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> int:
    """
    Inserts chunks with their embeddings into Supabase paper_chunks table.
    Deletes existing chunks for this paper_id first (idempotent upsert).

    Returns: number of chunks inserted.
    """
    client = _get_client()
    if client is None:
        logger.warning("Supabase client unavailable — pgvector storage skipped.")
        return 0

    try:
        # Delete old chunks for this paper (idempotent)
        client.table("paper_chunks").delete().eq("paper_id", paper_id).execute()

        # Prepare rows
        rows = [
            {
                "paper_id": paper_id,
                "user_id": user_id,
                "content": chunk["text"],
                "embedding": embedding,
                "page": chunk.get("page", 0),
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]

        # Insert in batches of 50 to stay within Supabase request limits
        batch_size = 50
        inserted = 0
        for i in range(0, len(rows), batch_size):
            batch = rows[i: i + batch_size]
            client.table("paper_chunks").insert(batch).execute()
            inserted += len(batch)

        logger.info("Stored %d chunks for paper_id=%s", inserted, paper_id)
        return inserted

    except Exception as exc:
        logger.error("store_chunks_in_pgvector failed: %s", exc)
        return 0


def search_pgvector(
    paper_id: str,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """
    Retrieves top-k most similar chunks for a paper using cosine similarity.
    Calls the match_chunks RPC function defined in supabase_migration.sql.

    Returns list of {content, page, similarity}.
    """
    client = _get_client()
    if client is None:
        logger.warning("Supabase client unavailable — pgvector search skipped.")
        return []

    try:
        result = client.rpc(
            "match_chunks",
            {
                "query_embedding": query_embedding,
                "target_paper_id": paper_id,
                "match_count": top_k,
            },
        ).execute()

        if not result.data:
            return []

        return [
            {
                "text": row["content"],
                "page": row.get("page", 0),
                "similarity": row.get("similarity", 0.0),
            }
            for row in result.data
        ]

    except Exception as exc:
        logger.error("search_pgvector failed: %s", exc)
        return []


def fetch_all_chunks_from_pgvector(paper_id: str) -> list[dict]:
    """
    Fetches all stored chunks for a paper_id (used by summarization).
    Returns list of {text, page}.
    """
    client = _get_client()
    if client is None:
        return []

    try:
        result = (
            client.table("paper_chunks")
            .select("content, page")
            .eq("paper_id", paper_id)
            .order("page")
            .execute()
        )

        if not result.data:
            return []

        return [
            {"text": row["content"], "page": row.get("page", 0)}
            for row in result.data
        ]

    except Exception as exc:
        logger.error("fetch_all_chunks_from_pgvector failed: %s", exc)
        return []
