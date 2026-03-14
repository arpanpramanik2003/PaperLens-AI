import re

from groq import Groq

from app.core.config import settings
from app.services.cache import get_active_indexes
from app.services.retrieval import search_chunks

client = Groq(api_key=settings.GROQ_API_KEY)


def summarize_chunks(chunks):

    summaries = []

    chunks = sample_chunks_evenly(chunks, 10)

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
            f"[Chunk {c['chunk_id']} | Page {c['page']}]\n{c['text']}"
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

    summary_chunks = sample_chunks_evenly(chunks, 10)
    summary_context = format_context(summary_chunks)

    sections = {
        "Problem Statement": pick_chunks_by_keywords(
            chunks,
            ["problem", "challenge", "motivation", "objective", "aim", "goal"]
        ),
        "Methodology": pick_chunks_by_keywords(
            chunks,
            ["method", "approach", "model", "architecture", "framework", "training", "algorithm"]
        ),
        "Results": pick_chunks_by_keywords(
            chunks,
            ["result", "evaluation", "experiment", "performance", "metric", "accuracy", "mae", "rmse"]
        ),
        "Limitations": pick_chunks_by_keywords(
            chunks,
            ["limitation", "limitations", "drawback", "constraint", "threat", "shortcoming"]
        ),
        "Future Work": pick_chunks_by_keywords(
            chunks,
            ["future work", "future", "extension", "next step", "direction"]
        )
    }

    metrics = extract_metrics(chunks)
    metrics_context = "\n".join(
        [f"- {m['text']} [Chunk {m['chunk_id']} | Page {m['page']}]" for m in metrics]
    )

    prompt = f"""
You are a research assistant.

Write a structured analysis of the paper using ONLY the context provided for each section.

Rules:
- If a section context is empty, you may infer likely points, but label them clearly as "Inferred:".
- Use citations like [Chunk 3 | Page 2] to support any explicit claims.
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
                "content": "You write structured research summaries with citations and label inferred items clearly."
            },
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


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


def answer_question(question):
    q_lower = question.lower()

    if any(
        phrase in q_lower
        for phrase in [
            "how many pages",
            "total pages",
            "page count",
            "number of pages",
            "pages in the paper",
            "pages does the paper",
        ]
    ):
        total_pages = get_total_pages()
        if total_pages is not None:
            return f"The document has {total_pages} pages based on the extracted file."
        return "Page count not available from the extracted file."

    if "author" in q_lower or "authors" in q_lower:
        first_page = get_first_page_chunks()
        if first_page:
            snippets = []
            for c in first_page:
                snippet = c["text"][:220].strip()
                snippets.append(f"[Chunk {c['chunk_id']} | Page {c['page']}] {snippet}")
            return "Possible author lines from the first page:\n" + "\n".join(snippets)
        else:
            return "Author names not found in the extracted first page."

    relevant_chunks = search_chunks(question)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            return "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."

    if not relevant_chunks:
        return "Not mentioned in the paper."

    context = ""

    for c in relevant_chunks:
        context += f"[Chunk {c['chunk_id']} | Page {c['page']}]\n{c['text']}\n\n"

    prompt = f"""
You are a research assistant.

Answer the question using the research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite chunk numbers like [Chunk 2 | Page 5] for any explicit claims.
- Be concise and academic.

Context:
{context}

Question:
{question}
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


def stream_answer(question):
    q_lower = question.lower()

    if any(
        phrase in q_lower
        for phrase in [
            "how many pages",
            "total pages",
            "page count",
            "number of pages",
            "pages in the paper",
            "pages does the paper",
        ]
    ):
        total_pages = get_total_pages()
        if total_pages is not None:
            yield f"The document has {total_pages} pages based on the extracted file."
        else:
            yield "Page count not available from the extracted file."
        return

    if "author" in q_lower or "authors" in q_lower:
        first_page = get_first_page_chunks()
        if first_page:
            snippets = []
            for c in first_page:
                snippet = c["text"][:220].strip()
                snippets.append(f"[Chunk {c['chunk_id']} | Page {c['page']}] {snippet}")
            yield "Possible author lines from the first page:\n" + "\n".join(snippets)
        else:
            yield "Author names not found in the extracted first page."
        return

    relevant_chunks = search_chunks(question)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            yield "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."
            return

    if not relevant_chunks:
        yield "Not mentioned in the paper."
        return

    context = ""

    for c in relevant_chunks:
        context += f"[Chunk {c['chunk_id']} | Page {c['page']}]\n{c['text']}\n\n"

    prompt = f"""
You are a research assistant.

Answer the question using the research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite chunk numbers like [Chunk 2 | Page 5] for any explicit claims.
- Be concise and academic.

Context:
{context}

Question:
{question}
"""

    for token in stream_completion(
        prompt,
        "You answer with strict grounding and citations."
    ):
        yield token
