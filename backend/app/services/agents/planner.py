import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.services.llm_sections.client import client
from app.services.agents.router import select_agent_tools
from app.services.model_fallback import (
    create_completion_with_fallback,
    DEFAULT_PRIMARY_MODEL,
    DEFAULT_FALLBACK_MODELS,
    FAST_ROUTER_MODEL,
    HEAVY_ANALYTICAL_MODEL,
)

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
    """Decompose research goal into dynamic LLM tool execution steps."""
    router_res = await select_agent_tools(goal, tools)
    selected_tools = router_res.get("selected_tools", [])
    intent_summary = router_res.get("intent_summary", "Dynamic Tool Plan")

    plan_steps = []
    for item in selected_tools:
        t_name = item.get("tool", "")
        if t_name in tools:
            args = item.get("args") or {"domain": goal.strip(), "topic": goal.strip()}
            desc = item.get("description") or f"Executing tool {t_name}"
            plan_steps.append(PlanStep(tool=t_name, args=args, description=desc))

    if not plan_steps:
        plan_steps = [
            PlanStep(
                tool="search_papers",
                args={"domain": goal.strip()},
                description="Search literature repository",
            )
        ]

    return Plan(
        steps=plan_steps,
        reason=f"LLM Dynamic Router: {intent_summary}",
    )


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


def compact_results_for_llm(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter and compress tool outputs to prevent context window bloat and Groq TPM limits."""
    compacted = []
    for item in results:
        tool = item.get("tool", "")
        args = item.get("args", {})
        raw_res = item.get("result") or {}

        compact_item: Dict[str, Any] = {"tool": tool, "args": args}

        if isinstance(raw_res, dict):
            if "papers" in raw_res:
                papers = raw_res.get("papers") or []
                compact_papers = []
                for p in papers[:6]:
                    if isinstance(p, dict):
                        abstract = p.get("abstract") or p.get("summary") or ""
                        compact_papers.append({
                            "title": p.get("title"),
                            "year": p.get("year"),
                            "authors": (p.get("authors") or [])[:3],
                            "abstract": abstract[:250] + "..." if len(abstract) > 250 else abstract,
                        })
                compact_item["result"] = {
                    "total_found": raw_res.get("total_found", len(papers)),
                    "top_papers": compact_papers,
                }
            elif "gaps" in raw_res:
                gaps = raw_res.get("gaps") or []
                compact_item["result"] = {
                    "gaps": [g if isinstance(g, str) else str(g)[:200] for g in gaps[:5]]
                }
            elif "problems" in raw_res or "ideas" in raw_res:
                items = raw_res.get("problems") or raw_res.get("ideas") or []
                compact_item["result"] = {
                    "problems": [p if isinstance(p, str) else str(p)[:150] for p in items[:4]]
                }
            elif "datasets" in raw_res:
                ds = raw_res.get("datasets") or []
                compact_item["result"] = {
                    "datasets": [
                        {
                            "name": d.get("name") if isinstance(d, dict) else str(d),
                            "type": d.get("type", "") if isinstance(d, dict) else "",
                            "metrics": d.get("metrics", "") if isinstance(d, dict) else "",
                        }
                        for d in ds[:5]
                    ]
                }
            else:
                res_str = json.dumps(raw_res)
                compact_item["result"] = res_str[:600] + "..." if len(res_str) > 600 else raw_res
        else:
            res_str = str(raw_res)
            compact_item["result"] = res_str[:600] + "..." if len(res_str) > 600 else raw_res

        compacted.append(compact_item)
    return compacted


async def synthesize(goal: str, results: List[Dict[str, Any]], critique: Dict[str, Any]) -> str:
    """Synthesize comprehensive literature review and research directions from step results."""
    executed_tools = {item.get("tool") for item in results if item.get("tool")}

    system_prompt = (
        "You are a distinguished senior researcher. Synthesize a comprehensive, beautifully formatted Markdown "
        "report based on the research goal, retrieved data, and step execution results.\n\n"
        "CRITICAL FORMATTING & TABLE RULES:\n"
        "1. Tailor your section headers dynamically based ONLY on the data present in Execution Results.\n"
        "2. Do NOT output empty, blank, or placeholder sections for tools that were not executed.\n"
        "3. When generating Markdown tables, output every row on its own line with explicit newline breaks (e.g. '| Col 1 | Col 2 |\\n|---|---|\\n| Val 1 | Val 2 |\\n'). Never collapse table rows onto a single line!\n\n"
        "Recommended Section Header Guidelines:\n"
        "- If ONLY Dataset/Benchmark Finder tool was executed:\n"
        "  # Benchmark Datasets & Evaluation Suite\n"
        "  ## 1. Top Recommended SOTA Datasets & Benchmarks\n"
        "  ## 2. Primary Evaluation Metrics & Standard Baselines\n"
        "  ## 3. Data Modalities & Task Specifications\n"
        "  ## 4. Benchmark Fit & Selection Summary\n\n"
        "- If ONLY Literature Search was executed:\n"
        "  # Executive Summary\n"
        "  ## 1. Domain Overview & Key Literature\n"
        "  ## 2. Comparative Methodological Insights & Taxonomy\n"
        "  ## 3. Critical Evaluation & Citation Synthesis\n\n"
        "- If Full Proposal / Gaps / Datasets / Directions were executed:\n"
        "  # Executive Summary\n"
        "  ## 1. Domain Overview & Key Literature\n"
        "  ## 2. Unexplored Research Gaps & Limitations (if gaps present)\n"
        "  ## 3. Proposed Novel Research Directions (if directions present)\n"
        "  ## 4. Datasets, Benchmarks & Methodology (if datasets present)\n"
        "  ## 5. Critical Self-Evaluation & Source Citations\n"
    )

    model_context_results = compact_results_for_llm(results)

    user_prompt = (
        f"Research Goal: {goal}\n\n"
        f"Execution Results:\n{json.dumps(model_context_results, indent=2)}\n\n"
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
            f"```json\n{json.dumps(model_context_results, indent=2)}\n```"
        )


def _default_fallback_steps(goal: str) -> List[PlanStep]:
    return [
        PlanStep(tool="search_papers", args={"domain": goal[:60], "limit": 35}, description="Search Semantic Scholar, Crossref, and arXiv literature"),
        PlanStep(tool="generate_problem", args={"domain": goal[:60]}, description="Formulate novel research directions & step-by-step execution roadmap"),
        PlanStep(tool="find_datasets", args={"topic": goal[:60]}, description="Recommend datasets, benchmark suites & evaluation metrics"),
    ]
