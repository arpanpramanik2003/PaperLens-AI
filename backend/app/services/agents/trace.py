import asyncio
import json
import logging
from typing import Dict, Set, AsyncGenerator

logger = logging.getLogger(__name__)

# Map task_id to set of asyncio Queues for connected SSE listeners
_subscribers: Dict[str, Set[asyncio.Queue]] = {}
_event_history: Dict[str, list] = {}

def get_task_history(task_id: str) -> list:
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

    # First yield all historical events if client connected mid-task
    for historical_event in _event_history.get(task_id, []):
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
