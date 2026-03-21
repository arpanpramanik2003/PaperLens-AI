# PaperLens AI — Primary Project Analysis

Last updated: 2026-03-21
Owner: Engineering Documentation
Scope: End-to-end product, architecture, API alignment, risk profile, and prioritized roadmap

---

## 1) Executive Snapshot

PaperLens AI is a full-stack AI research assistant with a clear product-core architecture:

- FastAPI backend with Clerk-authenticated API routes
- React + TypeScript frontend with dashboard workflows
- AI pipeline for paper analysis, retrieval-based Q&A, planning, ideation, gap detection, and dataset/benchmark recommendation
- SQL persistence for user activity analytics + paper metadata

Overall maturity: **Strong functional MVP moving toward production hardening**.

---

## 2) System Architecture (Verified)

### High-level flow

```
Client (React + Clerk)
	 ↓ Bearer JWT
FastAPI API Layer (/api/*)
	 ├─ Auth checks (Clerk JWKS)
	 ├─ LLM orchestration (Groq)
	 ├─ Retrieval pipeline (BM25 + optional FAISS + optional reranker)
	 ├─ Parsing/chunking (PDF/DOCX)
	 └─ DB writes (documents, activities)
				↓
PostgreSQL (Supabase-compatible connection)
```

### Backend architecture

- Entry point: `backend/app/main.py`
- Route layer: `backend/app/api/routes.py`
- Config/env surface: `backend/app/core/config.py`
- Auth/security: `backend/app/core/security.py`
- Database setup/session: `backend/app/core/database.py`
- Domain models: `backend/app/models/domain.py`
- Request schemas: `backend/app/models/schemas.py`
- Core services:
	- LLM logic: `backend/app/services/llm.py`
	- Parsing: `backend/app/services/parsing.py`
	- Chunking: `backend/app/services/chunking.py`
	- Retrieval: `backend/app/services/retrieval.py`
	- In-memory doc cache: `backend/app/services/cache.py`

### Frontend architecture

- Root app/routing: `frontend/src/App.tsx`
- Landing experience: `frontend/src/components/landing/*`
- Dashboard layout/nav: `frontend/src/components/DashboardLayout.tsx`
- Feature pages:
	- `frontend/src/pages/PaperAnalyzer.tsx`
	- `frontend/src/pages/ExperimentPlanner.tsx`
	- `frontend/src/pages/ProblemGenerator.tsx`
	- `frontend/src/pages/GapDetection.tsx`
	- `frontend/src/pages/DatasetBenchmarkFinder.tsx`
- API client/token injection: `frontend/src/lib/api-client.ts`

---

## 3) Feature Maturity Matrix

| Feature | Endpoint(s) | Frontend Integration | Persistence | Status |
|---|---|---|---|---|
| Dashboard | `GET /api/dashboard` | Yes | Reads `documents` + `activities` | Stable |
| Paper Analyzer | `POST /api/analyze` | Yes | Writes `documents` + `activities` | Stable |
| Paper Analyzer (stream) | `POST /api/analyze_stream` | Not primary path | Writes `documents` + `activities` | Available, not adopted in UI |
| Q&A | `POST /api/ask` | Yes | No extra DB write | Stable |
| Q&A (stream) | `POST /api/ask_stream` | Not primary path | No extra DB write | Available, not adopted in UI |
| Experiment Planner | `POST /api/plan-experiment` | Yes | Writes `activities` | Stable |
| Problem Generator | `POST /api/generate-problems` | Yes | Writes `activities` | Stable |
| Problem Expansion | `POST /api/expand-problem` | Yes | Writes `activities` | Stable |
| Gap Detection | `POST /api/detect-gaps` | Yes | Writes `activities` | Stable |
| Dataset & Benchmark Finder | `POST /api/find-datasets-benchmarks` | Yes | Writes `activities` | Stable |
| Documents Listing | `GET /api/documents` | Indirect/available | Reads `documents` | Stable |

---

## 4) API & Routing Alignment Notes

Current implementation is aligned across backend and frontend for all core features.

Important nuances:

- Stream endpoints exist and work, but frontend currently uses non-stream calls for analyzer and Q&A.
- `GapDetectionRequest` class exists in schemas, but `/api/detect-gaps` currently accepts multipart form (`file` or `text`) rather than this model.
- `/dashboard` route is not wrapped by `ProtectedRoute` in `App.tsx`, but backend still enforces auth at API level.

---

## 5) Data, State, and Storage Model

### Persistent (DB)

- `documents`
	- Tracks analyzed documents (`id`, `user_id`, `filename`, status, timestamps)
- `activities`
	- Tracks usage telemetry for planner/generator/gaps/finder/analyzer flows

### Ephemeral (in-memory)

- Active document content/cache used by analyzer/Q&A pipeline
- Controlled via `MAX_CACHED_DOCS` (default 1)
- Lost on backend restart/redeploy

### Practical implication

User analytics/history persist; retrieval context for ongoing chat is process-local and session-fragile.

---

## 6) Configuration Surface (Current Defaults)

### Required backend env

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `GROQ_API_KEY`

### Core backend tuning

- Model/runtime:
	- `GROQ_MODEL` (default `llama-3.1-8b-instant`)
	- `EMBEDDING_MODEL`, `RERANKER_MODEL`
- Retrieval/chunking:
	- `TOP_K=5`
	- `CHUNK_SIZE=1200`
	- `CHUNK_OVERLAP=220`
- Limits:
	- `MAX_UPLOAD_MB=12`
	- `MAX_PAGES=12`
	- `MAX_TOTAL_CHARS=120000`
	- `MAX_CHUNKS=220`
- Feature flags:
	- `ENABLE_VECTOR_RETRIEVAL=false`
	- `ENABLE_RERANKER=false`
- Cache:
	- `MAX_CACHED_DOCS=1`

### Frontend env

- Required: `VITE_CLERK_PUBLISHABLE_KEY`
- Recommended: `VITE_API_URL`

---

## 7) Strengths

1. Clear service boundaries and maintainable backend modularization.
2. Good feature completeness for an AI research-assistant MVP.
3. Strong auth posture at API boundary (Clerk JWT dependency checks).
4. DB-backed activity analytics already supports dashboard insights.
5. Multiple deployment targets and structured docs now largely aligned.
6. Landing and feature UX are now modularized and mobile-improved.

---

## 8) Risk Register (Prioritized)

| Priority | Risk | Impact | Current State | Recommendation |
|---|---|---|---|---|
| High | In-memory retrieval cache only | Context loss on restart; no multi-instance consistency | Present | Move doc state/vector index to persistent store |
| High | Open CORS (`allow_origins=["*"]`) | Unrestricted browser origin access | Present | Restrict origins by environment |
| Medium | Missing automated tests | Regression risk in fast iteration | Present | Add API smoke + critical flow integration tests |
| Medium | Frontend not using stream endpoints | Slower perceived UX for long outputs | Present | Migrate analyzer/Q&A UI to stream paths |
| Medium | Doc ID generated from filename+size | Collision possibility in edge cases | Present | Include file hash bytes or UUID fallback |
| Medium | No OCR path for scanned/image PDFs | Parse failure on common paper formats | Present | Add OCR fallback (Tesseract/PDF OCR pipeline) |
| Low | `ProtectedRoute` imported but not used on `/dashboard` | UX-level route exposure (API still protected) | Present | Wrap dashboard route with guard for cleaner client behavior |

---

## 9) Documentation Health

### Updated and aligned

- `README.md` (root)
- `backend/README.md`
- `frontend/README.md`
- `docs/API_REFERENCE.md`
- `docs/1_PAPER_ANALYZER.md`
- `docs/2_EXPERIMENT_PLANNER.md`
- `docs/3_PROBLEM_GENERATOR.md`
- `docs/4_GAP_DETECTION.md`
- `docs/5_DATASET_BENCHMARK_FINDER.md`

### Suggested governance rule

Whenever an endpoint is added/changed:
1. Update `docs/API_REFERENCE.md`
2. Update corresponding workflow doc
3. Add one-line entry in an API change log section

---

## 10) 30-60-90 Day Engineering Plan

### Day 0-30 (stability + safety)

- Add `.env.example` for backend and frontend
- Lock down CORS by environment
- Add API smoke tests: health, auth, analyze, ask, planner, finder
- Add basic error-observability (structured logs + request IDs)

### Day 31-60 (scalability + UX)

- Adopt stream endpoints in frontend analyzer/Q&A
- Introduce persistent document session/cache layer
- Add document-level concurrency and retry guards
- Normalize all API error response envelopes

### Day 61-90 (production hardening)

- OCR fallback for scanned PDFs
- Role/plan-based guardrails (rate limits, quotas)
- Data retention policy + cleanup jobs
- Benchmarking and load tests for heavy analysis paths

---

## 11) Success Metrics to Track

- Analysis completion success rate
- Avg analyze latency (P50/P95)
- Avg Q&A latency (P50/P95)
- Stream adoption rate (once enabled in UI)
- Failed upload causes (size/pages/chars/parse)
- Feature usage split across planner/generator/gaps/finder
- Return usage (weekly active users, repeat analyses)

---

## 12) Final Assessment

PaperLens AI has crossed the “prototype” threshold and now behaves like a serious product-ready MVP. The core value loop is complete, endpoint coverage is broad, and docs are now substantially aligned. The next phase should focus on **runtime resilience, test coverage, and persistent state** to support reliable scale.
