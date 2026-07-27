import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.llm_sections.client import client
from app.services.model_fallback import create_completion_with_fallback, DEFAULT_PRIMARY_MODEL, DEFAULT_FALLBACK_MODELS

logger = logging.getLogger(__name__)


class PlanStep(BaseModel):
    tool: str
    args: Dict[str, Any] = Field(default_factory=dict)
    description: str = ""


class Plan(BaseModel):
    steps: List[PlanStep]
    reason: str = ""

    def needs_replan(self, latest_result: Dict[str, Any]) -> bool:
        """Check if latest step result was empty or error, requiring plan adaptation."""
        if not latest_result:
            return True
        if isinstance(latest_result, dict):
            if "error" in latest_result:
                return True
            if "total_found" in latest_result and latest_result["total_found"] == 0:
                return True
            if "papers" in latest_result and len(latest_result["papers"]) == 0:
                return True
        return False


async def create_plan(goal: str, tools: Dict[str, Any]) -> Plan:
    """Decompose research goal into an ordered sequence of tool execution steps."""
    available_tools_info = [
        {"name": name, "description": meta["description"]}
        for name, meta in tools.items()
    ]

    system_prompt = (
        "You are an expert AI Research Planner. Decompose the user's research goal into 3-4 structured execution steps "
        "using available tools.\n"
        f"Available Tools: {json.dumps(available_tools_info, indent=2)}\n\n"
        "Return ONLY a JSON object with this exact structure:\n"
        "{\n"
        '  "steps": [\n'
        '    {"tool": "search_papers", "args": {"domain": "..."}, "description": "Search literature for domain"},\n'
        '    {"tool": "generate_problem", "args": {"domain": "..."}, "description": "Formulate 3 novel research directions"},\n'
        '    {"tool": "find_datasets", "args": {"topic": "..."}, "description": "Recommend datasets and benchmarks"}\n'
        '  ],\n'
        '  "reason": "Detailed plan rationale"\n'
        "}"
    )

    user_prompt = f"Research Goal: {goal}"

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="agent_planner_create_plan",
            primary_model=DEFAULT_PRIMARY_MODEL,
            fallback_models=DEFAULT_FALLBACK_MODELS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        steps_raw = data.get("steps", [])
        plan_steps = [PlanStep(**s) for s in steps_raw if s.get("tool") in tools]
        if not plan_steps:
            # Fallback default plan
            plan_steps = _default_fallback_steps(goal)
        return Plan(steps=plan_steps, reason=data.get("reason", "Structured multi-agent plan"))
    except Exception as exc:
        logger.warning("Planner LLM call failed: %s. Using default steps.", exc)
        return Plan(steps=_default_fallback_steps(goal), reason="Fallback default plan")


async def replan(goal: str, previous_results: List[Dict[str, Any]]) -> Plan:
    """Adapt plan based on weak or missing previous tool execution results."""
    system_prompt = (
        "You are an adaptive AI Research Planner. Previous tool steps returned incomplete results. "
        "Generate 2 modified follow-up steps to salvage and complete the goal.\n"
        "Return ONLY JSON: {\"steps\": [{\"tool\": \"...\", \"args\": {...}, \"description\": \"...\"}], \"reason\": \"...\"}"
    )
    user_prompt = f"Goal: {goal}\nPrevious Results: {json.dumps(previous_results[:2])}"

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="agent_planner_replan",
            primary_model=DEFAULT_PRIMARY_MODEL,
            fallback_models=DEFAULT_FALLBACK_MODELS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        plan_steps = [PlanStep(**s) for s in data.get("steps", [])]
        return Plan(steps=plan_steps, reason=data.get("reason", "Adapted research plan"))
    except Exception as exc:
        logger.warning("Replanner failed: %s", exc)
        return Plan(steps=_default_fallback_steps(goal)[1:], reason="Fallback replan")


async def synthesize(goal: str, results: List[Dict[str, Any]], critique: Dict[str, Any]) -> str:
    """Synthesize comprehensive literature review and research directions from step results."""
    system_prompt = (
        "You are a distinguished senior researcher. Synthesize a comprehensive, beautifully formatted Markdown "
        "literature review and research proposal report based on the goal, retrieved literature, detected gaps, "
        "formulated problems, datasets, and critique findings.\n\n"
        "Structure the output with clear headers:\n"
        "# Executive Summary\n"
        "## 1. Domain Overview & Key Literature\n"
        "## 2. Unexplored Research Gaps & Limitations\n"
        "## 3. Proposed Novel Research Directions\n"
        "## 4. Datasets, Benchmarks & Methodology\n"
        "## 5. Critical Self-Evaluation & Source Citations\n"
    )

    user_prompt = (
        f"Research Goal: {goal}\n\n"
        f"Execution Results:\n{json.dumps(results, indent=2)}\n\n"
        f"Self-Critique:\n{json.dumps(critique, indent=2)}"
    )

    try:
        response = create_completion_with_fallback(
            llm_client=client,
            task_name="agent_planner_synthesize",
            primary_model=DEFAULT_PRIMARY_MODEL,
            fallback_models=DEFAULT_FALLBACK_MODELS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=2500,
        )
        return response.choices[0].message.content
    except Exception as exc:
        logger.error("Synthesis failed: %s", exc)
        return (
            f"# Autonomous Research Summary: {goal}\n\n"
            f"### Key Findings & Step Execution Summary\n"
            f"Execution completed with {len(results)} steps.\n\n"
            f"```json\n{json.dumps(results, indent=2)}\n```"
        )


def _default_fallback_steps(goal: str) -> List[PlanStep]:
    return [
        PlanStep(tool="search_papers", args={"domain": goal[:60], "limit": 35}, description="Search Semantic Scholar, Crossref, and arXiv literature"),
        PlanStep(tool="generate_problem", args={"domain": goal[:60]}, description="Formulate novel research directions & step-by-step execution roadmap"),
        PlanStep(tool="find_datasets", args={"topic": goal[:60]}, description="Recommend datasets, benchmark suites & evaluation metrics"),
    ]
