import hashlib
import os
import shutil
from typing import Optional

from fastapi import APIRouter, File, UploadFile, Depends, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.models.domain import Document, Activity

from app.core.config import settings
from app.models.schemas import AskRequest, ExperimentPlanRequest, ProblemGeneratorRequest, GapDetectionRequest, ProblemDetailRequest, DatasetBenchmarkFinderRequest, CitationRecommendationRequest
from app.services.cache import get_doc, get_current_doc_id, has_doc, set_active_doc, store_doc
from app.services.chunking import chunk_text_semantic
from app.services.llm import analyze_paper, build_analysis_prompt, stream_completion, stream_answer, summarize_chunks
from app.services.parsing import extract_docx_pages, extract_pdf_pages, ParsingLimitError
from app.services.retrieval import build_vector_store
from app.services.citation_intelligence import run_citation_intelligence

router = APIRouter()


class PaperTooLengthyError(Exception):

    def __init__(self, detail):
        super().__init__(detail)
        self.detail = detail


def _raise_if_paper_too_lengthy(pages):

    page_count = len(pages)

    if settings.MAX_PAGES > 0 and page_count > settings.MAX_PAGES:
        raise PaperTooLengthyError(
            f"Paper is too lengthy ({page_count} pages). Please upload up to {settings.MAX_PAGES} pages."
        )

    total_chars = sum(len(page.get("text", "")) for page in pages)

    if settings.MAX_TOTAL_CHARS > 0 and total_chars > settings.MAX_TOTAL_CHARS:
        raise PaperTooLengthyError(
            "Paper is too lengthy for this deployment. Please upload a shorter paper."
        )


def _lengthy_response(message):
    return JSONResponse(
        {
            "error": message,
            "code": "PAPER_TOO_LENGTHY"
        },
        status_code=413
    )


@router.post("/analyze")
async def analyze(file: UploadFile = File(...), user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):

    try:

        if not file.filename:
            return JSONResponse({"error": "No file selected"}, status_code=400)

        ext = os.path.splitext(file.filename.lower())[1]

        if ext not in [".pdf", ".docx"]:
            return JSONResponse({"error": "Only PDF or DOCX files allowed"}, status_code=400)

        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)

        if settings.MAX_UPLOAD_MB > 0 and size_bytes > settings.MAX_UPLOAD_MB * 1024 * 1024:
            return JSONResponse({"error": f"File too large. Max allowed is {settings.MAX_UPLOAD_MB} MB."}, status_code=413)

        doc_id = hashlib.sha256(f"{file.filename}:{size_bytes}".encode("utf-8")).hexdigest()[:12]

        if has_doc(doc_id):
            set_active_doc(doc_id)
            cached = get_doc(doc_id)
            return {
                "result": cached["analysis"],
                "doc_id": doc_id
            }

        path = os.path.join(settings.UPLOAD_FOLDER, file.filename)

        with open(path, "wb") as handle:
            shutil.copyfileobj(file.file, handle)

        file.file.seek(0)

        if ext == ".pdf":
            pages = extract_pdf_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )
        else:
            pages = extract_docx_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )

        if not pages:
            return JSONResponse({"error": "Could not extract text"}, status_code=400)

        _raise_if_paper_too_lengthy(pages)

        chunks = chunk_text_semantic(pages)

        if settings.MAX_CHUNKS > 0 and len(chunks) > settings.MAX_CHUNKS:
            chunks = chunks[:settings.MAX_CHUNKS]

        index, bm25 = build_vector_store(chunks)

        result = analyze_paper(chunks)

        store_doc(doc_id, {
            "chunks": chunks,
            "vector_index": index,
            "bm25_index": bm25,
            "analysis": result,
            "filename": file.filename
        })

        set_active_doc(doc_id)
        
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if not db_doc:
            db_doc = Document(id=doc_id, user_id=user_id, filename=file.filename, title=file.filename, status="Analyzed")
            db.add(db_doc)
        db_activity = Activity(user_id=user_id, action_type="analyze_paper", metadata_json={"filename": file.filename})
        db.add(db_activity)
        db.commit()

        try:
            os.remove(path)
        except OSError:
            pass

        return {"result": result, "doc_id": doc_id}

    except PaperTooLengthyError as exc:

        return _lengthy_response(exc.detail)

    except MemoryError:

        return _lengthy_response("Paper is too lengthy for this deployment. Please upload a shorter paper.")

    except ParsingLimitError as exc:

        return _lengthy_response(exc.detail)

    except Exception as exc:

        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/analyze_stream")
async def analyze_stream(file: UploadFile = File(...), user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):

    try:

        if not file.filename:
            return JSONResponse({"error": "No file selected"}, status_code=400)

        ext = os.path.splitext(file.filename.lower())[1]

        if ext not in [".pdf", ".docx"]:
            return JSONResponse({"error": "Only PDF or DOCX files allowed"}, status_code=400)

        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)

        if settings.MAX_UPLOAD_MB > 0 and size_bytes > settings.MAX_UPLOAD_MB * 1024 * 1024:
            return JSONResponse({"error": f"File too large. Max allowed is {settings.MAX_UPLOAD_MB} MB."}, status_code=413)

        doc_id = hashlib.sha256(f"{file.filename}:{size_bytes}".encode("utf-8")).hexdigest()[:12]

        if has_doc(doc_id):
            set_active_doc(doc_id)
            cached = get_doc(doc_id)

            def cached_stream():
                yield f"__DOC_ID__:{doc_id}\n"
                yield cached["analysis"]

            return StreamingResponse(cached_stream(), media_type="text/plain")

        path = os.path.join(settings.UPLOAD_FOLDER, file.filename)

        with open(path, "wb") as handle:
            shutil.copyfileobj(file.file, handle)

        file.file.seek(0)

        if ext == ".pdf":
            pages = extract_pdf_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )
        else:
            pages = extract_docx_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )

        if not pages:
            return JSONResponse({"error": "Could not extract text"}, status_code=400)

        _raise_if_paper_too_lengthy(pages)

        chunks = chunk_text_semantic(pages)

        if settings.MAX_CHUNKS > 0 and len(chunks) > settings.MAX_CHUNKS:
            chunks = chunks[:settings.MAX_CHUNKS]

        index, bm25 = build_vector_store(chunks)

        combined_summary = summarize_chunks(chunks)
        prompt = build_analysis_prompt(combined_summary)

        def stream_response():

            full_text = ""
            yield f"__DOC_ID__:{doc_id}\n"

            for token in stream_completion(
                prompt,
                "You write structured, strictly grounded research summaries."
            ):
                full_text += token
                yield token

            store_doc(doc_id, {
                "chunks": chunks,
                "vector_index": index,
                "bm25_index": bm25,
                "analysis": full_text,
                "filename": file.filename
            })

            set_active_doc(doc_id)
            
            db_doc = db.query(Document).filter(Document.id == doc_id).first()
            if not db_doc:
                db_doc = Document(id=doc_id, user_id=user_id, filename=file.filename, title=file.filename, status="Analyzed")
                db.add(db_doc)
            db_activity = Activity(user_id=user_id, action_type="analyze_paper", metadata_json={"filename": file.filename})
            db.add(db_activity)
            db.commit()

            try:
                os.remove(path)
            except OSError:
                pass

        return StreamingResponse(stream_response(), media_type="text/plain")

    except PaperTooLengthyError as exc:

        return _lengthy_response(exc.detail)

    except MemoryError:

        return _lengthy_response("Paper is too lengthy for this deployment. Please upload a shorter paper.")

    except ParsingLimitError as exc:

        return _lengthy_response(exc.detail)

    except Exception as exc:

        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/ask")
async def ask(payload: AskRequest, user_id: str = Depends(get_current_user)):

    if not payload.question:
        return JSONResponse({"error": "Question required"}, status_code=400)

    if payload.doc_id:
        if not set_active_doc(payload.doc_id):
            return JSONResponse({"error": "Document not found. Please re-upload."}, status_code=400)
    elif get_current_doc_id() is None:
        return JSONResponse({"error": "No document loaded. Please upload first."}, status_code=400)

    from app.services.llm import answer_question

    answer = answer_question(payload.question)

    return {"answer": answer}


@router.post("/ask_stream")
async def ask_stream(payload: AskRequest, user_id: str = Depends(get_current_user)):

    if not payload.question:
        return JSONResponse({"error": "Question required"}, status_code=400)

    if payload.doc_id:
        if not set_active_doc(payload.doc_id):
            return JSONResponse({"error": "Document not found. Please re-upload."}, status_code=400)
    elif get_current_doc_id() is None:
        return JSONResponse({"error": "No document loaded. Please upload first."}, status_code=400)

    def stream_response():
        for token in stream_answer(payload.question):
            yield token

    return StreamingResponse(stream_response(), media_type="text/plain")


@router.post("/plan-experiment")
async def plan_experiment(payload: ExperimentPlanRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        from app.services.llm import generate_experiment_plan
        plan = generate_experiment_plan(payload.topic, payload.difficulty)
        
        db_activity = Activity(user_id=user_id, action_type="plan_experiment", metadata_json={"topic": payload.topic, "difficulty": payload.difficulty})
        db.add(db_activity)
        db.commit()

        return JSONResponse(plan)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/generate-problems")
async def generate_problems(payload: ProblemGeneratorRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        from app.services.llm import generate_research_problems
        ideas = generate_research_problems(payload.domain, payload.subdomain, payload.complexity)
        
        db_activity = Activity(user_id=user_id, action_type="generate_problems", metadata_json={"domain": payload.domain, "subdomain": payload.subdomain})
        db.add(db_activity)
        db.commit()

        return JSONResponse(ideas)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/expand-problem")
async def expand_problem(payload: ProblemDetailRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        from app.services.llm import expand_problem_details

        details = expand_problem_details(
            payload.domain,
            payload.subdomain,
            payload.complexity,
            payload.idea,
        )

        db_activity = Activity(
            user_id=user_id,
            action_type="expand_problem",
            metadata_json={
                "domain": payload.domain,
                "subdomain": payload.subdomain,
                "title": payload.idea.get("title", "") if isinstance(payload.idea, dict) else ""
            },
        )
        db.add(db_activity)
        db.commit()

        return JSONResponse(details)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == user_id).all()
    return [{"id": d.id, "filename": d.filename} for d in docs]


@router.post("/detect-gaps")
async def detect_gaps(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        content_to_analyze = ""
        
        if file and file.filename:
            ext = os.path.splitext(file.filename.lower())[1]
            if ext not in [".pdf", ".docx"]:
                return JSONResponse({"error": "Only PDF or DOCX files allowed"}, status_code=400)
            
            os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
            path = os.path.join(settings.UPLOAD_FOLDER, file.filename)
            with open(path, "wb") as handle:
                shutil.copyfileobj(file.file, handle)
            
            if ext == ".pdf":
                pages = extract_pdf_pages(
                    path,
                    max_pages=settings.MAX_PAGES,
                    max_total_chars=settings.MAX_TOTAL_CHARS
                )
            else:
                pages = extract_docx_pages(
                    path,
                    max_pages=settings.MAX_PAGES,
                    max_total_chars=settings.MAX_TOTAL_CHARS
                )
            
            try:
                os.remove(path)
            except OSError:
                pass
            
            if not pages:
                return JSONResponse({"error": "Could not extract text"}, status_code=400)
            
            chunks = chunk_text_semantic(pages)
            content_to_analyze = summarize_chunks(chunks)
        elif text:
            content_to_analyze = text
        else:
            return JSONResponse({"error": "No file or text provided"}, status_code=400)

        from app.services.llm import detect_research_gaps
        gaps = detect_research_gaps(content_to_analyze)
        
        db_activity = Activity(user_id=user_id, action_type="detect_gaps", metadata_json={"method": "direct_input"})
        db.add(db_activity)
        db.commit()

        return JSONResponse(gaps)
    except ParsingLimitError as exc:
        return _lengthy_response(exc.detail)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/find-datasets-benchmarks")
async def find_datasets_benchmarks(
    payload: DatasetBenchmarkFinderRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        project_title = (payload.project_title or "").strip()
        project_plan = (payload.project_plan or "").strip()

        if not project_title and not project_plan:
            return JSONResponse(
                {"error": "Please provide project title or project plan."},
                status_code=400
            )

        from app.services.llm import generate_dataset_benchmark_finder

        recommendations = generate_dataset_benchmark_finder(project_title, project_plan)

        db_activity = Activity(
            user_id=user_id,
            action_type="find_datasets_benchmarks",
            metadata_json={
                "project_title": project_title,
                "has_project_plan": bool(project_plan),
            }
        )
        db.add(db_activity)
        db.commit()

        return JSONResponse(recommendations)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/citation-intelligence")
async def citation_intelligence(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not file.filename:
            return JSONResponse({"error": "No file selected"}, status_code=400)

        ext = os.path.splitext(file.filename.lower())[1]
        if ext not in [".pdf", ".docx"]:
            return JSONResponse({"error": "Only PDF or DOCX files allowed"}, status_code=400)

        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)

        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)

        if settings.MAX_UPLOAD_MB > 0 and size_bytes > settings.MAX_UPLOAD_MB * 1024 * 1024:
            return JSONResponse({"error": f"File too large. Max allowed is {settings.MAX_UPLOAD_MB} MB."}, status_code=413)

        path = os.path.join(settings.UPLOAD_FOLDER, file.filename)

        with open(path, "wb") as handle:
            shutil.copyfileobj(file.file, handle)

        if ext == ".pdf":
            pages = extract_pdf_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )
        else:
            pages = extract_docx_pages(
                path,
                max_pages=settings.MAX_PAGES,
                max_total_chars=settings.MAX_TOTAL_CHARS
            )

        try:
            os.remove(path)
        except OSError:
            pass

        if not pages:
            return JSONResponse({"error": "Could not extract text"}, status_code=400)

        _raise_if_paper_too_lengthy(pages)

        if not settings.SEMANTIC_SCHOLAR_API_KEY:
            return JSONResponse(
                {"error": "Semantic Scholar API key is not configured on the server."},
                status_code=500,
            )

        report = run_citation_intelligence(
            pages=pages,
            semantic_scholar_api_key=settings.SEMANTIC_SCHOLAR_API_KEY,
            max_references=settings.CITATION_MAX_REFERENCES,
        )

        db_activity = Activity(
            user_id=user_id,
            action_type="citation_intelligence",
            metadata_json={
                "filename": file.filename,
                "references_processed": report.get("references_processed", 0),
                "matched_count": report.get("matched_count", 0),
                "missing_count": report.get("missing_count", 0),
            },
        )
        db.add(db_activity)
        db.commit()

        return JSONResponse(report)
    except PaperTooLengthyError as exc:
        return _lengthy_response(exc.detail)
    except ParsingLimitError as exc:
        return _lengthy_response(exc.detail)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/citation-intelligence/recommendations")
async def citation_intelligence_recommendations(
    payload: CitationRecommendationRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        from app.services.llm import generate_citation_recommendations

        recommendations = generate_citation_recommendations(
            paper_context=(payload.paper_context or "").strip(),
            top_cited=payload.top_cited or [],
            missing_references=payload.missing_references or [],
        )

        db_activity = Activity(
            user_id=user_id,
            action_type="citation_recommendations",
            metadata_json={
                "top_cited_count": len(payload.top_cited or []),
                "missing_count": len(payload.missing_references or []),
            },
        )
        db.add(db_activity)
        db.commit()

        return JSONResponse(recommendations)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
