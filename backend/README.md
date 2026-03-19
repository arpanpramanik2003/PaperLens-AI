# PaperLens AI Backend

FastAPI backend for document analysis, grounded Q&A, experiment planning, problem generation, and gap detection.

## Stack

- FastAPI + Uvicorn
- SQLAlchemy + PostgreSQL (Supabase)
- Clerk JWT authentication
- Groq LLM API
- sentence-transformers + FAISS + BM25
- pdfplumber + python-docx

## Directory Layout

```text
backend/
├─ app/
│  ├─ api/
│  ├─ core/
│  ├─ models/
│  └─ services/
├─ requirements.txt
├─ uploads/
└─ README.md
```

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` manually with at least:

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
GROQ_API_KEY=gsk_...
```

## Run

```powershell
cd backend
uvicorn app.main:app --reload
```

Default URL: `http://localhost:8000`

## Authentication

- Most `/api/*` routes require `Authorization: Bearer <Clerk JWT>`.
- Token verification uses Clerk JWKS (`app/core/security.py`).
- Public endpoint: `GET /health`.

## API Endpoints

### Public

- `GET /health`

### Protected

- `GET /api/test-auth`
- `GET /api/dashboard`
- `GET /api/documents`
- `POST /api/analyze`
- `POST /api/analyze_stream`
- `POST /api/ask`
- `POST /api/ask_stream`
- `POST /api/plan-experiment`
- `POST /api/generate-problems`
- `POST /api/detect-gaps`

For full request/response contracts, see `../docs/API_REFERENCE.md`.

## Environment Variables

Configured in `app/core/config.py`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | none | PostgreSQL/Supabase connection string |
| `CLERK_SECRET_KEY` | Yes | none | Clerk key used to fetch JWKS |
| `GROQ_API_KEY` | Yes | none | Groq API auth |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | LLM model name |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | Embedding model |
| `RERANKER_MODEL` | No | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Cross-encoder reranker |
| `UPLOAD_FOLDER` | No | `uploads` | Temporary upload directory |
| `CHUNK_SIZE` | No | `1200` | Chunk size (chars) |
| `CHUNK_OVERLAP` | No | `220` | Chunk overlap (chars) |
| `TOP_K` | No | `5` | Retrieved chunk count |
| `MAX_UPLOAD_MB` | No | `12` | Max upload size |
| `MAX_PAGES` | No | `12` | Max extracted pages |
| `MAX_TOTAL_CHARS` | No | `120000` | Max extracted chars |
| `MAX_CHUNKS` | No | `220` | Max chunks processed |
| `EMBEDDING_BATCH_SIZE` | No | `16` | Embedding batch size |
| `ENABLE_VECTOR_RETRIEVAL` | No | `false` | Enable FAISS + embedding retrieval path |
| `ENABLE_RERANKER` | No | `false` | Enable CrossEncoder reranking |
| `MAX_CACHED_DOCS` | No | `1` | In-memory cached docs |

## Processing Pipeline

1. Validate uploaded PDF/DOCX and enforce limits.
2. Extract text (`pdfplumber` / `python-docx`).
3. Sentence-aware chunking with overlap.
4. Build sparse BM25 index, plus dense FAISS index when `ENABLE_VECTOR_RETRIEVAL=true`.
5. Generate structured analysis via Groq.
6. Cache analysis + indexes in memory.
7. Answer follow-up questions via hybrid retrieval.

## Deployment (Render)

Root-level `render.yaml` deploys this backend with:

- build: `pip install -r requirements.txt`
- start: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
- env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `GROQ_API_KEY`

## Notes & Limitations

- In-memory cache is not persistent across restarts.
- No OCR pipeline for image-only PDFs.
- CORS is permissive by default; tighten for production.
- Model loading can cause first-request latency.