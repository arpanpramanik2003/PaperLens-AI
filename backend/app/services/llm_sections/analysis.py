import re
import logging

from app.services.cache import get_active_indexes
from app.services.model_fallback import (
    create_completion_with_fallback,
)

from .client import client


logger = logging.getLogger(__name__)
PAPER_ANALYZER_PRIMARY_MODEL = "llama-3.3-70b-versatile"
PAPER_ANALYZER_FALLBACK_MODELS = "llama-3.1-8b-instant,llama3-70b-8192,llama3-8b-8192"
PAPER_ANALYZER_MAX_TOKENS = 1200
PAPER_ANALYZER_SUMMARY_MAX_TOKENS = 320

logger.info(
    "Model routing: paper analyzer primary='%s', fallbacks='%s'",
    PAPER_ANALYZER_PRIMARY_MODEL,
    PAPER_ANALYZER_FALLBACK_MODELS,
)


def enforce_strict_analysis_format(text: str) -> str:
    if not text:
        return ""

    sections = [
        ("summary", "Executive Summary"),
        ("problem_statement", "Problem Statement"),
        ("methodology", "Methodology"),
        ("results", "Results"),
        ("limitations", "Limitations"),
        ("future_work", "Future Work"),
    ]

    out_sections = []
    for tag, title in sections:
        match = re.search(f"<{tag}>(.*?)</{tag}>", text, flags=re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            if content:
                out_sections.append(f"## {title}\n{content}")

    if out_sections:
        return "\n\n".join(out_sections)

    # Fallback if raw markdown was produced instead of XML tags
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.IGNORECASE | re.DOTALL).strip()
    return cleaned


def summarize_chunks(chunks):
    if not chunks:
        return ""

    sampled = sample_chunks_evenly(chunks, 3)
    excerpts = "\n\n---\n\n".join([f"Excerpt {idx + 1} (Page {c.get('page', 1)}):\n{c['text']}" for idx, c in enumerate(sampled)])

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="paper_analyzer_batched_chunk_summary",
            primary_model=PAPER_ANALYZER_PRIMARY_MODEL,
            fallback_models=PAPER_ANALYZER_FALLBACK_MODELS,
            max_tokens=500,
            messages=[
                {
                    "role": "system",
                    "content": "You summarize research paper excerpts faithfully and concisely into a single unified summary."
                },
                {
                    "role": "user",
                    "content": f"Summarize key methodological insights and findings across these research paper excerpts into a single coherent paragraph:\n\n{excerpts}"
                }
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Batched summarize_chunks failed: %s", exc)
        return " ".join([c["text"][:200] for c in sampled])


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

    first_page_chunks = [c for c in chunks if c.get("page") in (0, 1)]

    if not first_page_chunks:
        first_page_chunks = chunks[:max_chunks]
    else:
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

    prob_ctx = format_context(sections["Problem Statement"])
    meth_ctx = format_context(sections["Methodology"])
    res_ctx = format_context(sections["Results"])
    lim_ctx = format_context(sections["Limitations"])
    fut_ctx = format_context(sections["Future Work"])

    prompt = f"""
You are a research assistant.

Write a structured research paper analysis using ONLY the context provided for each section.

OUTPUT FORMAT REQUIREMENTS:
You MUST structure your response using these exact XML section tags:

<summary>
Short coherent paragraph summary.
</summary>

<problem_statement>
- Concise bullet points of key problem statement details.
</problem_statement>

<methodology>
- Concise bullet points of methodology details.
</methodology>

<results>
- Concise bullet points of results and key metrics.
</results>

<limitations>
- Concise bullet points of limitations.
</limitations>

<future_work>
- Concise bullet points of future directions.
</future_work>

Rules:
- Do NOT output any preamble, meta commentary, or tags like <think>.
- Use citations like [Page 2] to support any explicit claims.
- For all bulleted sections, keep items concise and specific.
- If a section specific context indicates to refer to Shared Document Summary Context, extract or infer relevant points from Shared Document Summary Context and label inferred points as "Inferred:".

Shared Document Summary Context:
{summary_context}

Problem Statement Specific Context:
{prob_ctx if prob_ctx else "(Refer to Shared Document Summary Context above)"}

Methodology Specific Context:
{meth_ctx if meth_ctx else "(Refer to Shared Document Summary Context above)"}

Results Specific Context:
{res_ctx if res_ctx else "(Refer to Shared Document Summary Context above)"}

Key Metrics (use if relevant):
{metrics_context if metrics_context else "(None extracted)"}

Limitations Specific Context:
{lim_ctx if lim_ctx else "(None extracted)"}

Future Work Specific Context:
{fut_ctx if fut_ctx else "(None extracted)"}
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
                "content": "You write concise research analyses strictly formatted with explicit XML section tags (<summary>, <problem_statement>, <methodology>, <results>, <limitations>, <future_work>)."
            },
            {"role": "user", "content": prompt}
        ],
    )



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
