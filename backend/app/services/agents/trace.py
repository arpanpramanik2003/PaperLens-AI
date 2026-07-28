import asyncio
import json
import logging
from typing import Dict, Set, AsyncGenerator

from app.core.database import SessionLocal
from app.models.agent_task import AgentTask, AgentStep

logger = logging.getLogger(__name__)

# Map task_id to set of asyncio Queues for connected SSE listeners
_subscribers: Dict[str, Set[asyncio.Queue]] = {}
_event_history: Dict[str, list] = {}


def _reconstruct_history_from_db(task_id: str) -> list:
    """Reconstruct task execution trace from database audit trail."""
    try:
        db = SessionLocal()
        try:
            task = db.query(AgentTask).filter(AgentTask.id == task_id).first()
            if not task:
                return []

            steps = (
                db.query(AgentStep)
                .filter(AgentStep.task_id == task_id)
                .order_by(AgentStep.step_index.asc())
                .all()
            )

            reconstructed = []
            for s in steps:
                reconstructed.append({
                    "type": "tool_call",
                    "step_index": s.step_index,
                    "tool": s.tool,
                    "args": s.args,
                    "description": f"Executing {s.tool}",
                })
                reconstructed.append({
                    "type": "tool_result",
                    "step_index": s.step_index,
                    "tool": s.tool,
                    "data": s.result,
                    "summary": f"Completed {s.tool}",
                })

            if task.status == "done":
                reconstructed.append({
                    "type": "final",
                    "answer": "Task execution completed and loaded from persistent database state.",
                    "status": task.status,
                })
            elif task.status == "failed":
                reconstructed.append({
                    "type": "error",
                    "message": "Task was interrupted or failed in a previous run.",
                })

            return reconstructed
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Failed to reconstruct task history from DB for %s: %s", task_id, exc)
        return []


def get_task_history(task_id: str) -> list:
    if task_id in _event_history and _event_history[task_id]:
        return _event_history[task_id]

    db_history = _reconstruct_history_from_db(task_id)
    if db_history:
        _event_history[task_id] = db_history
        return db_history

    return _event_history.get(task_id, [])


def emit_event(task_id: str, event: dict):
    """Publish an event to all connected SSE clients and record history."""
    if task_id not in _event_history:
        _event_history[task_id] = []
    _event_history[task_id].append(event)

    queues = _subscribers.get(task_id, set())
    for q in list(queues):
        try:
            q.put_nowait(event)
        except Exception as e:
            logger.warning("Failed to queue SSE event for task %s: %s", task_id, e)


async def subscribe_to_task_events(task_id: str) -> AsyncGenerator[dict, None]:
    """Yield SSE events for a task_id as they occur."""
    q: asyncio.Queue = asyncio.Queue()
    if task_id not in _subscribers:
        _subscribers[task_id] = set()
    _subscribers[task_id].add(q)

    # Fetch historical events (RAM or DB fallback)
    history = get_task_history(task_id)
    for historical_event in history:
        yield historical_event
        if historical_event.get("type") in ("final", "error"):
            # Task already ended
            _subscribers[task_id].discard(q)
            return

    try:
        while True:
            event = await q.get()
            yield event
            if event.get("type") in ("final", "error"):
                break
    finally:
        if task_id in _subscribers:
            _subscribers[task_id].discard(q)
            if not _subscribers[task_id]:
                del _subscribers[task_id]
