import re
import logging

from app.services.cache import get_active_indexes
from app.services.model_fallback import (
    create_completion_with_fallback,
)

from .client import client


logger = logging.getLogger(__name__)
PAPER_ANALYZER_PRIMARY_MODEL = "qwen/qwen3-32b"
PAPER_ANALYZER_FALLBACK_MODELS = "llama-3.1-8b-instant"
PAPER_ANALYZER_MAX_TOKENS = 1200
PAPER_ANALYZER_SUMMARY_MAX_TOKENS = 320

logger.info(
    "Model routing: paper analyzer primary='%s', fallbacks='%s'",
    PAPER_ANALYZER_PRIMARY_MODEL,
    PAPER_ANALYZER_FALLBACK_MODELS,
)


def enforce_strict_analysis_format(text):

    if not text:
        return text

    cleaned = text.replace("\r\n", "\n")

    # Strip accidental reasoning blocks if model emits internal tags.
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)

    cleaned = re.sub(r"([^\n])\s*(#{2,6})(?!#)\s*", r"\1\n\n\2 ", cleaned)
    cleaned = re.sub(r"^(\s*#{2,6})([^\s#])", r"\1 \2", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\*\*(.+?)\*\*\s*$", r"## \1", cleaned, flags=re.MULTILINE)

    # Drop any preface before the first section-like heading.
    first_heading = re.search(
        r"^\s*(?:#{1,6}\s+|(?:summary|overview|problem statement|methodology|approach|results|findings|limitations|future work)\s*$)",
        cleaned,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    if first_heading:
        cleaned = cleaned[first_heading.start():]

    # Normalize plain section labels into markdown headings for consistent rendering.
    cleaned = re.sub(
        r"^\s*(summary|overview|problem statement|methodology|approach|results|findings|limitations|future work)\s*$",
        r"## \1",
        cleaned,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    return cleaned.strip()


def summarize_chunks(chunks):

    summaries = []

    chunks = sample_chunks_evenly(chunks, 3)

    for chunk in chunks:

        response = create_completion_with_fallback(
            llm_client=client,
            task_name="paper_analyzer_chunk_summary",
            primary_model=PAPER_ANALYZER_PRIMARY_MODEL,
            fallback_models=PAPER_ANALYZER_FALLBACK_MODELS,
            max_tokens=PAPER_ANALYZER_SUMMARY_MAX_TOKENS,
            messages=[
                {
                    "role": "system",
                    "content": "You summarize academic text faithfully and concisely."
                },
                {
                    "role": "user",
                    "content": f"""
Summarize this part of a research paper. Keep key details, avoid speculation.

Text:
{chunk["text"]}
"""
                }
            ],
        )

        summaries.append(response.choices[0].message.content)

    return " ".join(summaries)


def sample_chunks_evenly(chunks, max_chunks):

    if len(chunks) <= max_chunks:
        return chunks

    step = max(1, len(chunks) // max_chunks)

    sampled = chunks[::step]

    return sampled[:max_chunks]


def get_total_pages():

    _, _, chunks = get_active_indexes()

    if not chunks:
        return None

    pages = [c.get("page") for c in chunks if c.get("page") is not None]

    if not pages:
        return None

    return max(pages)


def get_first_page_chunks(max_chunks=3):

    _, _, chunks = get_active_indexes()

    if not chunks:
        return []

    first_page_chunks = [c for c in chunks if c.get("page") == 1]

    first_page_chunks = sorted(first_page_chunks, key=lambda c: c.get("chunk_id", 0))

    return first_page_chunks[:max_chunks]


def pick_chunks_by_keywords(chunks, keywords, max_chunks=6):

    if not keywords:
        return []

    lowered = [k.lower() for k in keywords]
    matched = []

    for chunk in chunks:
        text = chunk["text"].lower()
        if any(key in text for key in lowered):
            matched.append(chunk)
        if len(matched) >= max_chunks:
            break

    return matched


def extract_metrics(chunks, max_items=8):

    patterns = [
        r"\bMAE\b[^\n]*?\d+(?:\.\d+)?",
        r"\bMAPE\b[^\n]*?\d+(?:\.\d+)?",
        r"\bRMSE\b[^\n]*?\d+(?:\.\d+)?",
        r"\bparameters?\b[^\n]*?\d+(?:\.\d+)?\s*[kKmM]?",
        r"\b\d+(?:\.\d+)?\s*(?:min|minutes)\b"
    ]

    hits = []

    for chunk in chunks:
        text = chunk["text"]
        for pattern in patterns:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            for match in matches:
                cleaned = " ".join(match.split())
                hits.append({
                    "text": cleaned,
                    "chunk_id": chunk["chunk_id"],
                    "page": chunk["page"]
                })

    seen = set()
    unique = []

    for item in hits:
        key = item["text"].lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
        if len(unique) >= max_items:
            break

    return unique


def format_context(chunks):

    if not chunks:
        return ""

    return "\n\n".join(
        [
            f"[Page {c['page']}]\n{c['text']}"
            for c in chunks
        ]
    )


def build_analysis_prompt(summary_text):

    return f"""
Analyze the following summarized research paper.

Return the response in Markdown format with these sections:

- Core summary
- Problem statement
- Methodology
- Results (include explicit metrics if available)
- Limitations
- Future work

Rules:
- Use only the provided summary text and section contexts.
- If a section is not explicitly stated, you may infer it, but label it as "Inferred:".
- Keep each section concise and specific.
- Write the Summary as a short paragraph (not bullets).
- Use pointwise formatting for remaining sections (short bullet points, not long prose blocks).
- Prefer 3-6 bullets per non-summary section when content is available.

Paper summary:
{summary_text}
"""


def analyze_paper(chunks):

    summary_chunks = sample_chunks_evenly(chunks, 3)
    summary_context = format_context(summary_chunks)

    sections = {
        "Problem Statement": pick_chunks_by_keywords(
            chunks,
            ["problem", "challenge", "motivation", "objective", "aim", "goal"],
            max_chunks=2
        ),
        "Methodology": pick_chunks_by_keywords(
            chunks,
            ["method", "approach", "model", "architecture", "framework", "training", "algorithm"],
            max_chunks=2
        ),
        "Results": pick_chunks_by_keywords(
            chunks,
            ["result", "evaluation", "experiment", "performance", "metric", "accuracy", "mae", "rmse"],
            max_chunks=2
        ),
        "Limitations": pick_chunks_by_keywords(
            chunks,
            ["limitation", "limitations", "drawback", "constraint", "threat", "shortcoming"],
            max_chunks=1
        ),
        "Future Work": pick_chunks_by_keywords(
            chunks,
            ["future work", "future", "extension", "next step", "direction"],
            max_chunks=1
        )
    }

    metrics = extract_metrics(chunks, max_items=4)
    metrics_context = "\n".join(
        [f"- {m['text']} [Page {m['page']}]" for m in metrics]
    )

    prompt = f"""
You are a research assistant.

Write a structured markdown analysis of the paper using ONLY the context provided for each section.

Rules:
- Use section headings in markdown, but choose heading wording naturally (do not force exact fixed phrases).
- Cover themes in this preferred sequence: summary, problem statement, methodology, results, limitations, future work.
- Keep one heading per section and separate sections clearly.
- Do NOT reveal chain-of-thought, scratchpad notes, or any internal reasoning.
- Never output tags like <think> or meta commentary such as "let's think".
- Leave one blank line between sections.
- Summary section must be a short coherent paragraph.
- For all non-summary sections, present content as concise pointwise bullets.
- Prefer short bullets with one idea per bullet; avoid dense paragraph blocks.
- If a section context is empty, you may infer likely points, but label them clearly as "Inferred:".
- Use citations like [Page 2] to support any explicit claims.
- Keep each section concise and specific.
- In Results, include explicit numeric metrics if any are provided in "Key Metrics".
- If metrics are present, list them as short bullet points before the narrative sentence.
- Avoid vague results like "best" or "competitive" without citing metrics.
- If no metrics are available, explicitly say "Metrics not provided in extracted context."

Summary context:
{summary_context}

Problem statement context:
{format_context(sections["Problem Statement"]) or summary_context}

Methodology context:
{format_context(sections["Methodology"]) or summary_context}

Results context:
{format_context(sections["Results"]) or summary_context}

Key Metrics (use if relevant):
{metrics_context}

Limitations context:
{format_context(sections["Limitations"]) or ""}

Future work context:
{format_context(sections["Future Work"]) or ""}
"""

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="paper_analyzer_structured_analysis",
        primary_model=PAPER_ANALYZER_PRIMARY_MODEL,
        fallback_models=PAPER_ANALYZER_FALLBACK_MODELS,
        max_tokens=PAPER_ANALYZER_MAX_TOKENS,
        messages=[
            {
                "role": "system",
                "content": "You write concise, well-structured markdown research analyses with clear section headings and grounded claims."
            },
            {"role": "user", "content": prompt}
        ],
    )

    return enforce_strict_analysis_format(response.choices[0].message.content)


def stream_completion(prompt, system_text):

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="paper_analyzer_stream",
        primary_model=PAPER_ANALYZER_PRIMARY_MODEL,
        fallback_models=PAPER_ANALYZER_FALLBACK_MODELS,
        max_tokens=PAPER_ANALYZER_MAX_TOKENS,
        messages=[
            {"role": "system", "content": system_text},
            {"role": "user", "content": prompt}
        ],
        stream=True,
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
