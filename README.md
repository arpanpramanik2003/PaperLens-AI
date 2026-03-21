# PaperLens AI

<p align="center">
  <img src="frontend/public/demo.png" alt="PaperLens AI Landing Page" width="100%" />
</p>

<p align="center">
  <b>Understand papers faster. Generate stronger ideas. Build research with confidence.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Auth-Clerk-6C47FF" alt="Auth" />
  <img src="https://img.shields.io/badge/Data-PostgreSQL%20(Supabase)-3ECF8E" alt="Data" />
  <img src="https://img.shields.io/badge/LLM-Groq-F55036" alt="LLM" />
</p>

---

## Why PaperLens AI

PaperLens AI is a full-stack research assistant for students, researchers, and builders who need to move from raw papers to actionable output quickly.

It combines document analysis, grounded Q&A, research gap discovery, experiment planning, problem ideation, and dataset/benchmark recommendations in one workflow-driven platform.

---

## Core Capabilities

### 1) Paper Analyzer
- Upload PDF/DOCX and receive structured markdown analysis.
- Ask follow-up questions grounded in parsed paper context.
- Supports both non-streaming and streaming backend endpoints.

### 2) Experiment Planner
- Generate step-wise execution plans from topic and difficulty.
- Includes practical details, params, and risk notes.

### 3) Problem Generator
- Generate domain/subdomain-aware research problems.
- Expand a selected idea into a deeper execution brief.

### 4) Gap Detection
- Detect research gaps from uploaded files or pasted text.
- Returns severity + actionable suggestions.

### 5) Dataset & Benchmark Finder
- Recommends suitable datasets, benchmarks, and common technologies.
- Includes fit scores and practical detail objects for implementation decisions.

### 6) Dashboard Analytics
- Tracks key activity (papers analyzed, plans, ideas, gaps, etc.).
- Shows recent documents and usage summaries.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind, shadcn/ui, framer-motion |
| Backend | FastAPI, SQLAlchemy |
| Auth | Clerk JWT |
| Retrieval | BM25 + optional FAISS + optional reranker |
| Data | PostgreSQL (Supabase-compatible) |
| LLM | Groq |

---

## Project Structure

```text
paper_explainer/
├─ backend/
├─ frontend/
├─ docs/
├─ render.yaml
├─ vercel.json
└─ README.md
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Clerk account (publishable + secret keys)
- PostgreSQL connection URL
- Groq API key

### 1) Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
GROQ_API_KEY=gsk_...
```

Run backend:

```powershell
uvicorn app.main:app --reload
```

### 2) Frontend setup

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Run frontend:

```powershell
npm run dev
```

---

## API Snapshot

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
- `POST /api/expand-problem`
- `POST /api/detect-gaps`
- `POST /api/find-datasets-benchmarks`

For full contracts, examples, and validation notes, see `docs/API_REFERENCE.md`.

---

## Configuration (Important)

### Required backend env
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `GROQ_API_KEY`

### Common backend tuning
- `GROQ_MODEL`, `EMBEDDING_MODEL`, `RERANKER_MODEL`
- `TOP_K`, `CHUNK_SIZE`, `CHUNK_OVERLAP`
- `MAX_UPLOAD_MB`, `MAX_PAGES`, `MAX_TOTAL_CHARS`, `MAX_CHUNKS`
- `ENABLE_VECTOR_RETRIEVAL`, `ENABLE_RERANKER`, `MAX_CACHED_DOCS`

### Required frontend env
- `VITE_CLERK_PUBLISHABLE_KEY`

### Recommended frontend env
- `VITE_API_URL`

---

## Deploy

- Backend: Render via `render.yaml`
- Frontend: Vercel via `vercel.json`

---

## Documentation Hub

- Primary analysis: `docs/PROJECT_ANALYSIS.md`
- API reference: `docs/API_REFERENCE.md`
- Paper Analyzer workflow: `docs/1_PAPER_ANALYZER.md`
- Experiment Planner workflow: `docs/2_EXPERIMENT_PLANNER.md`
- Problem Generator workflow: `docs/3_PROBLEM_GENERATOR.md`
- Gap Detection workflow: `docs/4_GAP_DETECTION.md`
- Dataset & Benchmark Finder workflow: `docs/5_DATASET_BENCHMARK_FINDER.md`
- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`

---

## License

MIT License. See `LICENSE`.
