import json
import logging
from typing import Dict, Any, List
from app.core.database import SessionLocal
from app.models.agent_task import AgentTask, AgentStep
from app.services.agents.tools import TOOL_REGISTRY
from app.services.agents import planner, critique, trace

logger = logging.getLogger(__name__)

# Track cancelled task IDs in memory
_cancelled_tasks: set = set()


def cancel_task(task_id: str):
    """Mark a task_id as cancelled so background loops stop immediately."""
    _cancelled_tasks.add(task_id)
    trace.emit_event(task_id, {
        "type": "cancelled",
        "message": "Process terminated by user.",
    })


def summarize_result(result: Any) -> str:
    """Summarize tool result into a short readable text snippet for SSE events."""
    if not result:
        return "No data returned"
    if isinstance(result, dict):
        if "total_found" in result:
            return f"Found {result['total_found']} relevant literature papers."
        if "analysis" in result:
            return f"Extracted research insights ({len(result['analysis'])} chars)."
        if "gaps" in result:
            gaps_list = result.get("gaps") or []
            return f"Identified {len(gaps_list)} research gaps."
        if "problems" in result or "ideas" in result:
            items = result.get("problems") or result.get("ideas") or []
            return f"Generated {len(items)} novel research directions."
        if "datasets" in result:
            return f"Recommended benchmark datasets & evaluation metrics."
    return str(result)[:150] + "..."


async def run_research_task(task_id: str, user_id: str, goal: str, paper_id: str = ""):
    """Execute the full autonomous ReAct memory agent loop."""
    from app.services.agents.react_agent import run_react_agent_loop
    await run_react_agent_loop(task_id=task_id, user_id=user_id, goal=goal, paper_id=paper_id)
