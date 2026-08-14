# 🌍 Production Deployment & DevOps Guide

This document provides step-by-step instructions for deploying **PaperLens AI** in a production environment, including hosting configurations for **Render** (Backend), **Vercel** (Frontend), and **Supabase** (Database + Vector Store).

---

## 1. Hosting Architecture Overview

```
PaperLens AI Production Topology
├── Frontend SPA (React + TypeScript) ──> Deployed on Vercel
├── Backend API Gateway (FastAPI)     ──> Deployed on Render (Web Service)
├── Relational DB + pgvector          ──> Hosted on Supabase (PostgreSQL 15+)
└── LLM & Academic APIs               ──> Groq Cloud, Semantic Scholar, Crossref
```

---

## 2. Environment Variables Reference

### A. Backend Environment Variables (`backend/.env`)

| Variable Name | Type | Description & Example Value | Required? |
|---|---|---|---|
| `DATABASE_URL` | `string` | PostgreSQL connection string (`postgresql://postgres:pass@db.supabase.co:5432/postgres`). Defined in [`config.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/config.py). | **Yes** |
| `SUPABASE_URL` | `string` | Supabase project URL (`https://xyz.supabase.co`). | **Yes** |
| `SUPABASE_KEY` | `string` | Supabase service role or anon API key. | **Yes** |
| `CLERK_SECRET_KEY` | `string` | Clerk Backend Secret Key (`sk_test_...`) for RSA-256 JWKS verification in [`security.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/security.py). | **Yes** |
| `GROQ_API_KEY` | `string` | Groq Cloud API key (`gsk_...`) for LLM inference execution. | **Yes** |
| `SEMANTIC_SCHOLAR_API_KEY` | `string` | Semantic Scholar Graph API key for reference matching. | Optional |
| `ENABLE_VECTOR_RETRIEVAL` | `boolean` | Flag (`true`/`false`). Set to `false` on Render 500MB tier to lazy-load SentenceTransformers and prevent idle memory spikes. | Recommended |
| `MAX_UPLOAD_SIZE_MB` | `int` | Maximum file upload size limit (Default: `15`). | Optional |

### B. Frontend Environment Variables (`frontend/.env.local`)

| Variable Name | Type | Description & Example Value | Required? |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `string` | Clerk Publishable Key (`pk_test_...`) used by `@clerk/clerk-react`. | **Yes** |
| `VITE_API_URL` | `string` | FastAPI backend URL (`https://paperlens-backend.onrender.com` or `http://localhost:8000`). | **Yes** |

---

## 3. Step-by-Step Production Deployment

### Step 1: Database Setup (Supabase)
1. Log in to [Supabase](https://supabase.com) and create a new PostgreSQL project.
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Copy and execute the contents of [`backend/supabase_migration.sql`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/supabase_migration.sql):
   - Enables `vector` extension.
   - Creates `paper_chunks` table.
   - Creates `match_chunks` similarity search RPC function.

### Step 2: Backend Deployment (Render)
PaperLens AI is configured for deployment on Render using [`render.yaml`](file:///d:/Edutation(P)/Learning-code/paper_explainer/render.yaml):

1. Create a new **Web Service** on Render connected to your GitHub repository.
2. Configure settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt && alembic -c backend/alembic.ini upgrade head`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables in Render Dashboard (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `CLERK_SECRET_KEY`, `GROQ_API_KEY`, `ENABLE_VECTOR_RETRIEVAL=false`).

> **Memory Optimization Note for Render 500MB Tier**: Setting `ENABLE_VECTOR_RETRIEVAL=false` ensures that the heavy PyTorch embedding engine is lazy-loaded only when vector queries execute, keeping idle memory footprint below 200MB.

### Step 3: Frontend Deployment (Vercel)
The client is configured for Vercel deployment via [`vercel.json`](file:///d:/Edutation(P)/Learning-code/paper_explainer/vercel.json):

1. Connect your repository to [Vercel](https://vercel.com).
2. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL`).
4. Deploy. Vercel handles single-page app (SPA) client routing via [`vercel.json`](file:///d:/Edutation(P)/Learning-code/paper_explainer/vercel.json):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Local Development Standup

To run the complete stack locally:

```powershell
# 1. Start Backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 2. In a separate terminal, start Frontend
cd frontend
npm install
npm run dev
```
