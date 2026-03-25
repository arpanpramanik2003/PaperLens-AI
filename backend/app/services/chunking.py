"""
Chunking strategies:
- chunk_text_semantic : character-based with sentence awareness (existing, backward-compat)
- chunk_text_by_tokens: token-based (new, 500-800 tokens, for pgvector pipeline)
"""
from __future__ import annotations

import re
from typing import Iterable

from app.core.config import settings

# Approximate words-to-tokens multiplier (GPT-style BPE is ~1.3 tokens/word).
_WORDS_PER_TOKEN = 0.75  # inverse: tokens_to_words


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sentence_split(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    return [s.strip() for s in sentences if s.strip()]


def _approx_token_count(text: str) -> int:
    """Rough token estimate: words / 0.75 ≈ tokens."""
    word_count = len(text.split())
    return max(1, int(word_count / _WORDS_PER_TOKEN))


# ---------------------------------------------------------------------------
# Existing (character-based semantic chunking) — preserved for backward compat
# ---------------------------------------------------------------------------

def chunk_text_semantic(
    pages: Iterable[dict],
    chunk_size: int | None = None,
    overlap_size: int | None = None,
) -> list[dict]:
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap_size = overlap_size if overlap_size is not None else settings.CHUNK_OVERLAP

    chunks: list[dict] = []
    chunk_id = 0

    for page in pages:

        sentences = sentence_split(page["text"])
        current_chunk = ""

        for sentence in sentences:

            if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                current_chunk = f"{current_chunk} {sentence}".strip()
            else:

                if current_chunk:
                    chunks.append({
                        "chunk_id": chunk_id,
                        "page": page["page"],
                        "text": current_chunk.strip()
                    })
                    chunk_id += 1

                overlap = current_chunk[-overlap_size:] if overlap_size > 0 else ""
                current_chunk = f"{overlap} {sentence}".strip()

        if current_chunk:
            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": current_chunk.strip()
            })
            chunk_id += 1

    return chunks


# ---------------------------------------------------------------------------
# New: Token-based chunking (500–800 tokens per chunk)
# ---------------------------------------------------------------------------

def chunk_text_by_tokens(
    pages: Iterable[dict],
    max_tokens: int | None = None,
    overlap_tokens: int | None = None,
) -> list[dict]:
    """
    Token-aware chunking using word-count approximation.
    Target: 500-800 tokens per chunk (configurable via TOKEN_CHUNK_SIZE env var).

    Args:
        pages: iterable of {page: int, text: str}
        max_tokens: max tokens per chunk (default: settings.TOKEN_CHUNK_SIZE = 700)
        overlap_tokens: overlap tokens between chunks (default: settings.TOKEN_CHUNK_OVERLAP = 100)

    Returns:
        list of {chunk_id, page, text, token_count}
    """
    max_tokens = max_tokens or settings.TOKEN_CHUNK_SIZE
    overlap_tokens = overlap_tokens if overlap_tokens is not None else settings.TOKEN_CHUNK_OVERLAP

    # Convert token limits to approximate word counts
    max_words = int(max_tokens * _WORDS_PER_TOKEN)
    overlap_words = int(overlap_tokens * _WORDS_PER_TOKEN)

    chunks: list[dict] = []
    chunk_id = 0

    for page in pages:
        text = page["text"].strip()
        if not text:
            continue

        words = text.split()
        pos = 0

        while pos < len(words):
            end = min(pos + max_words, len(words))
            chunk_words = words[pos:end]
            chunk_text = " ".join(chunk_words).strip()

            if chunk_text:
                chunks.append({
                    "chunk_id": chunk_id,
                    "page": page["page"],
                    "text": chunk_text,
                    "token_count": _approx_token_count(chunk_text),
                })
                chunk_id += 1

            # Advance with overlap
            step = max_words - overlap_words
            if step <= 0:
                step = max_words  # safety: avoid infinite loop
            pos += step

    return chunks
