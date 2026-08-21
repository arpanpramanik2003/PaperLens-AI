import json
import logging
import asyncio
from typing import Dict, Any, List
from pydantic import BaseModel, Field

from app.core.database import SessionLocal
from app.models.agent_task import AgentTask, AgentStep
from app.services.agents.tools import TOOL_REGISTRY, NATIVE_TOOLS_SCHEMA, validate_and_normalize_tool_args
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


class ReActDecision(BaseModel):
    thought: str = Field(description="Detailed reasoning about user intent, findings so far, and next action")
    action: str = Field(default="search_papers", description="Selected tool name from registered tools, or 'none' if finished")
    action_input: Dict[str, Any] = Field(default_factory=dict, description="Dictionary of parameter arguments for the tool action")
    is_final: bool = Field(default=False, description="Set to true if all research steps are complete")
    memory_summary: str = Field(default="", description="1-sentence summary of current findings and progress")


def extract_structured_entities(tool_name: str, result: Any) -> Dict[str, Any]:
    """Extract clean, strongly-typed semantic entities from raw tool output."""
    if not isinstance(result, dict):
        return {"raw_summary": str(result)[:300]}

    if tool_name == "search_papers":
        papers = result.get("papers") or []
        extracted_papers = []
        for p in papers[:5]:
            extracted_papers.append({
                "title": p.get("title") or "Untitled",
                "year": p.get("year") or 2024,
                "authors": p.get("authors")[:3] if isinstance(p.get("authors"), list) else p.get("authors"),
                "summary": (p.get("summary") or "")[:200],
            })
        return {
            "total_found": result.get("total_found", len(papers)),
            "primary_papers": extracted_papers,
        }

    elif tool_name == "detect_gaps":
        gaps = result.get("gaps") or []
        extracted_gaps = []
        for g in gaps[:6]:
            if isinstance(g, dict):
                extracted_gaps.append({
                    "gap": g.get("gap") or g.get("title") or "Research Gap",
                    "title": g.get("title") or g.get("gap") or "Research Gap",
                    "description": (g.get("explanation") or g.get("description") or g.get("detail") or "")[:400],
                    "explanation": g.get("explanation") or g.get("description") or g.get("detail") or "",
                    "severity": g.get("severity") or "medium",
                    "opportunity": g.get("suggestion") or g.get("opportunity") or g.get("mitigation") or g.get("solution_angle") or "",
                    "suggestion": g.get("suggestion") or g.get("opportunity") or g.get("mitigation") or "",
                })
            else:
                extracted_gaps.append({
                    "gap": str(g),
                    "title": str(g),
                    "description": "",
                    "explanation": "",
                    "severity": "medium",
                    "opportunity": "",
                    "suggestion": "",
                })
        return {"identified_gaps": extracted_gaps}

    elif tool_name == "generate_problem":
        problems = result.get("problems") or result.get("problem_statements") or []
        extracted_problems = []
        for pr in problems[:4]:
            extracted_problems.append({
                "title": pr.get("title") or pr.get("name") or "Problem Direction",
                "description": (pr.get("description") or pr.get("problem_statement") or "")[:250],
                "gap_addressed": pr.get("gap_addressed") or pr.get("targeted_gap"),
            })
        return {"formulated_problems": extracted_problems}

    elif tool_name == "find_datasets":
        datasets = result.get("datasets") or []
        extracted_ds = []
        for ds in datasets[:5]:
            extracted_ds.append({
                "name": ds.get("name") or "Benchmark Dataset",
                "type": ds.get("type") or ds.get("data_modality"),
                "description": (ds.get("short_description") or ds.get("description") or "")[:200],
                "metrics": ds.get("metrics") or ds.get("evaluation_metrics"),
            })
        return {"suggested_datasets": extracted_ds}

    elif tool_name == "plan_experiment":
        stages = result.get("stages") or result.get("phases") or []
        extracted_stages = []
        for st in stages[:4]:
            extracted_stages.append({
                "phase": st.get("phase") or st.get("stage_name") or "Stage",
                "focus": (st.get("focus") or st.get("description") or "")[:200],
                "deliverable": st.get("deliverable") or st.get("outcome"),
            })
        return {"execution_stages": extracted_stages}

    elif tool_name == "analyze_paper":
        insights = result.get("insights") or result.get("analysis") or result
        return {
            "key_contributions": insights.get("methodology") or insights.get("contributions", [])[:3] if isinstance(insights, dict) else [],
            "limitations": insights.get("limitations", [])[:3] if isinstance(insights, dict) else [],
        }

    return {"summary": str(result)[:300]}


async def run_react_agent_loop(
    task_id: str,
    user_id: str,
    goal: str,
    paper_id: str = "",
    session_id: str = "",
    conversation_history: List[Dict[str, Any]] = None,
):
    """Two-Tier Autonomous Agent Execution with structured entity extraction and working memory propagation."""
    db = SessionLocal()
    try:
        task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
        if not task:
            logger.error("AgentTask %s not found in DB", task_id)
            return

        # Working Memory & Context State
        executed_results: List[Dict[str, Any]] = []
        executed_tools: set = set()
        structured_memory: Dict[str, Any] = {}

        # Tool Scoping & Intent Check with Multi-Turn Context
        from app.services.agents.router import select_agent_tools
        router_res = await select_agent_tools(goal, TOOL_REGISTRY, conversation_history=conversation_history or [])
        intent_type = router_res.get("intent_type", "research_tools")
        execution_mode = router_res.get("execution_mode", "direct")
        selected_tool_items = router_res.get("selected_tools", [])
        selected_tool_names = {t.get("tool") for t in selected_tool_items if t.get("tool")}

        # ---------------------------------------------------------------------------
        # FAST-PATH 0: DIRECT CHAT (Bypasses research tools completely)
        # ---------------------------------------------------------------------------
        if intent_type == "direct_chat" or not selected_tool_names:
            logger.info("Direct chat fast-path triggered for goal: '%s' (session=%s)", goal, session_id)
            trace.emit_event(task_id, {
                "type": "thought",
                "thought": "Direct conversational query detected. Generating conversational response without tools...",
            })

            context_snippet = ""
            if conversation_history:
                prior_exchanges = [
                    f"{t.get('role', 'user').upper()}: {t.get('text', '')[:200]}"
                    for t in conversation_history[-3:]
                ]
                context_snippet = "Prior Conversation:\n" + "\n".join(prior_exchanges) + "\n\n"

            chat_prompt = (
                "You are PaperLens AI, an intelligent, friendly, and helpful AI research assistant.\n"
                "Answer the user's conversational query in a clear, friendly, and well-structured Markdown response.\n\n"
                f"{context_snippet}User Query: {goal}"
            )

            try:
                response = create_completion_with_fallback(
                    llm_client=client,
                    task_name="agent_direct_chat",
                    primary_model=DEFAULT_PRIMARY_MODEL,
                    fallback_models=DEFAULT_FALLBACK_MODELS,
                    messages=[
                        {"role": "system", "content": "You are PaperLens AI, a friendly, articulate AI assistant. Respond warmly and naturally in markdown."},
                        {"role": "user", "content": chat_prompt},
                    ],
                    temperature=0.6,
                    max_tokens=1000,
                )
                conversational_answer = response.choices[0].message.content or "Hello! I am PaperLens AI, your autonomous research assistant. How can I help you today?"
            except Exception as e:
                logger.warning("Direct chat completion fallback: %s", e)
                conversational_answer = "Hello! I am PaperLens AI, your intelligent research assistant. How can I help you with your literature or paper analysis today?"

            task.status = "done"
            task.context_data = {
                "goal": goal,
                "session_id": session_id,
                "intent_type": "direct_chat",
                "execution_mode": "direct",
                "summary": conversational_answer[:300],
            }
            db.commit()

            trace.emit_event(task_id, {
                "type": "final",
                "answer": conversational_answer,
                "results": [],
                "critique": None,
            })
            return

        # ---------------------------------------------------------------------------
        # TIER 1: DIRECT DETERMINISTIC EXECUTION PIPELINE (Eliminates ReAct re-routing)
        # ---------------------------------------------------------------------------
        if execution_mode == "direct" and selected_tool_items:
            logger.info(
                "Tier 1 Direct Execution active for %d tools: %s (session=%s)",
                len(selected_tool_items),
                [t.get("tool") for t in selected_tool_items],
                session_id,
            )
            trace.emit_event(task_id, {
                "type": "thought",
                "step_index": 1,
                "thought": f"Direct Execution Pipeline active. Executing {len(selected_tool_items)} specialized research tools directly with structured context passing...",
            })

            step_idx = 0
            for item in selected_tool_items:
                if task_id in _cancelled_tasks:
                    task.status = "cancelled"
                    db.commit()
                    _cancelled_tasks.discard(task_id)
                    trace.emit_event(task_id, {"type": "cancelled", "message": "Process terminated by user."})
                    return

                step_idx += 1
                t_name = item.get("tool")
                if not t_name:
                    continue

                # Type-safe parameter validation and structured memory propagation
                t_args = validate_and_normalize_tool_args(
                    t_name,
                    item.get("args"),
                    goal,
                    paper_id,
                    structured_context=structured_memory,
                )

                trace.emit_event(task_id, {
                    "type": "action",
                    "step_index": step_idx,
                    "tool": t_name,
                    "args": t_args,
                    "description": item.get("description") or f"Executing {t_name} with contextual arguments",
                })

                if t_name in TOOL_REGISTRY:
                    fn = TOOL_REGISTRY[t_name]["fn"]
                    try:
                        result = await fn(**t_args)
                    except Exception as exc:
                        logger.error("Direct tool %s failed: %s. Retrying with normalized fallback...", t_name, exc)
                        try:
                            fallback_args = validate_and_normalize_tool_args(t_name, {}, goal, paper_id, structured_context=structured_memory)
                            result = await fn(**fallback_args)
                        except Exception as retry_exc:
                            result = {
                                "status": "unavailable",
                                "error": str(exc),
                                "message": f"Data source for {t_name} was temporarily unavailable or timed out.",
                            }
                else:
                    result = {
                        "status": "unavailable",
                        "error": f"Tool {t_name} not registered",
                        "message": f"Requested tool '{t_name}' could not be executed.",
                    }

                # Extract and accumulate structured entities for subsequent tools
                extracted_entities = extract_structured_entities(t_name, result)
                structured_memory.update(extracted_entities)

                executed_tools.add(t_name)
                executed_results.append({
                    "tool": t_name,
                    "args": t_args,
                    "result": result,
                    "structured_entities": extracted_entities,
                })

                # Save Audit Step to DB
                try:
                    db_step = AgentStep(
                        task_id=task_id,
                        step_index=step_idx,
                        tool=t_name,
                        args=t_args,
                        result=result,
                    )
                    db.add(db_step)
                    db.commit()
                except Exception as e:
                    db.rollback()

                trace.emit_event(task_id, {
                    "type": "observation",
                    "step_index": step_idx,
                    "tool": t_name,
                    "summary": summarize_result(result),
                    "data": result,
                })
                trace.emit_event(task_id, {
                    "type": "memory_update",
                    "step_index": step_idx,
                    "total_tools_executed": len(executed_results),
                    "latest_tool": t_name,
                    "active_memory_summary": f"Collected structured entities from {t_name}.",
                    "structured_memory": structured_memory,
                })

            # Single unified synthesis pass (Total LLM calls = 1 if fast-path, or 2 if router was called)
            trace.emit_event(task_id, {
                "type": "critique_start",
                "message": "Synthesizing executive multi-agent research proposal from structured findings...",
            })

            from app.services.agents import planner
            critique_result, final_answer = await planner.synthesize_and_verify(goal, executed_results)

            trace.emit_event(task_id, {
                "type": "critique",
                "issues": critique_result.get("issues", []),
                "strengths": critique_result.get("strengths", []),
                "verdict": critique_result.get("verdict", "Passed with High Confidence"),
                "data": critique_result,
            })

            task.status = "done"
            task.context_data = {
                "goal": goal,
                "session_id": session_id,
                "executed_tools": list(executed_tools),
                "execution_mode": "direct",
                "structured_memory": structured_memory,
                "summary": final_answer[:400] if final_answer else "",
            }
            db.commit()

            trace.emit_event(task_id, {
                "type": "final",
                "answer": final_answer,
                "results": executed_results,
                "critique": critique_result,
            })
            return

        # ---------------------------------------------------------------------------
        # TIER 2: NATIVE TOOL-CALLING REACT LOOP (For exploratory/open-ended queries)
        # ---------------------------------------------------------------------------
        logger.info("Tier 2 Native Tool ReAct Loop active for exploratory goal: '%s'", goal)
        step_count = 0
        max_steps = 5

        system_prompt = (
            "You are PaperLens Autonomous Research Agent.\n"
            "Analyze the user's research goal and execute tools via function calls to collect empirical evidence, literature, and benchmarks.\n"
            "When all necessary research findings have been gathered, reply with a final thought or conclude with no tool calls."
        )

        while step_count < max_steps:
            if task_id in _cancelled_tasks:
                task.status = "cancelled"
                db.commit()
                _cancelled_tasks.discard(task_id)
                trace.emit_event(task_id, {"type": "cancelled", "message": "Process terminated by user."})
                return

            step_count += 1

            # Prepare structured working memory prompt (replaces 150-char string truncation)
            user_prompt = f"User Research Goal: {goal}\nStep #{step_count} of Max {max_steps}.\n"
            if structured_memory:
                user_prompt += f"\nStructured Working Memory Entities:\n{json.dumps(structured_memory, indent=2)}\n"

            action_tool = None
            action_args = {}
            thought = f"Analyzing step #{step_count} requirements..."
            is_final = False

            try:
                llm_response = create_completion_with_fallback(
                    llm_client=client,
                    task_name="react_agent_native_tools",
                    primary_model=FAST_ROUTER_MODEL,
                    fallback_models=DEFAULT_FALLBACK_MODELS,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    tools=NATIVE_TOOLS_SCHEMA,
                    tool_choice="auto",
                    temperature=0.2,
                )
                msg = llm_response.choices[0].message
                if msg.tool_calls:
                    tc = msg.tool_calls[0]
                    action_tool = tc.function.name
                    try:
                        raw_args = json.loads(tc.function.arguments)
                    except Exception:
                        raw_args = {}
                    action_args = validate_and_normalize_tool_args(
                        action_tool,
                        raw_args,
                        goal,
                        paper_id,
                        structured_context=structured_memory,
                    )
                    thought = msg.content or f"Calling tool {action_tool} to gather research data."
                else:
                    is_final = True
                    thought = msg.content or "Completed research observations."
            except Exception as exc:
                logger.warning("Native tool calling step %s failed: %s. Using fallback.", step_count, exc)
                fallback_d = _fallback_react_decision(goal, step_count, executed_tools, selected_tool_names)
                action_tool = fallback_d.get("action", "none")
                action_args = validate_and_normalize_tool_args(
                    action_tool,
                    fallback_d.get("action_input"),
                    goal,
                    paper_id,
                    structured_context=structured_memory,
                )
                is_final = fallback_d.get("is_final", False)
                thought = fallback_d.get("thought", thought)

            trace.emit_event(task_id, {
                "type": "thought",
                "step_index": step_count,
                "thought": thought,
                "memory_summary": f"Step {step_count} reasoning active.",
                "is_final": is_final,
            })

            if is_final or not action_tool or action_tool == "none":
                logger.info("ReAct agent reached final state at step %s", step_count)
                break

            # Execute tool with type-safe arguments and recovery
            trace.emit_event(task_id, {
                "type": "action",
                "step_index": step_count,
                "tool": action_tool,
                "args": action_args,
                "description": f"Executing {action_tool} with validated arguments",
            })

            if action_tool in TOOL_REGISTRY:
                fn = TOOL_REGISTRY[action_tool]["fn"]
                try:
                    result = await fn(**action_args)
                except Exception as exc:
                    logger.error("ReAct Tool %s failed: %s. Attempting retry...", action_tool, exc)
                    try:
                        simplified_args = validate_and_normalize_tool_args(
                            action_tool,
                            {},
                            goal,
                            paper_id,
                            structured_context=structured_memory,
                        )
                        result = await fn(**simplified_args)
                    except Exception as retry_exc:
                        result = {
                            "status": "unavailable",
                            "error": str(exc),
                            "message": f"Data source for {action_tool} was temporarily unavailable.",
                        }
            else:
                result = {
                    "status": "unavailable",
                    "error": f"Tool {action_tool} not registered",
                    "message": f"Requested tool '{action_tool}' could not be executed.",
                }

            extracted_entities = extract_structured_entities(action_tool, result)
            structured_memory.update(extracted_entities)

            executed_tools.add(action_tool)
            executed_results.append({
                "tool": action_tool,
                "args": action_args,
                "result": result,
                "structured_entities": extracted_entities,
            })

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

            trace.emit_event(task_id, {
                "type": "observation",
                "step_index": step_count,
                "tool": action_tool,
                "summary": summarize_result(result),
                "data": result,
            })
            trace.emit_event(task_id, {
                "type": "memory_update",
                "step_index": step_count,
                "total_tools_executed": len(executed_results),
                "latest_tool": action_tool,
                "active_memory_summary": f"Collected structured findings from {len(executed_results)} action cycles.",
                "structured_memory": structured_memory,
            })

            if selected_tool_names and selected_tool_names.issubset(executed_tools):
                logger.info("All selected target tools executed. Completing ReAct loop.")
                break

            await asyncio.sleep(1.0)

        # Critique & Synthesis Phase
        trace.emit_event(task_id, {
            "type": "critique_start",
            "message": "Auditing findings & synthesizing executive multi-agent proposal...",
        })

        from app.services.agents import planner
        critique_result, final_answer = await planner.synthesize_and_verify(goal, executed_results)

        trace.emit_event(task_id, {
            "type": "critique",
            "issues": critique_result.get("issues", []),
            "strengths": critique_result.get("strengths", []),
            "verdict": critique_result.get("verdict", "Passed with High Confidence"),
            "data": critique_result,
        })

        task.status = "done"
        task.context_data = {
            "goal": goal,
            "session_id": session_id,
            "executed_tools": list(executed_tools),
            "execution_mode": "react_loop",
            "structured_memory": structured_memory,
            "summary": final_answer[:400] if final_answer else "",
        }
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


def _fallback_react_decision(goal: str, step: int, executed: set, target_tools: set | None = None) -> Dict[str, Any]:
    """Autonomous ReAct step decision fallback using un-executed tools from scoped target tools."""
    pipeline = ["find_datasets", "search_papers", "generate_problem", "plan_experiment"]
    if target_tools:
        pipeline = [t for t in pipeline if t in target_tools]

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
        "thought": "All targeted research tools completed. Proceeding to final synthesis.",
        "action": "none",
        "action_input": {},
        "is_final": True,
        "memory_summary": "All tool steps finished.",
    }
