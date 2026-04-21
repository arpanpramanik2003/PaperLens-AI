"""
Map-Reduce summarization pipeline using Groq LLaMA 3.

Map  : Summarize each chunk independently (parallel-safe, rate-limited).
Reduce: Combine all chunk summaries into one final cohesive summary.

Designed for large PDFs (20-50 pages) without exceeding token limits.
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from app.core.config import settings
from app.services.llm_sections.client import client
from app.services.model_fallback import (
    DEFAULT_FALLBACK_MODELS,
    DEFAULT_PRIMARY_MODEL,
    create_completion_with_fallback,
)

logger = logging.getLogger(__name__)

SUMMARIZATION_PRIMARY_MODEL = DEFAULT_PRIMARY_MODEL
SUMMARIZATION_FALLBACK_MODELS = DEFAULT_FALLBACK_MODELS

# Rate-limit guard: minimum seconds between consecutive Groq map calls
# Groq free tier allows ~30 requests/min for llama-3.1-8b-instant
_MAP_CALL_DELAY_SECS = 2.0
_REDUCE_MAX_TOKENS = 1500
_MAP_MAX_TOKENS = 400


# ---------------------------------------------------------------------------
# Sample chunks evenly when too many exist
# ---------------------------------------------------------------------------

def _sample_evenly(chunks: list[dict], limit: int) -> list[dict]:
    """Returns at most `limit` chunks sampled evenly from the full list."""
    if len(chunks) <= limit:
        return chunks
    step = max(1, len(chunks) // limit)
    return chunks[::step][:limit]


# ---------------------------------------------------------------------------
# MAP step: summarize one chunk
# ---------------------------------------------------------------------------

def map_summarize_chunk(chunk_text: str) -> Optional[str]:
    """
    Summarizes a single chunk of text using Groq.
    Returns summary string or None on failure.
    """
    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="map_reduce_chunk_summary",
            primary_model=SUMMARIZATION_PRIMARY_MODEL,
            fallback_models=SUMMARIZATION_FALLBACK_MODELS,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise academic summarizer. "
                        "Summarize the provided research paper excerpt in 3-5 sentences. "
                        "Preserve key findings, methods, and numbers. Be concise."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Summarize this excerpt:\n\n{chunk_text}",
                },
            ],
            max_tokens=_MAP_MAX_TOKENS,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("map_summarize_chunk failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# REDUCE step: combine chunk summaries
# ---------------------------------------------------------------------------

def reduce_summaries(summaries: list[str], paper_hint: str = "") -> str:
    """
    Combines per-chunk summaries into one final, well-structured summary.
    `paper_hint` is an optional known title/context for better framing.
    """
    joined = "\n\n---\n\n".join(
        [f"Chunk {i + 1}:\n{s}" for i, s in enumerate(summaries)]
    )

    prompt = f"""You are a senior research analyst.

Below are individual summaries of different sections of a research paper.
Combine them into ONE cohesive, complete summary covering:
- Main problem addressed
- Methods and approach
- Key results and findings
- Conclusions

Rules:
- Do NOT list summaries separately. Write a unified narrative.
- Keep it under 500 words.
- Be specific: include numbers, metrics, and method names when present.
- Do NOT speculate beyond what is stated.

{f"Paper context: {paper_hint}" if paper_hint else ""}

Individual chunk summaries:
{joined}
"""

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="map_reduce_reduce_summary",
            primary_model=SUMMARIZATION_PRIMARY_MODEL,
            fallback_models=SUMMARIZATION_FALLBACK_MODELS,
            messages=[
                {"role": "system", "content": "You combine research summaries into a single coherent narrative."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=_REDUCE_MAX_TOKENS,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("reduce_summaries failed: %s", exc)
        # Graceful fallback: return concatenated chunk summaries
        return "\n\n".join(summaries)


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------

def run_map_reduce_summarization(
    chunks: list[dict],
    paper_hint: str = "",
) -> str:
    """
    Orchestrates full map-reduce summarization for a list of chunks.

    Args:
        chunks: list of {text, page, ...} dicts
        paper_hint: optional title/topic hint for reduce step

    Returns:
        Final summary string.
    """
    if not chunks:
        return "No content available to summarize."

    limit = settings.SUMMARIZE_MAP_CHUNK_LIMIT
    sampled = _sample_evenly(chunks, limit)

    logger.info(
        "Map-reduce: %d total chunks, %d sampled for map step",
        len(chunks),
        len(sampled),
    )

    # MAP phase (sequential with rate-limit delay to respect Groq free tier)
    summaries: list[str] = []
    for i, chunk in enumerate(sampled):
        if i > 0:
            time.sleep(_MAP_CALL_DELAY_SECS)

        summary = map_summarize_chunk(chunk["text"])
        if summary:
            summaries.append(summary)

    if not summaries:
        return "Could not generate summary — all map steps failed."

    # REDUCE phase
    logger.info("Reduce step: combining %d chunk summaries", len(summaries))
    return reduce_summaries(summaries, paper_hint=paper_hint)
