import re

from groq import Groq

from app.core.config import settings
from app.services.cache import get_active_indexes
from app.services.retrieval import search_chunks

client = Groq(api_key=settings.GROQ_API_KEY)


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
                snippets.append(f"[Page {c['page']}] {snippet}")
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
        context += f"[Page {c['page']}]\n{c['text']}\n\n"

    prompt = f"""
You are a research assistant.

Answer the question using the research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
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
                snippets.append(f"[Page {c['page']}] {snippet}")
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
        context += f"[Page {c['page']}]\n{c['text']}\n\n"

    prompt = f"""
You are a research assistant.

Answer the question using the research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
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


import json

def generate_experiment_plan(topic: str, difficulty: str) -> dict:

    prompt = f"""
You are an expert AI researcher. Generate a highly constructive, rich, and technical AI/ML experiment execution plan for the topic: "{topic}" at a {difficulty} difficulty level.

You MUST respond strictly in JSON format matching the following structure exactly. Do not include any other text.
{{
  "steps": [
    {{
      "num": 1,
      "title": "Stage Title",
      "iconName": "IconName",
      "details": "Deeply technical strategy description.",
      "params": "Specific metrics, hyperparams, or dataset identifiers",
      "risks": "Nuanced technical risks or edge cases"
    }}
  ]
}}

Number of steps to generate based on difficulty:
- Beginner: 5-6 steps
- Intermediate: 6-8 steps
- Advanced: 8-10 steps

Encouraged Modules (especially for Advanced):
- Dataset Selection & Curation (Icon: "Database")
- Advanced Preprocessing / Feature Engineering (Icon: "Cog")
- Custom Model Architecture Design (Icon: "Cpu" or "PenTool")
- Training Logic & Optimization (Icon: "Play")
- Explainable AI (XAI) / Interpretability (Icon: "Eye")
- Robust Evaluation & Ablation (Icon: "BarChart3")
- Deployment, Scaling & Monitoring (Icon: "Cloud")
- Ethical Review / Bias Mitigation (Icon: "Shield")

Valid iconNames (Lucide React): Database, Cog, Cpu, Play, BarChart3, FlaskConical, List, Eye, Cloud, PenTool, Shield, CheckCircle, Activity, Globe, Zap.
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a senior AI researcher designed to return perfect JSON structures."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)


def generate_research_problems(domain: str, subdomain: str, complexity: str) -> dict:

    prompt = f"""
You are a visionary AI research lead. Generate absolute top-tier, novel, and highly impactful research ideas for the domain: "{domain}" and subdomain: "{subdomain}" at a {complexity} complexity level.

You MUST respond strictly in JSON format matching the following structure exactly:
{{
  "ideas": [
    {{
      "title": "Title of the research problem",
      "desc": "A deep, constructive, and technical description of the research gap and proposed solution.",
      "tags": ["Tag1", "Tag2"],
      "rating": 5
    }}
  ]
}}

Guidelines:
- Generate 4 to 6 unique ideas.
- Ratings should be between 3 and 5 based on technical difficulty and impact.
- Tags should be specific (e.g., "NLP", "LLM", "XAI", "Optimization").
- Content should be highly "constructive" and "rich" in detail.
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a research ideation engine designed to output structured JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)


def expand_problem_details(domain: str, subdomain: str, complexity: str, idea: dict) -> dict:

        title = idea.get("title", "")
        description = idea.get("desc", "")
        tags = idea.get("tags", [])

        prompt = f"""
You are an expert AI research mentor.

Given an EXISTING research problem idea, expand it into a practical, step-by-step execution brief.

Important constraints:
- Keep the SAME core problem statement; do not invent a different problem.
- Keep the same research intent as the provided title and description.
- Be concrete, practical, and implementation-oriented.

You MUST respond strictly in JSON format matching this structure exactly:
{{
    "title": "Original problem title",
    "problem_statement": "Refined one-paragraph statement of the same problem",
    "objective": "Primary measurable objective",
    "step_by_step": [
        {{
            "step": 1,
            "title": "Step title",
            "details": "What to do in this step"
        }}
    ],
    "datasets": ["Dataset/tool 1"],
    "evaluation_metrics": ["Metric 1"],
    "expected_outcomes": ["Outcome 1"]
}}

Rules:
- Generate 6 to 8 steps in step_by_step.
- Keep each step clear and actionable.
- Include only technically relevant datasets/tools.
- Keep metrics aligned with the problem domain.

Context:
- Domain: {domain}
- Subdomain: {subdomain}
- Complexity: {complexity}
- Title: {title}
- Description: {description}
- Tags: {", ".join(tags) if isinstance(tags, list) else str(tags)}
"""

        response = client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=[
                        {
                                "role": "system",
                                "content": "You expand existing research ideas into detailed execution plans and return strict JSON."
                        },
                        {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        if not result.get("title"):
                result["title"] = title

        return result


def detect_research_gaps(analysis_text: str) -> dict:

    prompt = f"""
You are an elite, highly critical research peer reviewer. Analyze the following summary of a research paper and identify 4 to 6 specific, technical research gaps.

For each gap, provide:
- title: A concise, impactful name for the gap.
- explanation: A detailed, constructive explanation of the weakness or missing element.
- severity: One of "low", "medium", or "high".
- suggestion: A specific, actionable research direction or experiment to bridge this gap.

You MUST respond strictly in JSON format matching the following structure exactly:
{{
  "gaps": [
    {{
      "title": "Title",
      "explanation": "Explanation",
      "severity": "high",
      "suggestion": "Suggestion"
    }}
  ]
}}

Paper Summary:
{analysis_text}
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a critical research reviewer designed to output structured JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
