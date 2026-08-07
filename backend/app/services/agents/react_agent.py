import json
import logging
import asyncio
from typing import Dict, Any, List

from app.core.database import SessionLocal
from app.models.agent_task import AgentTask, AgentStep
from app.services.agents.tools import TOOL_REGISTRY
from app.services.agents import critique, trace
from app.services.agents.orchestrator import _cancelled_tasks, summarize_result
from app.services.llm_sections.client import client
from app.services.model_fallback import (
    create_completion_with_fallback,
    DEFAULT_PRIMARY_MODEL,
    DEFAULT_FALLBACK_MODELS,
    FAST_ROUTER_MODEL,
)

logger = logging.getLogger(__name__)

AVAILABLE_TOOLS_SCHEMA = [
    {
        "name": "search_papers",
        "description": "Search Semantic Scholar, Crossref, and arXiv literature for papers in a domain.",
        "parameters": {
            "domain": "Research domain/topic string",
            "limit": "Max paper count (default 30)",
        },
    },
    {
        "name": "search_workspace_vector_db",
        "description": "Search local Supabase pgvector database for uploaded paper embeddings.",
        "parameters": {
            "query": "Search query text",
            "paper_id": "Optional paper ID filter",
        },
    },
    {
        "name": "analyze_paper",
        "description": "Extract key methodology insights, assertions, and limitations from text/abstracts.",
        "parameters": {
            "text": "Paper text or abstract content to analyze",
        },
    },
    {
        "name": "generate_problem",
        "description": "Formulate novel research directions, problem statements, and roadmaps.",
        "parameters": {
            "domain": "Target research domain",
            "gap_summary": "Extracted research gap summary",
        },
    },
    {
        "name": "find_datasets",
        "description": "Recommend SOTA datasets, benchmark suites, and evaluation metrics.",
        "parameters": {
            "topic": "Research topic or focus area",
        },
    },
    {
        "name": "plan_experiment",
        "description": "Generate multi-stage experimental execution roadmap.",
        "parameters": {
            "topic": "Research direction or topic title",
        },
    },
]


async def run_react_agent_loop(task_id: str, user_id: str, goal: str):
    """Iterative Autonomous ReAct (Reasoning + Acting) Agent Execution Loop with live memory scratchpad."""
    db = SessionLocal()
    try:
        task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
        if not task:
            logger.error("AgentTask %s not found in DB", task_id)
            return

        # Working Memory & Context State
        messages: List[Dict[str, Any]] = []
        executed_results: List[Dict[str, Any]] = []
        executed_tools: set = set()

        system_prompt = (
            "You are Paperlens Autonomous ReAct AI Research Agent.\n"
            "Your objective is to analyze the user's research request and select the optimal sequence of tools to satisfy it completely.\n\n"
            f"REGISTERED TOOLS & CAPABILITIES:\n{json.dumps(AVAILABLE_TOOLS_SCHEMA, indent=2)}\n\n"
            "AUTONOMOUS REASONING PROTOCOL:\n"
            "1. Carefully analyze the user's research request intent.\n"
            "2. Decide which tools from REGISTERED TOOLS are required to satisfy the goal:\n"
            "   - If user needs academic papers, literature, or domain background -> call 'search_papers'.\n"
            "   - If user needs datasets, benchmark suites, or evaluation metrics -> call 'find_datasets'.\n"
            "   - If user needs novel research directions, problem statements, or unexplored gaps -> call 'generate_problem'.\n"
            "   - If user needs an experimental roadmap, implementation steps, or execution guide -> call 'plan_experiment'.\n"
            "   - If user requests a workflow, guide, proposal, how-to, or comprehensive research overview -> call multiple tools ('search_papers', 'generate_problem', 'find_datasets', 'plan_experiment') in logical sequence.\n"
            "3. In each step, inspect Working Memory to pass parameters from earlier tool outputs (e.g. use paper topics found in Step 1 for dataset search in Step 2).\n"
            "4. When all tools necessary to fulfill the request have executed, set \"is_final\": true.\n\n"
            "Return ONLY a JSON object:\n"
            "{\n"
            '  "thought": "Your detailed reasoning about user intent, findings so far, and next action",\n'
            '  "action": "search_papers",\n'
            '  "action_input": {"domain": "..."},\n'
            '  "is_final": false,\n'
            '  "memory_summary": "1-sentence summary of current findings"\n'
            "}"
        )

        step_count = 0
        max_steps = 6

        while step_count < max_steps:
            if task_id in _cancelled_tasks:
                logger.info("ReAct task %s cancelled by user. Halting.", task_id)
                task.status = "cancelled"
                db.commit()
                _cancelled_tasks.discard(task_id)
                trace.emit_event(task_id, {
                    "type": "cancelled",
                    "message": "Process terminated by user.",
                })
                return

            step_count += 1

            # Prepare prompt context
            user_prompt = f"User Research Goal: {goal}\nStep #{step_count} of Max {max_steps}.\n"
            if executed_results:
                compact_memory = [
                    {
                        "step": idx + 1,
                        "tool": item["tool"],
                        "summary": summarize_result(item["result"]),
                    }
                    for idx, item in enumerate(executed_results)
                ]
                user_prompt += f"\nWorking Memory History:\n{json.dumps(compact_memory, indent=2)}\n"

            try:
                llm_response = create_completion_with_fallback(
                    llm_client=client,
                    task_name="react_agent_reasoning",
                    primary_model=FAST_ROUTER_MODEL,
                    fallback_models=DEFAULT_FALLBACK_MODELS,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                raw_json = llm_response.choices[0].message.content
                decision = json.loads(raw_json)
            except Exception as exc:
                logger.warning("ReAct reasoning fallback at step %s: %s", step_count, exc)
                decision = _fallback_react_decision(goal, step_count, executed_tools)

            thought = decision.get("thought", f"Analyzing step #{step_count} requirements...")
            action_tool = decision.get("action", "search_papers")
            action_args = decision.get("action_input") or {"domain": goal, "topic": goal}
            is_final = decision.get("is_final", False)
            memory_summary = decision.get("memory_summary", f"Step {step_count} reasoning active.")

            # Emit ReAct Thought SSE Event
            trace.emit_event(task_id, {
                "type": "thought",
                "step_index": step_count,
                "thought": thought,
                "memory_summary": memory_summary,
                "is_final": is_final,
            })

            if is_final or action_tool == "none" or step_count >= max_steps:
                logger.info("ReAct agent reached final state at step %s", step_count)
                break

            if task_id in _cancelled_tasks:
                task.status = "cancelled"
                db.commit()
                _cancelled_tasks.discard(task_id)
                return

            # Execute Tool Action
            trace.emit_event(task_id, {
                "type": "action",
                "step_index": step_count,
                "tool": action_tool,
                "args": action_args,
                "description": f"Executing {action_tool} with dynamic arguments",
            })

            if action_tool in TOOL_REGISTRY:
                fn = TOOL_REGISTRY[action_tool]["fn"]
                try:
                    result = await fn(**action_args)
                except Exception as exc:
                    logger.error("ReAct Tool %s failed: %s", action_tool, exc)
                    result = {"error": str(exc)}
            else:
                result = {"error": f"Tool {action_tool} not registered"}

            executed_tools.add(action_tool)
            executed_results.append({"tool": action_tool, "args": action_args, "result": result})

            # Save Audit Step to DB
            try:
                db_step = AgentStep(
                    task_id=task_id,
                    step_index=step_count,
                    tool=action_tool,
                    args=action_args,
                    result=result,
                )
                db.add(db_step)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning("Failed to log ReAct AgentStep: %s", e)

            # Emit ReAct Observation SSE Event
            trace.emit_event(task_id, {
                "type": "observation",
                "step_index": step_count,
                "tool": action_tool,
                "summary": summarize_result(result),
                "data": result,
            })

            # Emit Working Memory Update
            trace.emit_event(task_id, {
                "type": "memory_update",
                "step_index": step_count,
                "total_tools_executed": len(executed_results),
                "latest_tool": action_tool,
                "active_memory_summary": f"Collected findings from {len(executed_results)} action cycles.",
            })

        if task_id in _cancelled_tasks:
            task.status = "cancelled"
            db.commit()
            _cancelled_tasks.discard(task_id)
            return

        # Critique & Synthesis Phase
        trace.emit_event(task_id, {
            "type": "critique_start",
            "message": "Auditing findings against peer-review citation metrics...",
        })
        critique_result = await critique.verify(goal, executed_results)
        trace.emit_event(task_id, {
            "type": "critique",
            "issues": critique_result.get("issues", []),
            "strengths": critique_result.get("strengths", []),
            "verdict": critique_result.get("verdict", "Passed with High Confidence"),
            "data": critique_result,
        })

        trace.emit_event(task_id, {
            "type": "synthesis_start",
            "message": "Synthesizing executive multi-agent research proposal...",
        })

        from app.services.agents import planner
        final_answer = await planner.synthesize(goal, executed_results, critique_result)

        task.status = "done"
        db.commit()

        trace.emit_event(task_id, {
            "type": "final",
            "answer": final_answer,
            "results": executed_results,
            "critique": critique_result,
        })

    except Exception as exc:
        logger.error("Error in ReAct loop for task %s: %s", task_id, exc, exc_info=True)
        try:
            task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
            if task:
                task.status = "failed"
                db.commit()
        except Exception:
            pass
        trace.emit_event(task_id, {
            "type": "error",
            "message": f"ReAct agent error: {str(exc)}",
        })
    finally:
        db.close()


def _fallback_react_decision(goal: str, step: int, executed: set) -> Dict[str, Any]:
    """Autonomous ReAct step decision fallback using un-executed tools in logical pipeline sequence."""
    pipeline = ["search_papers", "generate_problem", "find_datasets", "plan_experiment"]

    for tool_name in pipeline:
        if tool_name not in executed:
            thought_desc = {
                "search_papers": "Searching academic literature repositories for primary research papers...",
                "generate_problem": "Analyzing research gaps and formulating novel problem directions...",
                "find_datasets": "Evaluating SOTA benchmark datasets and evaluation metrics...",
                "plan_experiment": "Designing multi-stage experimental execution roadmap...",
            }.get(tool_name, f"Executing tool {tool_name}...")

            return {
                "thought": f"Executing research step: {thought_desc}",
                "action": tool_name,
                "action_input": {"domain": goal, "topic": goal},
                "is_final": False,
                "memory_summary": f"Executing {tool_name}.",
            }

    return {
        "thought": "All research tool steps completed. Proceeding to final synthesis.",
        "action": "none",
        "action_input": {},
        "is_final": True,
        "memory_summary": "All tool steps finished.",
    }
