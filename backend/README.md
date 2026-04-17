# PaperLens AI Backend

FastAPI backend for document analysis, grounded Q&A, experiment planning, problem generation, gap detection, and citation intelligence.

## Stack Updates & Architecture

- **FastAPI + Uvicorn** — Core framework and server.
- **SQLAlchemy + PostgreSQL** — Main application database (users, documents, activity).
- **Supabase pgvector** — Remote vector database used for memory-efficient RAG on large PDFs.
- **PyMuPDF (fitz)** — High-performance, memory-efficient PDF text extraction (replaced `pdfplumber`).
- **Groq + Multi-Model Routing** — Pinned lightweight model for analyzer/gap paths and heavy fallback chain for generation workflows.
- **Semantic Scholar API** — Multi-strategy citation intelligence matching.
- **Clerk** — JWT authentication handling.

## Directory Layout

```text
backend/
├─ app/
│  ├─ api/          # Route definitions
│  ├─ core/         # Config, DB connections, Security
│  ├─ models/       # Pydantic schemas, SQLAlchemy models
│  └─ services/     # Parsing, Chunking, Retrieval, modular LLM logic
├─ requirements.txt
├─ supabase_migration.sql # Setup script for pgvector table & RPC
└─ README.md
```

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` manually with:

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
GROQ_API_KEY=gsk_...
SEMANTIC_SCHOLAR_API_KEY="..."

# For pgvector RAG pipeline:
SUPABASE_URL=https://...
SUPABASE_KEY=...
```

## Run

```powershell
uvicorn app.main:app --reload
```
Default URL: `http://localhost:8000`

## API Endpoints (Core)

*See `docs/API_REFERENCE.md` for full definitions.*

- `GET /health` (Public)
- `GET /api/dashboard` (Stats/Telemetry)
- `POST /api/upload-paper` (PyMuPDF parser → pgvector storage)
- `GET /api/summarize/{paper_id}` (Map-Reduce summarization using pgvector chunks)
- `POST /api/ask` (Grounded Q&A — supports both pgvector RAG and FAISS/BM25 legacy mode)
- `POST /api/citation-intelligence/stream` (SSE endpoint yielding real-time citation matching progress)

## LLM Service Layout

- `app/services/llm_sections/analysis.py`
	- Paper analyzer prompts/formatting
	- Analyzer streaming helper
	- Analyzer summarization helper
- `app/services/llm_sections/qa.py`
	- Legacy in-memory Q&A
	- pgvector-backed Q&A helper
- `app/services/llm_sections/generation.py`
	- Experiment planner
	- Problem generation/expansion
	- Gap detection
	- Dataset & benchmark finder
	- Citation recommendation generation
- `app/services/model_fallback.py`
	- Shared fallback executor with per-attempt logging
- `app/services/llm.py`
	- Compatibility re-export layer for legacy imports

## Model Routing (Current)

- Paper Analyzer: pinned to `llama-3.1-8b-instant`
- Gap Detection: pinned to `llama-3.1-8b-instant`
- Heavy generation workflows:
	- Primary: `openai/gpt-oss-120b`
	- Fallbacks: `llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`

Terminal observability:
- On each call, backend prints `[MODEL] task=... model=...`
- On fallback, backend prints `[MODEL-FALLBACK] task=... failed_model=... reason=...`

## Processing Pipelines

**1. Standard / Legacy Pipeline (FAISS/BM25):**
Used by `POST /api/analyze` and planners. 
Extracts text → chunks → builds in-memory FAISS/BM25 indexes → runs Groq LLM analysis. *(Note: FAISS/Torch is lazy-loaded to save RAM).*

**2. Modern Memory-Efficient RAG Pipeline (pgvector):**
Used by `POST /api/upload-paper`.
Generator-based PDF parsing (`PyMuPDF`) → lazy-loaded embeddings (`sentence-transformers`) → stored remotely in Supabase `paper_chunks`. Saves local RAM and allows persistence across restarts.

## Error Handling Notes

- Invalid DOCX package (renamed/corrupt file) now returns a clean parser error:
	- HTTP 400
	- Code: `INVALID_DOCUMENT_FORMAT`
- 413 can mean two different things:
	- Upload/parsing size limits (`PAPER_TOO_LENGTHY`)
	- Provider token/TPM limits (model-side limit exceeded)
- To reduce token-limit 413 frequency:
	- Analyzer completion caps are enforced in code
	- Gap detection completion cap is enforced in code

## Troubleshooting (Copy-Paste Cases)

### 1) Invalid DOCX structure
Response example:

```json
{
	"error": "Invalid DOCX file structure. Please upload a valid .docx file (not .doc, PDF, or a renamed file).",
	"code": "INVALID_DOCUMENT_FORMAT"
}
```

Meaning:
- File extension is `.docx` but package is malformed or not true OOXML.

Action:
- Re-export file as proper `.docx` from Word/Google Docs, or upload PDF.

### 2) Parsing/upload length limit hit
Response example:

```json
{
	"error": "Paper is too lengthy ...",
	"code": "PAPER_TOO_LENGTHY"
}
```

Meaning:
- Exceeded one of: `MAX_UPLOAD_MB`, `MAX_PAGES`, `MAX_TOTAL_CHARS`, `MAX_CHUNKS`.

Action:
- Use shorter paper, reduce pages, or raise limits in `app/core/config.py`.

### 3) Provider token/TPM 413 (not file size)
Provider-style error example:

```json
{
	"error": {
		"message": "Request too large ... on tokens per minute (TPM): Limit 6000, Requested 8085 ...",
		"type": "tokens",
		"code": "rate_limit_exceeded"
	}
}
```

Meaning:
- Prompt + completion budget exceeded current model tier throughput.

Action:
- Keep token caps low for pinned lightweight routes.
- Allow heavy-route fallback chain to switch models.

### 4) Model fallback visibility
Terminal examples:

```text
[MODEL] task=experiment_planner model=openai/gpt-oss-120b
[MODEL-FALLBACK] task=experiment_planner failed_model=openai/gpt-oss-120b reason=...
```

Meaning:
- First line: selected model.
- Second line: failed attempt and fallback trigger.

## Deployment constraints (Render 500MB)

This architecture is optimized for 500MB RAM limits:
- `PyMuPDF` is used instead of `pdfplumber` to prevent parsing OOMs.
- `torch` and `sentence-transformers` models are explicitly **lazy-loaded** (meaning they consume ~350MB only when `/upload-paper` is called, leaving the rest of the application idle at ~150MB).
- `ENABLE_VECTOR_RETRIEVAL` defaults to `false` for legacy FAISS endpoints to save memory.
