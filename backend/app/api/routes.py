import hashlib
import os
import re
import shutil
from typing import Optional

from fastapi import APIRouter, File, UploadFile, Depends, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.models.domain import Document, Activity

from app.core.config import settings
from app.models.schemas import AskRequest, ExperimentPlanRequest, ProblemGeneratorRequest, GapDetectionRequest, ProblemDetailRequest, DatasetBenchmarkFinderRequest, CitationRecommendationRequest, CitationDiscoveryRequest, UploadPaperResponse, SummarizeResponse
from app.services.cache import get_doc, get_current_doc_id, has_doc, set_active_doc, store_doc
from app.services.chunking import chunk_text_semantic
from app.services.llm import analyze_paper, build_analysis_prompt, stream_completion, stream_answer, summarize_chunks
from app.services.parsing import extract_docx_pages, extract_pdf_pages, ParsingLimitError
from app.services.retrieval import build_vector_store
from app.services.citation_intelligence import run_citation_intelligence, discover_citations_by_topic

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


_TITLE_BLOCKLIST = {
    "abstract",
    "introduction",
    "keywords",
    "index terms",
    "authors",
    "author",
    "references",
    "acknowledgements",
    "table of contents",
}

_NON_TITLE_HINTS = (
    "department",
    "university",
    "school of",
    "faculty of",
    "institute",
    "college",
    "jaipur",
    "india",
    "corresponding author",
    "affiliation",
)


def _filename_to_title(filename: Optional[str]) -> Optional[str]:

    if not filename:
        return None

    stem = os.path.splitext(os.path.basename(filename))[0]
    cleaned = re.sub(r"[_\-.]+", " ", stem).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned or None


def _detect_paper_title(pages: list[dict]) -> Optional[str]:

    if not pages:
        return None

    sample_pages = pages[:2]
    candidates: list[tuple[float, str]] = []

    for page in sample_pages:
        text = page.get("text", "")
        if not text:
            continue

        for line_idx, raw_line in enumerate(text.splitlines()[:30]):
            line = re.sub(r"\s+", " ", raw_line).strip()
            if not line:
                continue

            lower_line = line.lower().strip(":")
            if lower_line in _TITLE_BLOCKLIST:
                continue

            if any(hint in lower_line for hint in _NON_TITLE_HINTS):
                continue

            # Affiliation markers like "1 Department of ..."
            if re.match(r"^\d+\s+(department|school|faculty|institute|college)\b", lower_line):
                continue

            if (
                len(line) < 12
                or len(line) > 180
                or line.endswith(":")
                or "http" in lower_line
                or "doi" in lower_line
                or "@" in line
                or line.count(",") >= 3
            ):
                continue

            words = line.split()
            if len(words) < 3 or len(words) > 24:
                continue

            alpha_words = [w for w in words if any(c.isalpha() for c in w)]
            if not alpha_words:
                continue

            title_case_words = [w for w in alpha_words if w[0].isupper()]
            title_case_ratio = len(title_case_words) / len(alpha_words)

            if title_case_ratio < 0.45:
                continue

            # Prefer lines appearing early and with reasonable title length.
            position_bonus = max(0.0, (32 - line_idx) / 32)
            length_score = min(len(line), 120) / 120
            score = (title_case_ratio * 0.65) + (position_bonus * 0.2) + (length_score * 0.15)
            candidates.append((score, line))

    if not candidates:
        return None

    return max(candidates, key=lambda item: item[0])[1]


def _sanitize_detected_title(title: Optional[str]) -> Optional[str]:

    if not title:
        return None

    normalized = re.sub(r"\s+", " ", title).strip()
    lowered = normalized.lower()

    if len(normalized) < 10:
        return None

    if any(hint in lowered for hint in _NON_TITLE_HINTS):
        return None

    if re.match(r"^\d+\s+(department|school|faculty|institute|college)\b", lowered):
        return None

    if normalized.count(",") >= 3:
        return None

    return normalized


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
            cached_page_count = cached.get("page_count")
            if cached_page_count is None:
                cached_pages = {
                    chunk.get("page") for chunk in cached.get("chunks", []) if chunk.get("page") is not None
                }
                cached_page_count = len(cached_pages) if cached_pages else None

            return {
                "result": cached["analysis"],
                "doc_id": doc_id,
                "page_count": cached_page_count,
                "detected_title": _sanitize_detected_title(cached.get("detected_title")),
                "fallback_title": _filename_to_title(cached.get("filename")),
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

        page_count = len(pages)
        detected_title = _sanitize_detected_title(_detect_paper_title(pages))

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
            "filename": file.filename,
            "page_count": page_count,
            "detected_title": detected_title,
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

        return {
            "result": result,
            "doc_id": doc_id,
            "page_count": page_count,
            "detected_title": detected_title,
            "fallback_title": _filename_to_title(file.filename),
        }

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

    # ------------------------------------------------------------------
    # New path: pgvector RAG when paper_id is provided
    # ------------------------------------------------------------------
    if payload.paper_id:
        try:
            from app.services.llm import answer_question_with_pgvector
            answer = answer_question_with_pgvector(
                payload.question,
                payload.paper_id,
                payload.history,
            )
            return {"answer": answer}
        except Exception as exc:
            return JSONResponse({"error": str(exc)}, status_code=500)

    # ------------------------------------------------------------------
    # Legacy path: in-memory FAISS/BM25 (used with /analyze flow)
    # ------------------------------------------------------------------
    if payload.doc_id:
        if not set_active_doc(payload.doc_id):
            return JSONResponse({"error": "Document not found. Please re-upload."}, status_code=400)
    elif get_current_doc_id() is None:
        return JSONResponse({"error": "No document loaded. Please upload first."}, status_code=400)

    try:
        from app.services.llm import answer_question

        answer = answer_question(payload.question, payload.history)

        return {"answer": answer}
    except Exception:
        return {
            "answer": "I ran into a temporary issue while generating that response. Please try once more.",
        }


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
        for token in stream_answer(payload.question, payload.history):
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


@router.post("/citation-intelligence/stream")
async def citation_intelligence_stream(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Streaming SSE version of citation intelligence.
    Yields newline-delimited JSON progress events:
      {"type":"start",  "total": N, "extracted": N}
      {"type":"progress","current": i, "total": N, "matched": bool, "title": str|null, "reference_text": str}
      {"type":"done",   ...full CitationReport...}
      {"type":"error",  "message": str}
    """
    import json as _json

    if not file.filename:
        async def _err():
            yield 'data: {"type":"error","message":"No file selected"}\n\n'
        return StreamingResponse(_err(), media_type="text/event-stream")

    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in [".pdf", ".docx"]:
        async def _err():
            yield 'data: {"type":"error","message":"Only PDF or DOCX files allowed"}\n\n'
        return StreamingResponse(_err(), media_type="text/event-stream")

    file.file.seek(0, os.SEEK_END)
    size_bytes = file.file.tell()
    file.file.seek(0)

    if settings.MAX_UPLOAD_MB > 0 and size_bytes > settings.MAX_UPLOAD_MB * 1024 * 1024:
        async def _err():
            yield f'data: {{"type":"error","message":"File too large. Max {settings.MAX_UPLOAD_MB} MB."}}\n\n'
        return StreamingResponse(_err(), media_type="text/event-stream")

    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    path = os.path.join(settings.UPLOAD_FOLDER, file.filename)

    with open(path, "wb") as handle:
        shutil.copyfileobj(file.file, handle)

    if ext == ".pdf":
        pages = extract_pdf_pages(path, max_pages=settings.MAX_PAGES, max_total_chars=settings.MAX_TOTAL_CHARS)
    else:
        pages = extract_docx_pages(path, max_pages=settings.MAX_PAGES, max_total_chars=settings.MAX_TOTAL_CHARS)

    try:
        os.remove(path)
    except OSError:
        pass

    if not pages:
        async def _err():
            yield 'data: {"type":"error","message":"Could not extract text from file"}\n\n'
        return StreamingResponse(_err(), media_type="text/event-stream")

    if not settings.SEMANTIC_SCHOLAR_API_KEY:
        async def _err():
            yield 'data: {"type":"error","message":"Semantic Scholar API key not configured"}\n\n'
        return StreamingResponse(_err(), media_type="text/event-stream")

    # Pre-extract reference list for total count
    from app.services.citation_intelligence import (
        _extract_references_block,
        _split_reference_entries,
        SemanticScholarClient,
        _extract_doi,
        _build_search_query,
        _build_title_only_query,
    )
    import time as _time

    full_text = "\n".join(p.get("text", "") for p in pages if p.get("text"))
    references_block = _extract_references_block(full_text)
    extracted = _split_reference_entries(references_block)
    max_refs = settings.CITATION_MAX_REFERENCES
    limited = extracted[:max_refs] if max_refs > 0 else extracted
    total = len(limited)
    total_extracted = len(extracted)

    def _stream():
        # Start event
        yield f'data: {_json.dumps({"type":"start","total":total,"extracted":total_extracted})}\n\n'

        results = []
        matched_count = 0
        client = SemanticScholarClient(settings.SEMANTIC_SCHOLAR_API_KEY, min_interval_seconds=1.0)

        try:
            for index, ref_text in enumerate(limited, start=1):
                try:
                    paper = client.search_paper(ref_text)
                except RuntimeError as exc:
                    yield f'data: {_json.dumps({"type":"error","message":str(exc)})}\n\n'
                    return
                except Exception:
                    paper = None

                matched = paper is not None
                if matched:
                    matched_count += 1
                    authors = [a.get("name", "") for a in (paper.get("authors") or []) if a.get("name")]
                    results.append({
                        "reference_index": index, "reference_text": ref_text, "matched": True,
                        "paper_id": paper.get("paperId"), "title": paper.get("title"),
                        "year": paper.get("year"), "citation_count": paper.get("citationCount") or 0,
                        "url": paper.get("url"), "venue": paper.get("venue"), "authors": authors,
                    })
                    title = paper.get("title")
                else:
                    results.append({
                        "reference_index": index, "reference_text": ref_text, "matched": False,
                        "paper_id": None, "title": None, "year": None,
                        "citation_count": 0, "url": None, "venue": None, "authors": [],
                    })
                    title = None

                # Progress event
                yield f'data: {_json.dumps({"type":"progress","current":index,"total":total,"matched":matched,"title":title,"reference_text":ref_text[:80]})}\n\n'

        finally:
            client.close()

        matched_refs = [e for e in results if e["matched"]]
        top_cited = sorted(matched_refs, key=lambda e: e.get("citation_count", 0), reverse=True)

        report = {
            "type": "done",
            "total_references_extracted": total_extracted,
            "references_processed": total,
            "matched_count": matched_count,
            "missing_count": total - matched_count,
            "references": results,
            "top_cited": top_cited,
        }
        yield f'data: {_json.dumps(report)}\n\n'

        # Log to DB
        try:
            db_doc_check = db.query(Document).filter(Document.id == "citation-stream").first()
            db_activity = Activity(
                user_id=user_id, action_type="citation_intelligence",
                metadata_json={"filename": file.filename, "references_processed": total, "matched_count": matched_count},
            )
            db.add(db_activity)
            db.commit()
        except Exception:
            pass

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
            recommendation_mode=(payload.recommendation_mode or "upload"),
            project_title=(payload.project_title or "").strip(),
            basic_details=(payload.basic_details or "").strip(),
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


@router.post("/citation-intelligence/discover")
async def citation_intelligence_discover(
    payload: CitationDiscoveryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        project_title = (payload.project_title or "").strip()
        basic_details = (payload.basic_details or "").strip()
        limit = payload.limit or 35
        topic_preset = (payload.topic_preset or "").strip().lower() or None

        if not project_title:
            return JSONResponse({"error": "Project title is required."}, status_code=400)

        if not settings.SEMANTIC_SCHOLAR_API_KEY:
            return JSONResponse(
                {"error": "Semantic Scholar API key is not configured on the server."},
                status_code=500,
            )

        report = discover_citations_by_topic(
            semantic_scholar_api_key=settings.SEMANTIC_SCHOLAR_API_KEY,
            project_title=project_title,
            basic_details=basic_details,
            limit=limit,
            topic_preset=topic_preset,
        )

        db_activity = Activity(
            user_id=user_id,
            action_type="citation_discovery",
            metadata_json={
                "project_title": project_title,
                "references_processed": report.get("references_processed", 0),
            },
        )
        db.add(db_activity)
        db.commit()

        return JSONResponse(report)
    except ValueError as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


# ===========================================================================
# NEW ENDPOINTS: pgvector-based pipeline
# ===========================================================================

@router.post("/upload-paper", response_model=UploadPaperResponse)
async def upload_paper(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF → extract pages (PyMuPDF generator) → token-based chunking
    → generate embeddings → store in Supabase pgvector.
    Deduplicates: skips processing if paper_id already indexed.
    Returns: {paper_id, page_count, chunk_count, status}
    """
    try:
        if not file.filename:
            return JSONResponse({"error": "No file selected"}, status_code=400)

        ext = os.path.splitext(file.filename.lower())[1]
        if ext not in [".pdf", ".docx"]:
            return JSONResponse({"error": "Only PDF or DOCX files allowed"}, status_code=400)

        # Check file size
        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)

        if settings.MAX_UPLOAD_MB > 0 and size_bytes > settings.MAX_UPLOAD_MB * 1024 * 1024:
            return JSONResponse(
                {"error": f"File too large. Max allowed is {settings.MAX_UPLOAD_MB} MB."},
                status_code=413,
            )

        # Generate paper_id from filename + size (deterministic, for dedup)
        paper_id = hashlib.sha256(
            f"{file.filename}:{size_bytes}:{user_id}".encode("utf-8")
        ).hexdigest()[:16]

        # Check if already indexed in pgvector (avoid re-processing)
        from app.services.embedding import paper_already_indexed
        if paper_already_indexed(paper_id):
            # Count existing chunks
            from app.services.embedding import fetch_all_chunks_from_pgvector
            existing = fetch_all_chunks_from_pgvector(paper_id)
            return UploadPaperResponse(
                paper_id=paper_id,
                page_count=0,
                chunk_count=len(existing),
                status="already_indexed",
                message="Paper was already indexed. Use paper_id for summarize/ask.",
            )

        # Save file temporarily
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        path = os.path.join(settings.UPLOAD_FOLDER, f"{paper_id}{ext}")

        with open(path, "wb") as handle:
            shutil.copyfileobj(file.file, handle)

        # Extract pages using generator (memory-efficient)
        from app.services.parsing import extract_pdf_pages_generator, extract_docx_pages
        from app.services.parsing import ParsingLimitError as ParseError

        try:
            if ext == ".pdf":
                pages = list(extract_pdf_pages_generator(
                    path,
                    max_pages=settings.MAX_PAGES,
                    max_total_chars=settings.MAX_TOTAL_CHARS,
                ))
            else:
                pages = extract_docx_pages(
                    path,
                    max_pages=settings.MAX_PAGES,
                    max_total_chars=settings.MAX_TOTAL_CHARS,
                )
        finally:
            try:
                os.remove(path)
            except OSError:
                pass

        if not pages:
            return JSONResponse({"error": "Could not extract text from file"}, status_code=400)

        page_count = max(p["page"] for p in pages) if pages else 0

        # Token-based chunking (500-800 tokens per chunk)
        from app.services.chunking import chunk_text_by_tokens
        chunks = chunk_text_by_tokens(pages)

        if settings.MAX_CHUNKS > 0 and len(chunks) > settings.MAX_CHUNKS:
            chunks = chunks[:settings.MAX_CHUNKS]

        # Generate embeddings
        from app.services.embedding import embed_texts, store_chunks_in_pgvector
        texts = [c["text"] for c in chunks]
        embeddings = embed_texts(texts)

        # Store in Supabase pgvector
        inserted = store_chunks_in_pgvector(paper_id, user_id, chunks, embeddings)

        # Log to DB
        db_doc = db.query(Document).filter(Document.id == paper_id).first()
        if not db_doc:
            db_doc = Document(
                id=paper_id,
                user_id=user_id,
                filename=file.filename,
                title=file.filename,
                status="Indexed",
            )
            db.add(db_doc)
        db_activity = Activity(
            user_id=user_id,
            action_type="upload_paper",
            metadata_json={
                "filename": file.filename,
                "page_count": page_count,
                "chunk_count": len(chunks),
            },
        )
        db.add(db_activity)
        db.commit()

        return UploadPaperResponse(
            paper_id=paper_id,
            page_count=page_count,
            chunk_count=inserted or len(chunks),
            status="indexed",
            message="Paper uploaded and indexed successfully.",
        )

    except ParsingLimitError as exc:
        return _lengthy_response(exc.detail)
    except MemoryError:
        return _lengthy_response("Paper is too lengthy for this deployment.")
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


@router.get("/summarize/{paper_id}")
async def summarize_paper(
    paper_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Runs map-reduce summarization on chunks stored in pgvector for paper_id.
    Caches the result in memory — subsequent calls return instantly.
    Returns: {paper_id, summary, chunk_count}
    """
    try:
        # Check summary cache
        from app.services.cache import get_cached_summary, set_cached_summary
        cached = get_cached_summary(paper_id)
        if cached:
            return SummarizeResponse(
                paper_id=paper_id,
                summary=cached,
                chunk_count=0,  # Count unknown from cache
            )

        # Fetch chunks from pgvector
        from app.services.embedding import fetch_all_chunks_from_pgvector
        chunks = fetch_all_chunks_from_pgvector(paper_id)

        if not chunks:
            return JSONResponse(
                {"error": "No chunks found for this paper_id. Upload the paper first via /upload-paper."},
                status_code=404,
            )

        # Run map-reduce summarization
        from app.services.summarization import run_map_reduce_summarization
        summary = run_map_reduce_summarization(chunks, paper_hint=paper_id)

        # Cache for future requests
        set_cached_summary(paper_id, summary)

        return SummarizeResponse(
            paper_id=paper_id,
            summary=summary,
            chunk_count=len(chunks),
        )

    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
