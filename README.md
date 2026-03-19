# PaperLens AI

PaperLens AI is a full-stack research assistant that helps users analyze papers, ask grounded questions, detect research gaps, and generate experiments/problem statements.

## What it includes

- **Frontend**: React + TypeScript dashboard (`frontend/`)
- **Backend**: FastAPI + Hybrid RAG pipeline (`backend/`)
- **Auth**: Clerk JWT-based API authentication
- **Data layer**: SQLAlchemy models on PostgreSQL (Supabase-compatible)
- **LLM**: Groq for analysis and generation features

## Repository structure

```text
paper_explainer/
├─ backend/
├─ frontend/
├─ docs/
├─ render.yaml
├─ vercel.json
└─ README.md
```

## Core features

1. **Paper Analyzer** (`/dashboard/analyzer`)
  - Upload PDF/DOCX
  - Generate structured analysis
  - Ask follow-up questions grounded in extracted chunks

2. **Experiment Planner** (`/dashboard/planner`)
  - Generate step-by-step experiment plans from a topic + difficulty

3. **Problem Generator** (`/dashboard/generator`)
  - Generate research problem statements from domain + subdomain + complexity

4. **Gap Detection** (`/dashboard/gaps`)
  - Detect gaps from either text input or uploaded paper

5. **Dashboard Metrics** (`/dashboard`)
  - Displays user-level activity and recent analyzed documents

## Tech stack

### Frontend
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Clerk React SDK

### Backend
- FastAPI + Uvicorn
- SQLAlchemy + PostgreSQL
- sentence-transformers + FAISS + BM25
- Groq API
- pdfplumber + python-docx

## Quick start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Clerk account
- PostgreSQL database URL (Supabase recommended)
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

Create/update `frontend/.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Run frontend:

```powershell
npm run dev
```

## API summary

Public:
- `GET /health`

Protected:
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

Full contracts are documented in `docs/API_REFERENCE.md`.

## Deployment

- **Backend**: Render Blueprint via `render.yaml`
- **Frontend**: Vercel + SPA rewrite via `vercel.json`

## Documentation index

- Project analysis: `docs/PROJECT_ANALYSIS.md`
- API reference: `docs/API_REFERENCE.md`
- Backend guide: `backend/README.md`
- Frontend guide: `frontend/README.md`

## License

MIT License. See `LICENSE`.
