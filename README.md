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
  <img src="https://img.shields.io/badge/Vector_DB-pgvector%20(Supabase)-3ECF8E?logo=supabase&logoColor=white" alt="Supabase pgvector" />
  <img src="https://img.shields.io/badge/LLM-Groq-F55036" alt="LLM" />
</p>

---

## 📖 What is PaperLens AI?

**PaperLens AI** is a comprehensive full-stack research assistant designed for students, researchers, and developers. It bridges the gap between raw research papers and actionable outputs by providing an intelligent, workflow-driven platform. 

Instead of just chatting with a PDF, PaperLens AI provides structured workflows: extracting key insights from documents, planning experiments based on those insights, discovering research gaps, generating novel problem statements, finding relevant datasets, and running real-time citation intelligence.

---

## 🚀 Core Features & Workflows

### 1) 📄 RAG-Powered Paper Chat & Summarizer
- **Memory-Safe Extraction:** Uses `PyMuPDF` with generator-based extraction to parse massive PDFs without memory spikes.
- **Persistent Memory:** Chunks and embeddings are securely stored in **Supabase pgvector**, persisting beyond server reloads.
- **Map-Reduce Summaries:** Generates cohesive summaries for large documents via a map-reduce summarization pipeline (`GET /api/summarize/{paper_id}`).

### 2) 🗂 Real-time Citation Intelligence
- **Intelligent Reference Matcher:** Validates bibliography text against the Semantic Scholar API using a robust 4-strategy fallback search (DOI → Exact → Title → Loose).
- **Live Streaming Progress:** Employs Server-Sent Events (SSE) to display a beautiful animated UI showing exactly which references are processing and matching in real-time.
- **Actionable AI Reading Paths:** Uses citation volumes and contextual metadata to recommend which papers to read first.

### 3) 🧪 Experiment Planner
- **Step-by-Step Roadmaps:** Generate detailed, step-wise execution plans by inputting a research topic and a target difficulty level.
- **Practical Metrics:** Provides parameter recommendations, risk assessments, and practical implementation details.

### 4) 💡 Problem Generator
- **Idea Ideation:** Input a domain, subdomain, and complexity level to generate novel research problems.
- **Problem Expansion:** Expand a selected surface-level idea into a deep execution brief and methodology.

### 5) 🔍 Gap Detection
- **Critical Analysis:** Detect logical flaws, missing literature, or methodological research gaps from uploaded files or pasted text.
- **Actionable Advice:** Returns severity scores (low/medium/high) alongside actionable suggestions for improvement.

### 6) 📊 Dataset & Benchmark Finder
- **Intelligent Matching:** Recommends the most suitable datasets, evaluation benchmarks, and common framework technologies.

---

## 🏗 System Architecture

PaperLens AI uses a decoupled client-server architecture, highly optimized for deployment environments with memory constraints (like Render's 500MB tier).

### High-Level Data Flow
1. **Frontend:** React/TypeScript + Tailwind + Framer Motion. Handled by **Clerk** for authentication.
2. **API Gateway:** Calls are made via JWT Bearer tokens to the **FastAPI** backend.
3. **Data Extraction:** PDFs are streamed through `PyMuPDF` via generators keeping memory overhead negligible.
4. **Vector Storage:** Chunks are embedded (`all-MiniLM-L6-v2`) and upserted to remote **Supabase pgvector** immediately. The heavy `torch` engine is lazy-loaded to prevent idle server bloating.
5. **AI Inference:** RAG context boundaries are orchestrated via prompt injection directly to **Groq**.

### Two paper workflows (important)
- **Legacy analyzer**: `POST /api/analyze` → returns `doc_id` → `POST /api/ask` with `doc_id` (in-memory; resets on backend restart)
- **Persistent RAG**: `POST /api/upload-paper` → returns `paper_id` → `GET /api/summarize/{paper_id}` and `POST /api/ask` with `paper_id` (persistent chunks in pgvector)

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, framer-motion |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy |
| **PDF Extraction**| PyMuPDF (fitz) |
| **Authentication** | Clerk JWT |
| **LLM Orchestration**| Groq (`llama-3.1-8b-instant`) |
| **Retrieval (RAG)** | Supabase `pgvector` Remote Storage + local FAISS fallback |
| **Database** | PostgreSQL |

---

## 🛠 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase Project (with `pgvector` enabled)
- Clerk, Groq, and Semantic Scholar API keys.

### 1) Database Preparation
Run the SQL definitions from `backend/supabase_migration.sql` in your Supabase SQL Editor. This establishes the `paper_chunks` schema and `match_chunks` RPC vector matching algorithm.

### 2) Backend Setup
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` with your 6 critical keys:
```env
DATABASE_URL=postgresql://postgres...
SUPABASE_URL=https://...
SUPABASE_KEY=...
CLERK_SECRET_KEY=sk_test_...
GROQ_API_KEY=gsk_...
SEMANTIC_SCHOLAR_API_KEY=...
```

Run server: `uvicorn app.main:app --reload`

### 3) Frontend Setup
```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Run client: `npm run dev`

---

## 🌍 Deployment

- **Backend:** Designed for Render. (⚠️ Keep `ENABLE_VECTOR_RETRIEVAL=false` for idle memory safety).
- **Frontend:** Designed for Vercel.

---

## ⚖️ License
MIT License. See `LICENSE`.
