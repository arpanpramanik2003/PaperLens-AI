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


async def run_research_task(task_id: str, user_id: str, goal: str):
    """Execute the full autonomous multi-agent plan-execute-replan-critique loop."""
    db = SessionLocal()
    try:
        task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
        if not task:
            logger.error("AgentTask %s not found in DB", task_id)
            return

        # 1. Plan
        plan = await planner.create_plan(goal, tools=TOOL_REGISTRY)
        trace.emit_event(task_id, {
            "type": "plan",
            "steps": [{"tool": s.tool, "args": s.args, "description": s.description} for s in plan.steps],
            "reason": plan.reason,
        })

        results: List[Dict[str, Any]] = []
        step_index = 0
        replan_count = 0

        # 2. Execute plan steps
        executed_tools = set()
        while step_index < len(plan.steps):
            if task_id in _cancelled_tasks:
                logger.info("Task %s was cancelled by user. Halting execution loop.", task_id)
                task.status = "cancelled"
                db.commit()
                _cancelled_tasks.discard(task_id)
                return

            step = plan.steps[step_index]
            step_index += 1

            trace.emit_event(task_id, {
                "type": "tool_call",
                "step_index": step_index,
                "tool": step.tool,
                "args": step.args,
                "description": step.description or f"Executing tool {step.tool}",
            })

            # Execute tool
            if step.tool in TOOL_REGISTRY:
                fn = TOOL_REGISTRY[step.tool]["fn"]
                try:
                    result = await fn(**step.args)
                except Exception as exc:
                    logger.error("Error executing tool %s: %s", step.tool, exc, exc_info=True)
                    result = {"error": str(exc)}
            else:
                result = {"error": f"Tool {step.tool} not registered"}

            if task_id in _cancelled_tasks:
                logger.info("Task %s was cancelled during tool execution. Halting.", task_id)
                task.status = "cancelled"
                db.commit()
                _cancelled_tasks.discard(task_id)
                return

            executed_tools.add(step.tool)
            results.append({"tool": step.tool, "args": step.args, "result": result})

            # Save step to DB audit trail
            try:
                db_step = AgentStep(
                    task_id=task_id,
                    step_index=step_index,
                    tool=step.tool,
                    args=step.args,
                    result=result,
                )
                db.add(db_step)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning("Failed to save AgentStep to DB: %s", e)

            # Emit result SSE event
            trace.emit_event(task_id, {
                "type": "tool_result",
                "step_index": step_index,
                "tool": step.tool,
                "summary": summarize_result(result),
                "data": result,
            })

            # Check if replan needed (max 1 replan)
            if replan_count < 1 and plan.needs_replan(result):
                replan_count += 1
                trace.emit_event(task_id, {
                    "type": "replanning",
                    "reason": f"Tool {step.tool} returned weak results. Adapting research plan...",
                })
                replan_obj = await planner.replan(goal, results)
                for extra_step in replan_obj.steps:
                    if extra_step.tool not in executed_tools:
                        plan.steps.append(extra_step)

        # 3. Critique
        trace.emit_event(task_id, {
            "type": "critique_start",
            "message": "Critiquing output for claim grounding and citation coverage...",
        })
        critique_result = await critique.verify(goal, results)
        trace.emit_event(task_id, {
            "type": "critique",
            "issues": critique_result.get("issues", []),
            "strengths": critique_result.get("strengths", []),
            "verdict": critique_result.get("verdict", "Pass"),
            "data": critique_result,
        })

        # 4. Synthesize final response
        trace.emit_event(task_id, {
            "type": "synthesis_start",
            "message": "Synthesizing comprehensive research report...",
        })
        final_answer = await planner.synthesize(goal, results, critique_result)

        # Update task status in DB
        task.status = "done"
        db.commit()

        # Emit final SSE event
        trace.emit_event(task_id, {
            "type": "final",
            "answer": final_answer,
            "results": results,
            "critique": critique_result,
        })

    except Exception as exc:
        logger.error("Unhandled error in run_research_task for task %s: %s", task_id, exc, exc_info=True)
        try:
            task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
            if task:
                task.status = "failed"
                db.commit()
        except Exception:
            pass
        trace.emit_event(task_id, {
            "type": "error",
            "message": f"Research task failed: {str(exc)}",
        })
    finally:
        db.close()
