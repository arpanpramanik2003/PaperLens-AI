# PaperLens AI — Project Analysis

_Last updated: 2026-03-19_

## 1) Executive Summary

PaperLens AI is a full-stack research-assistant platform with:

- A **FastAPI backend** for document analysis, retrieval-based Q&A, gap detection, experiment planning, and idea generation.
- A **React + TypeScript frontend** with Clerk authentication and dashboard-style workflows.
- A **hybrid retrieval pipeline** (FAISS + BM25, optional reranker) for grounded QA over uploaded papers.

The architecture is coherent and production-intent, but current docs were partially outdated and inconsistent with implemented behavior.

## 2) Verified Architecture

## Backend (`backend/app`)

- **Entry point**: `app/main.py`
- **Router**: `app/api/routes.py` mounted at `/api`
- **Auth**: Clerk JWT verification via JWKS (`app/core/security.py`)
- **Database**: SQLAlchemy models (`documents`, `activities`) using `DATABASE_URL` (`app/core/database.py`, `app/models/domain.py`)
- **LLM provider**: Groq (`app/services/llm.py`)
- **Parsing**: `pdfplumber` and `python-docx`
- **Retrieval**: FAISS dense search + BM25 sparse search + optional CrossEncoder reranking
- **Cache**: in-memory per-document payload with configurable max docs (`MAX_CACHED_DOCS`)

## Frontend (`frontend/src`)

- **Stack**: React + Vite + TypeScript + Tailwind + shadcn/ui + framer-motion
- **Auth**: Clerk React SDK (`ClerkProvider`, `SignIn`, `SignUp`, auth token usage in API client)
- **Routing**: React Router dashboard routes for analyzer/planner/generator/gaps/settings
- **Networking**: `apiClient.fetch()` injects Bearer token and uses `VITE_API_URL` fallback to `http://localhost:8000`

## 3) Feature-to-Endpoint Mapping

- Dashboard: `GET /api/dashboard`
- Paper Analyzer upload: `POST /api/analyze`
- Paper Q&A: `POST /api/ask`
- Experiment Planner: `POST /api/plan-experiment`
- Problem Generator: `POST /api/generate-problems`
- Gap Detection: `POST /api/detect-gaps`

Streaming endpoints exist in backend (`/api/analyze_stream`, `/api/ask_stream`) but the current frontend code path uses non-streaming variants.

## 4) Key Configuration Surface

### Required backend env vars

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `GROQ_API_KEY`

### Common optional backend env vars

- `GROQ_MODEL`, `EMBEDDING_MODEL`, `RERANKER_MODEL`
- `TOP_K`, `CHUNK_SIZE`, `CHUNK_OVERLAP`
- `MAX_UPLOAD_MB`, `MAX_PAGES`, `MAX_TOTAL_CHARS`, `MAX_CHUNKS`
- `ENABLE_RERANKER`, `MAX_CACHED_DOCS`

### Required frontend env vars

- `VITE_CLERK_PUBLISHABLE_KEY`

### Recommended frontend env var

- `VITE_API_URL`

## 5) Strengths

- Clear modular separation (`api/core/models/services` on backend).
- Strong baseline RAG approach for grounded QA.
- Authentication integrated at API layer with Bearer token verification.
- Activity tracking in DB supports dashboard analytics.
- Deployment manifests for Render (`render.yaml`) and Vercel (`vercel.json`).

## 6) Risks and Gaps

1. **In-memory cache only**: cache is not persistent across restarts.
2. **No OCR path**: image-only PDFs will not be parsed.
3. **Open CORS policy** in backend defaults (`allow_origins=["*"]`).
4. **No implemented automated tests** despite test tooling configs.
5. **Potential doc-id collision edge case** because hash uses filename + size, not content bytes.
6. **Dashboard route protection** is mostly backend-enforced; frontend route guard exists as component but not applied globally to routes.

## 7) Documentation Fixes Applied in This Update

- Root README rewritten to match real architecture and commands.
- Frontend README expanded from placeholder to full setup/flow doc.
- Backend README corrected and expanded (auth/database/API coverage).
- New API reference added under `docs/API_REFERENCE.md`.

## 8) Recommended Next Improvements

- Add a `.env.example` in both `backend/` and `frontend/`.
- Add at least smoke tests for auth + key API flows.
- Use stricter CORS origin settings for non-local environments.
- Consider persistent vector/document store for multi-document sessions.
- Align frontend to streaming endpoints for better UX on long responses.
