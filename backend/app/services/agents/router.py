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
    available_tools_json = json.dumps(AVAILABLE_TOOL_DESCRIPTIONS, indent=2)

    system_prompt = (
        "You are an expert AI Research Tool Router.\n"
        "Your task is to analyze the user's research query and select ONLY the tools from the Available Tools list "
        "that are required to satisfy the user's exact request.\n\n"
        f"Available Tools & Descriptions:\n{available_tools_json}\n\n"
        "Selection Guidance Rules:\n"
        "1. If user asks for literature search, background, papers, or literature review -> select ONLY ['search_papers'].\n"
        "2. If user asks for datasets, benchmarks, evaluation metrics, or baselines -> select ONLY ['find_datasets'].\n"
        "3. If user asks for a plan, experimental roadmap, execution plan, or direction -> select ['generate_problem', 'plan_experiment'] or ['plan_experiment'].\n"
        "4. If user asks for research gaps, limitations, or unexplored challenges -> select ['search_papers', 'detect_gaps'].\n"
        "5. If user asks for a full end-to-end research proposal or comprehensive investigation -> select ['search_papers', 'generate_problem', 'find_datasets', 'plan_experiment'].\n\n"
        "Return ONLY a JSON object with this structure:\n"
        "{\n"
        '  "selected_tools": [\n'
        '    {\n'
        '      "tool": "find_datasets",\n'
        '      "description": "Recommend SOTA benchmarks and metrics for topic",\n'
        '      "args": {\n'
        '        "topic": "Brain Tumor Classification",\n'
        '        "domain": "Brain Tumor Classification"\n'
        '      }\n'
        '    }\n'
        '  ],\n'
        '  "intent_summary": "Brief summary of query intent"\n'
        "}"
    )

    user_prompt = f"User Research Query: {goal}"

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
                    item_args["domain"] = goal.strip()
                if "topic" not in item_args:
                    item_args["topic"] = goal.strip()
                item["args"] = item_args
                valid_tools.append(item)

        if not valid_tools:
            valid_tools = _fallback_tool_selection(goal)

        return {
            "selected_tools": valid_tools,
            "intent_summary": data.get("intent_summary", "Dynamic LLM Tool Selection"),
        }

    except Exception as exc:
        logger.warning("LLM Tool selection failed: %s. Using default fallback.", exc)
        return {
            "selected_tools": _fallback_tool_selection(goal),
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
