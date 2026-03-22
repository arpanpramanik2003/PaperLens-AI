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


def _normalize_history(history, max_turns=8):

    if not history:
        return []

    normalized = []

    for turn in history:
        if not isinstance(turn, dict):
            continue

        role = (turn.get("role") or "").strip().lower()
        text = (turn.get("text") or turn.get("content") or "").strip()

        if not text:
            continue

        if role == "ai":
            role = "assistant"
        if role not in ["user", "assistant"]:
            continue

        normalized.append({"role": role, "text": text})

    return normalized[-max_turns:]


def _is_follow_up_question(question):

    q = question.strip().lower()

    follow_up_phrases = [
        "are you sure",
        "why",
        "how so",
        "what about",
        "can you verify",
        "can you confirm",
        "explain that",
        "what do you mean",
        "really",
        "is that correct",
    ]

    if len(q) <= 40:
        return True

    return any(phrase in q for phrase in follow_up_phrases)


def _build_retrieval_query(question, history):

    if not history:
        return question

    if not _is_follow_up_question(question):
        return question

    last_user_question = None
    for turn in reversed(history):
        if turn["role"] == "user" and turn["text"].strip().lower() != question.strip().lower():
            last_user_question = turn["text"]
            break

    if not last_user_question:
        return question

    return f"{last_user_question}\nFollow-up: {question}"


def _format_history_for_prompt(history):

    if not history:
        return ""

    lines = []
    for turn in history:
        speaker = "User" if turn["role"] == "user" else "Assistant"
        lines.append(f"{speaker}: {turn['text']}")

    return "\n".join(lines)


def _get_last_qa_pair(history):

    if not history:
        return ("", "")

    last_user = ""
    last_assistant = ""

    for turn in reversed(history):
        if not last_assistant and turn["role"] == "assistant":
            last_assistant = turn["text"]
        elif not last_user and turn["role"] == "user":
            last_user = turn["text"]

        if last_user and last_assistant:
            break

    return (last_user, last_assistant)


def answer_question(question, history=None):
    history_turns = _normalize_history(history)
    is_follow_up = _is_follow_up_question(question)
    prev_user_q, prev_assistant_a = _get_last_qa_pair(history_turns)
    q_lower = question.lower()

    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        return "Great — let me know if you want a summary, key findings, or deeper verification from the paper."

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

    retrieval_query = _build_retrieval_query(question, history_turns)
    relevant_chunks = search_chunks(retrieval_query)

    if "limitation" in question.lower() or "limitations" in question.lower():
        if not any("limitation" in c["text"].lower() for c in relevant_chunks):
            return "Inferred: The paper does not explicitly list limitations; likely constraints include reliance on specific datasets and performance sensitivity to sensor noise."

    if not relevant_chunks:
        return "Not mentioned in the paper."

    context = ""

    for c in relevant_chunks:
        context += f"[Page {c['page']}]\n{c['text']}\n\n"

    conversation_history = _format_history_for_prompt(history_turns)
    follow_up_reference = ""

    if is_follow_up and (prev_user_q or prev_assistant_a):
        follow_up_reference = f"""
Follow-up reference:
- Previous user question: {prev_user_q or "(not available)"}
- Previous assistant answer: {prev_assistant_a or "(not available)"}
"""

    prompt = f"""
You are a research assistant.

Answer the latest user question using both conversation history and research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
- Be concise, academic, and conversationally aware.
- If the latest question is a follow-up (e.g., "are you sure?"), use prior turns to resolve what "that" refers to.
- Do NOT say that prior context is missing when conversation history exists.
- For confirmations like "are you sure?", explicitly confirm or correct the previous answer using the document context.

Conversation history:
{conversation_history or "(No prior turns)"}

{follow_up_reference}

Context:
{context}

Latest question:
{question}
"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a contextual research assistant. Resolve follow-up questions from prior turns, do not ask for clarification when enough history is present."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content


def stream_answer(question, history=None):
    history_turns = _normalize_history(history)
    is_follow_up = _is_follow_up_question(question)
    prev_user_q, prev_assistant_a = _get_last_qa_pair(history_turns)
    q_lower = question.lower()

    acknowledgement_phrases = {
        "ok", "okay", "ok good", "great", "nice", "cool", "got it", "understood",
        "thanks", "thank you", "perfect", "alright", "all right"
    }
    if q_lower.strip().rstrip(".! ") in acknowledgement_phrases:
        yield "Great — let me know if you want a summary, key findings, or deeper verification from the paper."
        return

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

    retrieval_query = _build_retrieval_query(question, history_turns)
    relevant_chunks = search_chunks(retrieval_query)

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

    conversation_history = _format_history_for_prompt(history_turns)
    follow_up_reference = ""

    if is_follow_up and (prev_user_q or prev_assistant_a):
        follow_up_reference = f"""
Follow-up reference:
- Previous user question: {prev_user_q or "(not available)"}
- Previous assistant answer: {prev_assistant_a or "(not available)"}
"""

    prompt = f"""
You are a research assistant.

Answer the latest user question using both conversation history and research paper context.

Rules:
- If the answer is not present, provide a brief inferred answer and label it as "Inferred:".
- Cite page numbers like [Page 5] for any explicit claims.
- Be concise, academic, and conversationally aware.
- If the latest question is a follow-up (e.g., "are you sure?"), use prior turns to resolve what "that" refers to.
- Do NOT say that prior context is missing when conversation history exists.
- For confirmations like "are you sure?", explicitly confirm or correct the previous answer using the document context.

Conversation history:
{conversation_history or "(No prior turns)"}

{follow_up_reference}

Context:
{context}

Latest question:
{question}
"""

    for token in stream_completion(
        prompt,
        "You are a contextual research assistant. Resolve follow-up questions from prior turns, do not ask for clarification when enough history is present."
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


def generate_dataset_benchmark_finder(project_title: str, project_plan: str) -> dict:

        prompt = f"""
You are an expert AI research advisor.

Given a project title and/or project plan, recommend the most suitable:
1) Datasets
2) Benchmarks
3) Commonly used technologies/frameworks in this domain

You MUST return strict JSON in this exact structure:
{{
    "domain_summary": "1-2 line understanding of the project domain",
    "datasets": [
        {{
            "name": "Dataset name",
            "fit_score": 4.7,
            "short_description": "Why this dataset is useful",
            "best_for": ["use-case 1", "use-case 2"],
            "details": {{
                "modality": "Text/Image/Audio/Multimodal/etc",
                "size": "Approx size or sample count",
                "license": "Known license or 'Varies'",
                "tasks": ["task 1", "task 2"],
                "pros": ["pro 1", "pro 2"],
                "limitations": ["limitation 1", "limitation 2"],
                "source_hint": "Where users can usually find it"
            }}
        }}
    ],
    "benchmarks": [
        {{
            "name": "Benchmark name",
            "fit_score": 4.6,
            "short_description": "Why this benchmark matches the project",
            "details": {{
                "primary_metrics": ["metric 1", "metric 2"],
                "evaluation_protocol": "How evaluation is typically performed",
                "baselines": ["baseline 1", "baseline 2"],
                "what_good_looks_like": "What constitutes strong performance",
                "pitfalls": ["pitfall 1", "pitfall 2"]
            }}
        }}
    ],
    "technologies": [
        {{
            "name": "Technology name",
            "category": "Framework/Library/Tool/MLOps",
            "reason": "Why this is commonly used",
            "used_for": ["purpose 1", "purpose 2"]
        }}
    ]
}}

Rules:
- Use project title and plan jointly when available.
- If one is missing, infer carefully from the available input.
- Return 4-6 datasets.
- Return 3-5 benchmarks.
- Return 5-8 technologies.
- fit_score must be a number from 1.0 to 5.0.
- Keep details practical and specific for implementation decisions.
- No markdown, no prose outside JSON.

Project title:
{project_title}

Project plan:
{project_plan}
"""

        response = client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=[
                        {"role": "system", "content": "You return strictly valid JSON for AI project dataset and benchmark recommendations."},
                        {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)


def generate_citation_recommendations(
        paper_context: str,
        top_cited: list[dict],
        missing_references: list[str],
    recommendation_mode: str = "upload",
) -> dict:

                compact_top_cited = []
                for entry in (top_cited or [])[:20]:
                        compact_top_cited.append(
                                {
                                        "title": entry.get("title"),
                                        "authors": entry.get("authors", [])[:5],
                                        "year": entry.get("year"),
                                        "citation_count": entry.get("citation_count", 0),
                                        "venue": entry.get("venue"),
                                }
                        )

                normalized_mode = (recommendation_mode or "upload").strip().lower()
                is_discovery_mode = normalized_mode == "discover"

                focus_label = "topic_focus" if is_discovery_mode else "paper_focus"
                context_label = "Project/topic context" if is_discovery_mode else "Paper context"

                prompt = f"""
You are an AI research mentor.

Task:
1) Understand the provided context.
2) Analyze citation evidence from matched top-cited references.
3) Provide actionable reading suggestions.

You MUST return strict JSON in this exact structure:
{{
    "{focus_label}": "1-2 sentence summary of the focus inferred from the provided context",
    "must_read": [
        {{
            "title": "Paper title",
            "why_read": "Why this paper is high-priority for the user",
            "priority": "high|medium"
        }}
    ],
    "reading_path": [
        "Step 1 reading strategy",
        "Step 2 reading strategy",
        "Step 3 reading strategy"
    ],
    "coverage_gaps": [
        "Topic gap inferred from missing or weak citations"
    ],
    "next_search_queries": [
        "search query 1",
        "search query 2",
        "search query 3"
    ]
}}

Rules:
- Use only provided inputs.
- Do not invent unknown paper titles; if uncertain, skip that item.
- Keep must_read between 3 and 6 entries when possible.
- reading_path must contain exactly 3 concise steps.
- next_search_queries must contain 3 to 5 practical scholar-search queries.
- If mode is project discovery, avoid claiming an uploaded paper was analyzed.

Mode:
{normalized_mode}

{context_label}:
{paper_context}

Top cited references (JSON):
{json.dumps(compact_top_cited, ensure_ascii=False)}

Missing references (sample):
{json.dumps((missing_references or [])[:10], ensure_ascii=False)}
"""

                response = client.chat.completions.create(
                                model=settings.MODEL_NAME,
                                messages=[
                                                {
                                                                "role": "system",
                                                                "content": "You output only valid JSON for citation-based reading recommendations."
                                                },
                                                {"role": "user", "content": prompt}
                                ],
                                response_format={"type": "json_object"}
                )

                return json.loads(response.choices[0].message.content)
