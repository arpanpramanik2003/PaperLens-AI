from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.routes import router
from app.core.security import get_current_user
from app.core.database import engine, Base, get_db
from app.models.domain import Document, Activity

# Push schema directly to Supabase
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Paper Explainer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok"}

@app.get("/api/test-auth")
async def test_auth(user_id: str = Depends(get_current_user)):
    return {"message": "You are fully authenticated!", "user_id": user_id}

@app.get("/api/dashboard")
async def get_dashboard(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    papers_count = db.query(Document).filter(Document.user_id == user_id, Document.status == "Analyzed").count()
    experiments_count = db.query(Activity).filter(Activity.user_id == user_id, Activity.action_type == "plan_experiment").count()
    ideas_count = db.query(Activity).filter(Activity.user_id == user_id, Activity.action_type == "generate_problems").count()
    gaps_count = db.query(Activity).filter(Activity.user_id == user_id, Activity.action_type == "detect_gaps").count()
    citation_count = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.action_type.in_(["citation_intelligence", "citation_discovery"])
    ).count()
    
    recent_docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).limit(5).all()
    
    recent_papers_formatted = []
    for doc in recent_docs:
        diff = datetime.utcnow() - doc.created_at
        hours = diff.total_seconds() // 3600
        if hours < 1:
            date_str = "Just now"
        elif hours < 24:
            date_str = f"{int(hours)} hours ago"
        else:
            date_str = f"{int(hours // 24)} days ago"
            
        recent_papers_formatted.append({
            "title": doc.filename,
            "date": date_str,
            "status": doc.status
        })

    return {
        "stats": [
            { "label": "Papers Analyzed", "value": str(papers_count), "icon": "FileText", "change": "" },
            { "label": "Experiments Planned", "value": str(experiments_count), "icon": "FlaskConical", "change": "" },
            { "label": "Ideas Generated", "value": str(ideas_count), "icon": "Lightbulb", "change": "" },
            { "label": "Gaps Detected", "value": str(gaps_count), "icon": "ScanSearch", "change": "" },
            { "label": "Citations Analyzed", "value": str(citation_count), "icon": "BarChart3", "change": "" },
        ],
        "recentPapers": recent_papers_formatted
    }