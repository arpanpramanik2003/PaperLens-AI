import re

from app.core.config import settings
from app.services.cache import get_active_indexes

from .client import client


def enforce_strict_analysis_format(text):

    if not text:
        return text

    cleaned = text.replace("\r\n", "\n")

    cleaned = re.sub(r"([^\n])\s*(#{2,6})(?!#)\s*", r"\1\n\n\2 ", cleaned)
    cleaned = re.sub(r"^(\s*#{2,6})([^\s#])", r"\1 \2", cleaned, flags=re.MULTILINE)

    first_heading = re.search(
        r"^\s*##\s*(Summary|Problem Statement|Methodology|Results(?:\s*\(.*?\))?|Limitations|Future Work)\b",
        cleaned,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    if first_heading:
        cleaned = cleaned[first_heading.start():]

    return cleaned.strip()


def summarize_chunks(chunks):

    summaries = []

    chunks = sample_chunks_evenly(chunks, 3)

    for chunk in chunks:

        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
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
            ]
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

## Summary
## Problem Statement
## Methodology
## Results (include explicit metrics if available)
## Limitations
## Future Work

Rules:
- Use only the provided summary text and section contexts.
- If a section is not explicitly stated, you may infer it, but label it as "Inferred:".
- Keep each section concise and specific.

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

Write a structured analysis of the paper using ONLY the context provided for each section.

Rules:
- Output MUST start with exactly "## Summary" as the first non-whitespace text.
- Do NOT include any title, preface, greeting, or text before "## Summary".
- Use each required section heading exactly once and in this order.
- Put every heading on its own line using markdown (## Heading).
- Leave one blank line between sections.
- If a section context is empty, you may infer likely points, but label them clearly as "Inferred:".
- Use citations like [Page 2] to support any explicit claims.
- Keep each section concise and specific.
- In Results, include explicit numeric metrics if any are provided in "Key Metrics".
- If metrics are present, list them as short bullet points before the narrative sentence.
- Avoid vague results like "best" or "competitive" without citing metrics.
- If no metrics are available, explicitly say "Metrics not provided in extracted context."

## Summary
Context:
{summary_context}

## Problem Statement
Context:
{format_context(sections["Problem Statement"]) or summary_context}

## Methodology
Context:
{format_context(sections["Methodology"]) or summary_context}

## Results
Context:
{format_context(sections["Results"]) or summary_context}

Key Metrics (use if relevant):
{metrics_context}

## Limitations
Context:
{format_context(sections["Limitations"]) or ""}

## Future Work
Context:
{format_context(sections["Future Work"]) or ""}
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You write strict markdown research summaries. Never add a title before the first required heading."
            },
            {"role": "user", "content": prompt}
        ]
    )

    return enforce_strict_analysis_format(response.choices[0].message.content)


def stream_completion(prompt, system_text):

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": system_text},
            {"role": "user", "content": prompt}
        ],
        stream=True
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
