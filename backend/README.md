# PaperLens AI Backend

FastAPI backend for document analysis, grounded Q&A, experiment planning, problem generation, gap detection, and citation intelligence.

## Stack Updates & Architecture

- **FastAPI + Uvicorn** — Core framework and server.
- **SQLAlchemy + PostgreSQL** — Main application database (users, documents, activity).
- **Supabase pgvector** — Remote vector database used for memory-efficient RAG on large PDFs.
- **PyMuPDF (fitz)** — High-performance, memory-efficient PDF text extraction (replaced `pdfplumber`).
- **Groq LLaMA 3 (8B)** — Ultra-fast LLM inference engine.
- **Semantic Scholar API** — Multi-strategy citation intelligence matching.
- **Clerk** — JWT authentication handling.

## Directory Layout

```text
backend/
├─ app/
│  ├─ api/          # Route definitions
│  ├─ core/         # Config, DB connections, Security
│  ├─ models/       # Pydantic schemas, SQLAlchemy models
│  └─ services/     # Parsing, Chunking, Retrieval, LLM logic
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

## Processing Pipelines

**1. Standard / Legacy Pipeline (FAISS/BM25):**
Used by `POST /api/analyze` and planners. 
Extracts text → chunks → builds in-memory FAISS/BM25 indexes → runs Groq LLM analysis. *(Note: FAISS/Torch is lazy-loaded to save RAM).*

**2. Modern Memory-Efficient RAG Pipeline (pgvector):**
Used by `POST /api/upload-paper`.
Generator-based PDF parsing (`PyMuPDF`) → lazy-loaded embeddings (`sentence-transformers`) → stored remotely in Supabase `paper_chunks`. Saves local RAM and allows persistence across restarts.

## Deployment constraints (Render 500MB)

This architecture is optimized for 500MB RAM limits:
- `PyMuPDF` is used instead of `pdfplumber` to prevent parsing OOMs.
- `torch` and `sentence-transformers` models are explicitly **lazy-loaded** (meaning they consume ~350MB only when `/upload-paper` is called, leaving the rest of the application idle at ~150MB).
- `ENABLE_VECTOR_RETRIEVAL` defaults to `false` for legacy FAISS endpoints to save memory.
