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
    """Iterative ReAct (Reasoning + Acting) Agent Execution Loop with live memory scratchpad."""
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
            "Your objective is to satisfy the user's EXACT research request using optimal Reasoning (Thought) and Acting (Tool Call).\n\n"
            f"Available Tools Schema:\n{json.dumps(AVAILABLE_TOOLS_SCHEMA, indent=2)}\n\n"
            "CRITICAL INTENT ROUTING RULES:\n"
            "1. Analyze the user's query intent carefully BEFORE selecting tools.\n"
            "2. If user asks ONLY for datasets, benchmarks, evaluation metrics, or data -> call ONLY 'find_datasets' and set is_final: true when done. Do NOT call search_papers or generate_problem unless explicitly asked!\n"
            "3. If user asks ONLY for literature, papers, background, or survey -> call ONLY 'search_papers' and set is_final: true when done.\n"
            "4. If user asks ONLY for research directions, roadmaps, or gaps -> call ONLY 'generate_problem' and set is_final: true when done.\n"
            "5. If user asks for a comprehensive multi-stage research proposal -> call relevant tools ('search_papers', 'generate_problem', 'find_datasets').\n\n"
            "Return ONLY a JSON object with this exact schema:\n"
            "{\n"
            '  "thought": "Reasoning about query intent and previous memory",\n'
            '  "action": "find_datasets",\n'
            '  "action_input": {"topic": "..."},\n'
            '  "is_final": false,\n'
            '  "memory_summary": "Short 1-sentence summary of active state"\n'
            "}"
        )

        step_count = 0
        max_steps = 5

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
            user_prompt = f"User Goal: {goal}\n\nStep #{step_count} of Max {max_steps}.\n"
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

            if is_final or step_count >= max_steps:
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
    """Intent-aware ReAct step decision fallback."""
    lower_goal = goal.lower()

    is_dataset_request = any(k in lower_goal for k in ["dataset", "benchmark", "metrics", "data", "find out best dataset", "heart disease dataset"])
    is_direction_request = any(k in lower_goal for k in ["direction", "problem", "roadmap", "plan", "future work", "gap"])
    is_literature_request = any(k in lower_goal for k in ["literature", "paper", "survey", "review", "prior work", "overview"])

    if is_dataset_request and not is_literature_request and not is_direction_request:
        if "find_datasets" not in executed:
            return {
                "thought": f"User specifically requested benchmark datasets for '{goal}'. Calling dataset finder tool directly.",
                "action": "find_datasets",
                "action_input": {"topic": goal, "domain": goal},
                "is_final": False,
                "memory_summary": "Recommending benchmark datasets.",
            }
        return {
            "thought": "Completed dataset recommendation. Proceeding to final synthesis.",
            "action": "none",
            "action_input": {},
            "is_final": True,
            "memory_summary": "Dataset finder action completed.",
        }

    if is_direction_request and not is_literature_request:
        if "generate_problem" not in executed:
            return {
                "thought": f"User requested novel research directions for '{goal}'. Calling problem generator tool.",
                "action": "generate_problem",
                "action_input": {"domain": goal, "topic": goal},
                "is_final": False,
                "memory_summary": "Formulating novel research directions.",
            }
        return {
            "thought": "Completed research direction formulation. Proceeding to final synthesis.",
            "action": "none",
            "action_input": {},
            "is_final": True,
            "memory_summary": "Research directions completed.",
        }

    if is_literature_request and not is_direction_request and not is_dataset_request:
        if "search_papers" not in executed:
            return {
                "thought": f"User requested literature review papers for '{goal}'. Searching academic repositories.",
                "action": "search_papers",
                "action_input": {"domain": goal, "topic": goal},
                "is_final": False,
                "memory_summary": "Searching literature repositories.",
            }
        return {
            "thought": "Completed literature search. Proceeding to final synthesis.",
            "action": "none",
            "action_input": {},
            "is_final": True,
            "memory_summary": "Literature search completed.",
        }

    # Full proposal default
    if "search_papers" not in executed:
        return {
            "thought": "Searching literature repositories for primary research papers...",
            "action": "search_papers",
            "action_input": {"domain": goal, "topic": goal},
            "is_final": False,
            "memory_summary": "Initiated literature search.",
        }
    if "find_datasets" not in executed:
        return {
            "thought": "Evaluating SOTA benchmark datasets and evaluation metrics...",
            "action": "find_datasets",
            "action_input": {"topic": goal, "domain": goal},
            "is_final": False,
            "memory_summary": "Recommending datasets.",
        }
    return {
        "thought": "Completed tool actions. Proceeding to final synthesis.",
        "action": "none",
        "action_input": {},
        "is_final": True,
        "memory_summary": "All tool actions finished.",
    }
