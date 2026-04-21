import json
import logging
import re

from app.services.model_fallback import (
    DEFAULT_FALLBACK_MODELS,
    DEFAULT_PRIMARY_MODEL,
    create_completion_with_fallback,
)

from .client import client


logger = logging.getLogger(__name__)

HEAVY_PRIMARY_MODEL = DEFAULT_PRIMARY_MODEL
HEAVY_FALLBACK_MODELS = DEFAULT_FALLBACK_MODELS
GAP_DETECTION_MAX_TOKENS = 1000

logger.info(
    "Model routing: generation tasks primary='%s', fallbacks='%s'",
    HEAVY_PRIMARY_MODEL,
    HEAVY_FALLBACK_MODELS,
)


EXPERIMENT_PLAN_ICONS = {
    "Database", "Cog", "Cpu", "Play", "BarChart3", "FlaskConical", "List", "Eye",
    "Cloud", "PenTool", "Shield", "CheckCircle", "Activity", "Globe", "Zap",
}


def _estimate_experiment_step_bounds(topic: str, difficulty: str) -> tuple[int, int]:
    normalized_difficulty = (difficulty or "intermediate").strip().lower()
    base_ranges = {
        "beginner": (6, 9),
        "intermediate": (9, 13),
        "advanced": (12, 18),
    }
    minimum, maximum = base_ranges.get(normalized_difficulty, (9, 13))

    complexity_terms = [
        "multimodal", "federated", "self-supervised", "foundation", "diffusion", "gan",
        "transformer", "graph", "3d", "segmentation", "registration", "ablation",
        "deployment", "edge", "privacy", "clinical", "remote sensing", "time-series",
    ]

    topic_lower = (topic or "").lower()
    complexity_hits = sum(1 for term in complexity_terms if term in topic_lower)
    token_count = len(re.findall(r"[a-zA-Z0-9]+", topic_lower))

    if token_count >= 14:
        complexity_hits += 1
    if token_count >= 22:
        complexity_hits += 1

    minimum += min(complexity_hits // 2, 3)
    maximum += min(complexity_hits, 6)

    return minimum, max(minimum + 1, maximum)


def _infer_step_risk(title: str, details: str) -> str:
    combined = f"{title} {details}".lower()

    if any(keyword in combined for keyword in ["dataset", "curation", "collection"]):
        return "Dataset shift, annotation inconsistency, and class imbalance can degrade generalization."
    if any(keyword in combined for keyword in ["preprocess", "registration", "normalization", "feature"]):
        return "Preprocessing artifacts and information leakage can distort downstream model behavior."
    if any(keyword in combined for keyword in ["model", "architecture", "u-net", "vgg", "transformer"]):
        return "Architecture mismatch and over-parameterization may overfit or underutilize domain priors."
    if any(keyword in combined for keyword in ["train", "optimization", "scheduler", "loss"]):
        return "Optimization instability, gradient issues, or poor hyperparameter search can stall convergence."
    if any(keyword in combined for keyword in ["evaluation", "ablation", "metric"]):
        return "Weak baselines or metric mismatch may produce misleading performance claims."
    if any(keyword in combined for keyword in ["deploy", "monitor", "serving", "edge"]):
        return "Latency drift, resource constraints, and data-distribution drift can hurt production reliability."
    if any(keyword in combined for keyword in ["ethic", "bias", "fairness", "privacy"]):
        return "Bias amplification and privacy leakage can violate compliance and reduce trust in deployment."

    return "Integration and reproducibility risks may appear if assumptions are not validated at this stage."


def _coerce_structured_details(title: str, topic: str, details: str) -> str:
    compact = re.sub(r"\s+", " ", (details or "")).strip()
    markers = ["objective:", "execution:", "validation:", "deliverable:"]

    if len(compact.split()) >= 28 and all(marker in compact.lower() for marker in markers):
        return compact

    return (
        f"Objective: Deliver a robust implementation of {title.lower()} for {topic}. "
        "Execution: Define concrete tasks, sequencing, ownership, and required artifacts for this stage. "
        "Validation: Specify measurable checks against baselines, acceptance thresholds, and failure criteria. "
        "Deliverable: Produce reproducible outputs (configs, logs, reports, and versioned artifacts) required by the next stage."
    )


def _coerce_structured_params(params: str) -> str:
    compact = re.sub(r"\s+", " ", (params or "")).strip()
    required_terms = ["dataset", "metric", "hyper", "threshold"]

    if len(compact.split()) >= 16 and any(term in compact.lower() for term in required_terms):
        return compact

    return (
        "Datasets: named data sources + split policy | "
        "Metrics: primary and secondary metrics with targets | "
        "Hyperparameters: optimizer, learning rate, batch size, regularization | "
        "Compute/Budget: hardware profile and runtime budget | "
        "Exit Criteria: quantitative threshold that gates progression"
    )


def _coerce_structured_risk(title: str, details: str, risks: str) -> str:
    compact = re.sub(r"\s+", " ", (risks or "")).strip()
    if len(compact.split()) >= 14 and "mitigation" in compact.lower() and "trigger" in compact.lower():
        return compact

    inferred = _infer_step_risk(title, details)
    return f"Trigger: Data, model, or optimization assumptions fail in this stage. Impact: {inferred} Mitigation: Add diagnostics, fallback baselines, and stage-level rollback criteria."


def _supplemental_step_templates(topic: str) -> list[dict]:
    return [
        {
            "title": "Problem Formalization & Constraints",
            "iconName": "List",
            "details": f"Formalize task assumptions, constraints, and success criteria for {topic}. Define data scope, operational limits, and failure modes.",
            "params": "Target objective, acceptance thresholds, constraint checklist, baseline assumptions",
            "risks": "Ambiguous objectives can create metric inflation and poor transfer to real deployment conditions.",
        },
        {
            "title": "Data Governance & Quality Audits",
            "iconName": "Shield",
            "details": "Run data audits for completeness, distribution drift, and annotation quality before large-scale training.",
            "params": "Missing-value rate, inter-annotator agreement, per-class sample counts, split strategy",
            "risks": "Undetected label noise and split leakage can inflate offline metrics and fail in real use.",
        },
        {
            "title": "Hyperparameter Search Strategy",
            "iconName": "Zap",
            "details": "Define systematic tuning across optimizer, LR schedule, regularization, and augmentation policies.",
            "params": "Search budget, optimizer grid, scheduler policy, regularization range, augmentation intensity",
            "risks": "Sparse or biased search spaces can lock the pipeline into suboptimal local minima.",
        },
        {
            "title": "Error Analysis & Failure Taxonomy",
            "iconName": "BarChart3",
            "details": "Build class-wise and scenario-wise failure buckets and connect them to corrective actions.",
            "params": "Confusion matrix slices, hard-case buckets, severity labels, corrective action backlog",
            "risks": "Without targeted failure taxonomy, improvements remain random and hard to reproduce.",
        },
        {
            "title": "Reproducibility & Packaging",
            "iconName": "CheckCircle",
            "details": "Freeze environment, seed strategy, artifact tracking, and deterministic evaluation scripts.",
            "params": "Seed policy, environment lockfile, artifact registry, experiment tracking schema",
            "risks": "Inconsistent environments and random seeds can make claimed gains non-reproducible.",
        },
    ]


def _normalize_experiment_plan(topic: str, plan_payload: dict, min_steps: int, max_steps: int) -> dict:
    raw_steps = plan_payload.get("steps") if isinstance(plan_payload, dict) else []
    if not isinstance(raw_steps, list):
        raw_steps = []

    normalized_steps: list[dict] = []
    for index, step in enumerate(raw_steps, start=1):
        if not isinstance(step, dict):
            continue

        title = str(step.get("title") or "").strip() or f"Stage {index}"
        details = str(step.get("details") or "").strip()
        params = str(step.get("params") or "").strip()
        risks = str(step.get("risks") or "").strip()
        icon_name = str(step.get("iconName") or "").strip() or "Cog"

        if icon_name not in EXPERIMENT_PLAN_ICONS:
            icon_name = "Cog"

        details = _coerce_structured_details(title, topic, details)

        params = _coerce_structured_params(params)

        risks = _coerce_structured_risk(title, details, risks)

        normalized_steps.append(
            {
                "num": index,
                "title": title,
                "iconName": icon_name,
                "details": details,
                "params": params,
                "risks": risks,
            }
        )

    if len(normalized_steps) < min_steps:
        used_titles = {item["title"].lower() for item in normalized_steps}
        for template in _supplemental_step_templates(topic):
            if len(normalized_steps) >= min_steps:
                break
            if template["title"].lower() in used_titles:
                continue
            normalized_steps.append(
                {
                    "num": len(normalized_steps) + 1,
                    "title": template["title"],
                    "iconName": template["iconName"],
                    "details": template["details"],
                    "params": template["params"],
                    "risks": template["risks"],
                }
            )

    normalized_steps = normalized_steps[:max_steps]

    for index, step in enumerate(normalized_steps, start=1):
        step["num"] = index

    return {"steps": normalized_steps}


def generate_experiment_plan(topic: str, difficulty: str) -> dict:

    min_steps, max_steps = _estimate_experiment_step_bounds(topic, difficulty)

    prompt = f"""
You are an expert AI researcher. Generate a highly constructive, rich, and technical AI/ML experiment execution plan for the topic: "{topic}" at a {difficulty} difficulty level.

You MUST respond strictly in JSON format matching the following structure exactly. Do not include any other text.
{{
  "steps": [
    {{
      "num": 1,
      "title": "Stage Title",
      "iconName": "IconName",
      "details": "Deeply technical strategy description with enough implementation detail.",
      "params": "Specific metrics, hyperparams, dataset identifiers, and acceptance thresholds.",
      "risks": "Concrete technical risks and failure modes for this stage."
    }}
  ]
}}

Step-count requirement:
- Generate between {min_steps} and {max_steps} steps.
- For technically complex topics, include additional stages for error analysis, ablation, reproducibility, and deployment hardening.

Mandatory quality rules for EACH step:
- "details" must be implementation-grade and include all four components in one field:
    Objective, Execution, Validation, Deliverable.
- "params" must include concrete measurable or identifiable items (named datasets/tools, metrics with targets, hyperparameters, and gating thresholds).
- "risks" must never be empty and must include Trigger + Impact + Mitigation.
- Avoid generic wording such as "improve performance" without defining how it will be measured.

Encouraged Modules (especially for advanced/hard topics):
- Dataset Selection & Curation (Icon: "Database")
- Advanced Preprocessing / Feature Engineering (Icon: "Cog")
- Custom Model Architecture Design (Icon: "Cpu" or "PenTool")
- Training Logic & Optimization (Icon: "Play")
- Explainable AI (XAI) / Interpretability (Icon: "Eye")
- Robust Evaluation & Ablation (Icon: "BarChart3")
- Deployment, Scaling & Monitoring (Icon: "Cloud")
- Ethical Review / Bias Mitigation (Icon: "Shield")
- Reproducibility & Packaging (Icon: "CheckCircle")

Valid iconNames (Lucide React): Database, Cog, Cpu, Play, BarChart3, FlaskConical, List, Eye, Cloud, PenTool, Shield, CheckCircle, Activity, Globe, Zap.
"""

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="experiment_planner",
        primary_model=HEAVY_PRIMARY_MODEL,
        fallback_models=HEAVY_FALLBACK_MODELS,
        messages=[
            {"role": "system", "content": "You are a senior AI researcher designed to return perfect JSON structures."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
    )

    raw_plan = json.loads(response.choices[0].message.content)
    return _normalize_experiment_plan(topic=topic, plan_payload=raw_plan, min_steps=min_steps, max_steps=max_steps)


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

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="problem_generator",
        primary_model=HEAVY_PRIMARY_MODEL,
        fallback_models=HEAVY_FALLBACK_MODELS,
        messages=[
            {"role": "system", "content": "You are a research ideation engine designed to output structured JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
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

        response = create_completion_with_fallback(
            llm_client=client,
            task_name="problem_expansion",
            primary_model=HEAVY_PRIMARY_MODEL,
            fallback_models=HEAVY_FALLBACK_MODELS,
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

    response = create_completion_with_fallback(
        llm_client=client,
        task_name="gap_detection",
        primary_model=HEAVY_PRIMARY_MODEL,
        fallback_models=HEAVY_FALLBACK_MODELS,
        max_tokens=GAP_DETECTION_MAX_TOKENS,
        messages=[
            {"role": "system", "content": "You are a critical research reviewer designed to output structured JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
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

        response = create_completion_with_fallback(
            llm_client=client,
            task_name="dataset_benchmark_finder",
            primary_model=HEAVY_PRIMARY_MODEL,
            fallback_models=HEAVY_FALLBACK_MODELS,
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
    project_title: str = "",
    basic_details: str = "",
) -> dict:

                compact_top_cited = []
                for entry in (top_cited or [])[:35]:
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
                project_context = ""
                if project_title:
                    project_context += f"Project title: {project_title}\n"
                if basic_details:
                    project_context += f"Project details: {basic_details}\n"

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
- Use a professional research-advisor tone (formal, precise, and decision-oriented).
- why_read must be constructive and specific: mention method relevance, evidence quality, or expected practical impact.
- coverage_gaps should identify concrete technical blind spots (dataset scope, baseline strength, evaluation protocol, reproducibility, or deployment constraints).
- Prioritize recommendations that create a coherent progression from fundamentals to advanced/adjacent work.
- If mode is project discovery, avoid claiming an uploaded paper was analyzed.

Mode:
{normalized_mode}

{context_label}:
{project_context}
{paper_context}

Top cited references (JSON):
{json.dumps(compact_top_cited, ensure_ascii=False)}

Missing references (sample):
{json.dumps((missing_references or [])[:10], ensure_ascii=False)}
"""

                response = create_completion_with_fallback(
                                llm_client=client,
                                task_name="citation_recommendations",
                                primary_model=HEAVY_PRIMARY_MODEL,
                                fallback_models=HEAVY_FALLBACK_MODELS,
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
