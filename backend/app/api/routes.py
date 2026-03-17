import hashlib
import os
import shutil

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from app.core.config import settings
from app.models.schemas import AskRequest
from app.services.cache import get_doc, get_current_doc_id, has_doc, set_active_doc, store_doc
from app.services.chunking import chunk_text_semantic
from app.services.llm import analyze_paper, build_analysis_prompt, stream_completion, stream_answer, summarize_chunks
from app.services.parsing import extract_docx_pages, extract_pdf_pages
from app.services.retrieval import build_vector_store

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
async def analyze(file: UploadFile = File(...)):

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
            pages = extract_pdf_pages(path)
        else:
            pages = extract_docx_pages(path)

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

        try:
            os.remove(path)
        except OSError:
            pass

        return {"result": result, "doc_id": doc_id}

    except PaperTooLengthyError as exc:

        return _lengthy_response(exc.detail)

    except MemoryError:

        return _lengthy_response("Paper is too lengthy for this deployment. Please upload a shorter paper.")

    except Exception as exc:

        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/analyze_stream")
async def analyze_stream(file: UploadFile = File(...)):

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
            pages = extract_pdf_pages(path)
        else:
            pages = extract_docx_pages(path)

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

            try:
                os.remove(path)
            except OSError:
                pass

        return StreamingResponse(stream_response(), media_type="text/plain")

    except PaperTooLengthyError as exc:

        return _lengthy_response(exc.detail)

    except MemoryError:

        return _lengthy_response("Paper is too lengthy for this deployment. Please upload a shorter paper.")

    except Exception as exc:

        return JSONResponse({"error": str(exc)}, status_code=500)


@router.post("/ask")
async def ask(payload: AskRequest):

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
async def ask_stream(payload: AskRequest):

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
