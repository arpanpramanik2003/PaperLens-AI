import json
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.agent_task import AgentTask, AgentStep
from app.services.agents.orchestrator import run_research_task, cancel_task
from app.services.agents.trace import subscribe_to_task_events, get_task_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


class CreateTaskRequest(BaseModel):
    goal: str
    paper_id: Optional[str] = None
    session_id: Optional[str] = None
    conversation_history: Optional[list] = None


@router.post("/upload-paper")
async def upload_agent_paper(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a research paper PDF for Agent Mode context, extract pages/chunks, and cache in memory."""
    import hashlib
    from app.models.domain import Document
    from app.services.parsing import parse_pdf_bytes
    from app.services.cache import store_doc, set_active_doc, has_doc, get_doc

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        # Deterministic document ID to reuse cache for same file
        doc_id = hashlib.sha256(f"{file.filename}:{len(content)}".encode("utf-8")).hexdigest()[:12]

        if has_doc(doc_id):
            cached = get_doc(doc_id)
            set_active_doc(doc_id)
            return {
                "paper_id": doc_id,
                "filename": file.filename,
                "total_pages": cached.get("page_count", 1) if cached else 1,
                "status": "ready",
                "message": f"Paper '{file.filename}' loaded from cache.",
            }

        # Fast in-memory extraction via PyMuPDF (fitz)
        parsed_doc = parse_pdf_bytes(content, filename=file.filename)
        chunks = parsed_doc.get("chunks", [])
        total_pages = parsed_doc.get("total_pages", 1)

        # Store in shared cache for instant analysis & gap detection
        store_doc(doc_id, {
            "chunks": chunks,
            "vector_index": None,
            "bm25_index": None,
            "filename": file.filename,
            "page_count": total_pages,
        })
        set_active_doc(doc_id)

        # Store Document Record in DB
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not db_doc:
            db_doc = Document(
                id=doc_id,
                user_id=user_id,
                filename=file.filename,
                title=file.filename,
                status="Analyzed",
            )
            db.add(db_doc)
            db.commit()

        return {
            "paper_id": doc_id,
            "filename": file.filename,
            "total_pages": total_pages,
            "status": "ready",
            "message": f"Paper '{file.filename}' uploaded and indexed for Agent Mode.",
        }
    except Exception as exc:
        logger.error("Failed to process agent paper upload: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF paper: {str(exc)}")


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
        session_id=req.session_id,
        goal=req.goal.strip(),
        status="running",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Launch background agent orchestrator task with optional paper_id and session context
    asyncio.create_task(
        run_research_task(
            task_id=task.id,
            user_id=user_id,
            goal=task.goal,
            paper_id=req.paper_id or "",
            session_id=req.session_id or "",
            conversation_history=req.conversation_history or [],
        )
    )

    return {
        "task_id": task.id,
        "session_id": task.session_id,
        "status": "running",
        "goal": task.goal,
        "paper_id": req.paper_id,
    }


@router.post("/task/{task_id}/cancel")
async def stop_agent_task(
    task_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel / terminate an active autonomous research process."""
    task = db.query(AgentTask).filter(AgentTask.id == task_id, AgentTask.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "cancelled"
    db.commit()

    cancel_task(task_id)
    return {"task_id": task_id, "status": "cancelled", "message": "Research task terminated."}


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
        "session_id": task.session_id,
        "goal": task.goal,
        "status": task.status,
        "context_data": task.context_data,
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
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List past agent research tasks for the authenticated user, optionally scoped to a session."""
    query = db.query(AgentTask).filter(AgentTask.user_id == user_id)
    if session_id:
        query = query.filter(AgentTask.session_id == session_id)
    tasks = query.order_by(AgentTask.created_at.desc()).limit(20).all()
    return [
        {
            "id": t.id,
            "session_id": t.session_id,
            "goal": t.goal,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]
