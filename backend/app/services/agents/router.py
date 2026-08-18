import json
import logging
from typing import Dict, Any, List
from app.services.llm_sections.client import client
from app.services.model_fallback import create_completion_with_fallback, FAST_ROUTER_MODEL, DEFAULT_FALLBACK_MODELS

logger = logging.getLogger(__name__)

AVAILABLE_TOOL_DESCRIPTIONS = {
    "search_papers": "Search literature databases (arXiv, Semantic Scholar, Crossref) for papers, prior work, background, or literature reviews.",
    "analyze_insights": "Extract methodology, technical insights, and paper abstractions from literature.",
    "detect_gaps": "Identify unexplored research gaps, limitations, and open challenges in a domain.",
    "generate_problem": "Formulate novel research directions, problem statements, and core technical bottlenecks.",
    "find_datasets": "Recommend SOTA datasets, benchmark suites, evaluation metrics, and baselines.",
    "plan_experiment": "Design a detailed multi-stage experimental execution roadmap with parameters, configs, and risks.",
}


async def select_agent_tools(goal: str, tools_registry: Dict[str, Any]) -> Dict[str, Any]:
    """Dynamically analyze user query with an LLM router to select exact tool calls and parameters."""
    clean_goal = (goal or "").strip()
    lower = clean_goal.lower()

    # Deterministic Fast-Path: Skip LLM call for explicit combination patterns
    has_dataset = any(k in lower for k in ["dataset", "datasets", "benchmark", "benchmarks", "evaluation metrics"])
    has_problem = any(k in lower for k in ["problem statement", "problem", "problems", "direction", "directions", "unexplored", "gap", "gaps"])
    has_papers = any(k in lower for k in ["search papers", "literature search", "find papers", "arxiv papers", "literature"])
    has_plan = any(k in lower for k in ["roadmap", "experiment plan", "full proposal", "execution plan"])

    # Problem Statement + Dataset combination fast-path
    if has_problem and has_dataset and not has_papers and not has_plan:
        logger.info("Fast-path router selected generate_problem + find_datasets for goal: %s", clean_goal)
        return {
            "selected_tools": [
                {
                    "tool": "generate_problem",
                    "description": "Formulate problem statements and research directions",
                    "args": {"domain": clean_goal, "topic": clean_goal}
                },
                {
                    "tool": "find_datasets",
                    "description": "Recommend SOTA datasets and benchmarks",
                    "args": {"topic": clean_goal, "domain": clean_goal}
                }
            ],
            "intent_summary": "Fast-path Problem Statement + Dataset Router",
        }

    if has_dataset and not (has_problem or has_papers or has_plan):
        logger.info("Fast-path router selected find_datasets for goal: %s", clean_goal)
        return {
            "selected_tools": [
                {
                    "tool": "find_datasets",
                    "description": "Recommend SOTA datasets and benchmarks",
                    "args": {"topic": clean_goal, "domain": clean_goal}
                }
            ],
            "intent_summary": "Fast-path Dataset & Benchmark Router",
        }

    if has_papers and not (has_problem or has_dataset or has_plan):
        logger.info("Fast-path router selected search_papers for goal: %s", clean_goal)
        return {
            "selected_tools": [
                {
                    "tool": "search_papers",
                    "description": "Search literature repository",
                    "args": {"domain": clean_goal, "topic": clean_goal}
                }
            ],
            "intent_summary": "Fast-path Literature Search Router",
        }

    # Dynamic LLM Router for multi-intent or complex queries
    available_tools_json = json.dumps(AVAILABLE_TOOL_DESCRIPTIONS, indent=2)

    system_prompt = (
        "You are an expert AI Research Tool Router.\n"
        "Your task is to analyze the user's research query and select ONLY the tools specifically required to satisfy the user's request.\n\n"
        f"Available Tools & Descriptions:\n{available_tools_json}\n\n"
        "SELECTION RULES:\n"
        "1. If query asks ONLY for datasets or benchmarks -> select ONLY ['find_datasets']!\n"
        "2. If query asks for problem statements, research directions, or unexplored ideas AND datasets -> select BOTH ['generate_problem', 'find_datasets']!\n"
        "3. If query asks for literature/background AND research directions/unexplored ideas/gaps -> select BOTH ['search_papers', 'generate_problem']!\n"
        "4. If query asks for literature AND datasets -> select BOTH ['search_papers', 'find_datasets']!\n"
        "5. If query asks for a full proposal, plan, or end-to-end execution roadmap -> select ['search_papers', 'generate_problem', 'find_datasets', 'plan_experiment']!\n\n"
        "Return ONLY a JSON object matching this structure:\n"
        "{\n"
        '  "selected_tools": [\n'
        '    {\n'
        '      "tool": "generate_problem",\n'
        '      "description": "...",\n'
        '      "args": {"domain": "...", "topic": "..."}\n'
        '    }\n'
        '  ],\n'
        '  "intent_summary": "Brief summary of query intent"\n'
        "}"
    )

    user_prompt = f"User Research Query: {clean_goal}"

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="agent_router_select_tools",
            primary_model=FAST_ROUTER_MODEL,
            fallback_models=DEFAULT_FALLBACK_MODELS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        raw_selected = data.get("selected_tools", [])

        valid_tools = []
        for item in raw_selected:
            t_name = item.get("tool")
            if t_name in tools_registry or t_name in AVAILABLE_TOOL_DESCRIPTIONS:
                item_args = item.get("args") or {}
                if "domain" not in item_args:
                    item_args["domain"] = clean_goal
                if "topic" not in item_args:
                    item_args["topic"] = clean_goal
                item["args"] = item_args
                valid_tools.append(item)

        if not valid_tools:
            valid_tools = _fallback_tool_selection(clean_goal)

        return {
            "selected_tools": valid_tools,
            "intent_summary": data.get("intent_summary", "Dynamic LLM Tool Selection"),
        }

    except Exception as exc:
        logger.warning("LLM Tool selection failed: %s. Using default fallback.", exc)
        return {
            "selected_tools": _fallback_tool_selection(clean_goal),
            "intent_summary": "Fallback tool selection",
        }


def _fallback_tool_selection(goal: str) -> List[Dict[str, Any]]:
    lower = goal.lower()
    if any(k in lower for k in ["dataset", "benchmark", "metrics"]):
        return [{
            "tool": "find_datasets",
            "description": "Recommend SOTA datasets and benchmarks",
            "args": {"topic": goal.strip(), "domain": goal.strip()}
        }]
    if any(k in lower for k in ["plan", "roadmap", "experiment"]):
        return [
            {
                "tool": "generate_problem",
                "description": "Formulate novel research direction and problem statement",
                "args": {"domain": goal.strip(), "topic": goal.strip()}
            },
            {
                "tool": "plan_experiment",
                "description": "Generate multi-stage experimental execution roadmap",
                "args": {"topic": goal.strip(), "domain": goal.strip()}
            }
        ]
    return [{
        "tool": "search_papers",
        "description": "Search literature repository",
        "args": {"domain": goal.strip(), "topic": goal.strip()}
    }]
