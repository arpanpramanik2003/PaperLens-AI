import json
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.agent_task import AgentTask, AgentStep
from app.services.agents.orchestrator import run_research_task
from app.services.agents.trace import subscribe_to_task_events, get_task_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


class CreateTaskRequest(BaseModel):
    goal: str


@router.post("/task")
async def create_task(
    req: CreateTaskRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initialize an autonomous multi-agent research task."""
    if not req.goal or not req.goal.strip():
        raise HTTPException(status_code=400, detail="Research goal cannot be empty")

    task = AgentTask(
        user_id=user_id,
        goal=req.goal.strip(),
        status="running",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Launch background agent orchestrator task
    asyncio.create_task(run_research_task(task_id=task.id, user_id=user_id, goal=task.goal))

    return {"task_id": task.id, "status": "running", "goal": task.goal}


from app.core.security import get_current_user, get_current_user_from_token

@router.get("/task/{task_id}/stream")
async def stream_task(
    task_id: str,
    user_id: str = Depends(get_current_user_from_token),
):
    """Stream live execution trace SSE events for an agent research task."""
    async def event_gen():
        async for event in subscribe_to_task_events(task_id):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/task/{task_id}")
async def get_task_details(
    task_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch task status, metadata, and full execution audit trail steps."""
    task = db.query(AgentTask).filter(AgentTask.id == task_id, AgentTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    steps = db.query(AgentStep).filter(AgentStep.task_id == task_id).order_by(AgentStep.step_index.asc()).all()

    return {
        "id": task.id,
        "goal": task.goal,
        "status": task.status,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "steps": [
            {
                "step_index": s.step_index,
                "tool": s.tool,
                "args": s.args,
                "result": s.result,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in steps
        ],
        "live_history": get_task_history(task_id),
    }


@router.get("/tasks")
async def list_agent_tasks(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all past agent research tasks for the authenticated user."""
    tasks = db.query(AgentTask).filter(AgentTask.user_id == user_id).order_by(AgentTask.created_at.desc()).limit(20).all()
    return [
        {
            "id": t.id,
            "goal": t.goal,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]
