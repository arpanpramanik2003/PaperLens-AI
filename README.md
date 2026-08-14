# PaperLens AI

<p align="center">
  <picture>
    <source srcset="frontend/public/demo.webp" type="image/webp" />
    <img src="frontend/public/demo.png" alt="PaperLens AI Platform Interface" width="100%" loading="lazy" decoding="async" />
  </picture>
</p>

<p align="center">
  <b>Autonomous, full-stack AI research platform for literature analysis, experiment planning, problem ideation, gap detection, citation graph intelligence, and benchmark discovery.</b>
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React TypeScript" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI%20(Python%203.10%2B)-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://groq.com"><img src="https://img.shields.io/badge/LLM%20Inference-Groq%20Cloud-F55036?style=flat-square&logo=groq&logoColor=white" alt="Groq Cloud" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Vector%20DB-Supabase%20pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase pgvector" /></a>
  <a href="https://clerk.com"><img src="https://img.shields.io/badge/Auth-Clerk%20JWT%20(JWKS)-6C47FF?style=flat-square&logo=clerk&logoColor=white" alt="Clerk Auth" /></a>
  <a href="https://alembic.sqlalchemy.org"><img src="https://img.shields.io/badge/Migrations-Alembic-6A1520?style=flat-square&logo=sqlalchemy&logoColor=white" alt="Alembic" /></a>
  <a href="https://render.com"><img src="https://img.shields.io/badge/Deployment-Render%20%2B%20Vercel-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render Vercel" /></a>
</p>

<p align="center">
  <a href="https://paper-explainer.vercel.app"><b>🚀 Live Platform Demo</b></a> •
  <a href="https://github.com/arpanpramanik2003/PaperLens-AI"><b>💻 GitHub Repository</b></a> •
  <a href="docs/API_REFERENCE.md"><b>📖 API Reference</b></a> •
  <a href="docs/ARCHITECTURE.md"><b>🏗 System Architecture</b></a>
</p>

---

## 📌 Executive Summary

**PaperLens AI** is an autonomous, full-stack AI research orchestrator designed to transform unstructured academic literature into structured, actionable research outputs. Unlike basic single-prompt document chatbots, PaperLens AI operates as a **multi-capability scientific assistant** featuring a dual-pipeline RAG architecture (in-memory BM25 + FAISS hybrid search for instant single-session analysis, paired with remote Supabase `pgvector` persistence for cross-session synthesis), a multi-provider fallback engine, real-time Server-Sent Events (SSE) citation tracking, and an autonomous **ReAct agent loop with Model Context Protocol (MCP) server support**.

The system is engineered specifically to run under tight production constraints (such as Render's 500MB free-tier memory cap) through generator-based document parsing, lazy-loaded embedding models, and token-optimized prompt design.

---

## ⚡ Key Engineering Benchmarks & Rigor

PaperLens AI incorporates systematic LLM orchestration optimizations validated by automated test suites (`benchmark_token_savings.py`, `test_agent_architecture.py`, `test_call_consolidation.py`, and `test_structured_outputs.py`):

| Optimization Benchmark | Measured Performance Gain | Technical Implementation |
|---|---|---|
| **Deterministic Fast-Path Router** | **1.5s Latency Savings (~600 tokens/query)** | Direct keyword pattern matcher skips the LLM router call for single-intent queries (e.g. dataset lookup, literature search). |
| **LLM Call Consolidation** | **54.5% API Call Reduction** | Consolidated dual-pass synthesis & critique into single LLM passes; batched multi-chunk summarization. |
| **Turn-Based System Prompt Compression** | **~40% Context Token Reduction** | Turn 1 sends full tool JSON schemas; Turns 2–6 automatically compress tools into signature representations (`ACTIVE TOOLS: search_papers(domain, limit)`). |
| **Memory-Safe Extraction** | **0MB Heap Bloat (500MB Cap Compliant)** | Generator-based `PyMuPDF` stream parsing combined with lazy-loaded `SentenceTransformer` vector models. |
| **Structured Output Enforcement** | **0 Parsing Retries / 0 Regex Hacks** | Strict Pydantic v2 schemas (`ReActDecision`, `SynthesisAndCritiqueResult`) + XML tags (`<summary>`, `<limitations>`, `<future_work>`). |
| **4-Stage Citation Matching Resilience** | **<1% Missing Citation Rate** | Automatic 4-stage search fallback (DOI $\rightarrow$ Exact Match $\rightarrow$ Title $\rightarrow$ Loose Keyword) handling Semantic Scholar & Crossref HTTP 429 rate limits. |

---

## 🏗 High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer ["💻 Client Layer (React 18 + TypeScript + Vite)"]
        UI["React Dashboard UI (Tailwind CSS + Framer Motion)"]
        Auth["Clerk JWT Authentication"]
    end

    subgraph APIGateway ["⚡ Backend Gateway (FastAPI + Async Uvicorn)"]
        JWKS["Clerk RSA-256 JWKS Validator"]
        Limiter["Async Token-Bucket Rate Limiter"]
        Routes["REST & SSE Route Handlers (/api/*)"]
    end

    subgraph AgentEngine ["🤖 Autonomous ReAct Agent Loop (backend/app/services/agents/)"]
        Router{"Fast-Path Router\n(Keyword vs LLM Intent)"}
        ReactLoop["ReAct Execution Loop & Scratchpad Memory"]
        TurnCompress["Turn-Based System Prompt Compressor"]
        PydanticGuard["Pydantic & XML Output Guardrails"]
    end

    subgraph CapabilitiesSubsystem ["🛠 Capability Engines & Scoped Tools"]
        PaperAnalyzer["📄 Paper Analyzer (In-Memory BM25/FAISS + pgvector)"]
        ExpPlanner["🧪 Experiment Planner (Roadmap Generator)"]
        ProblemGen["💡 Problem Generator (Ideation & Brief Expansion)"]
        GapDetect["🔍 Gap Detection (Methodological Flaw Scoring)"]
        DatasetFinder["📊 Dataset & Benchmark Finder"]
        CitationIntel["🗂 Citation Intelligence (SSE + 4-Stage Fallback)"]
        MCPProtocol["🔌 Model Context Protocol (MCP) Server"]
    end

    subgraph InfrastructureLayer ["⚙️ Infrastructure & External APIs"]
        Groq["Groq LLM Engine\n(llama-3.1-8b / gpt-oss-120b)"]
        ModelFallback["Multi-Model Resilience & Fallback Router"]
        Supabase["Supabase PostgreSQL + pgvector"]
        AcademicAPIs["Semantic Scholar / Crossref / arXiv APIs"]
    end

    UI -->|Bearer JWT| Auth --> JWKS --> Limiter --> Routes
    Routes --> Router
    Router -->|Single Intent| CapabilitiesSubsystem
    Router -->|Open-Ended Task| ReactLoop
    ReactLoop --> TurnCompress --> PydanticGuard --> CapabilitiesSubsystem
    CapabilitiesSubsystem --> ModelFallback --> Groq
    CapabilitiesSubsystem --> Supabase
    CapabilitiesSubsystem --> AcademicAPIs
```

---

## 🛠 Core Platform Capabilities

Each capability is built as a modular domain engine accessible via REST endpoints, SSE streams, or the autonomous ReAct agent loop:

1. **📄 [Paper Analyzer](docs/capabilities/paper-analyzer.md)**: Dual RAG architecture providing instant in-memory BM25 + FAISS single-session Q&A, plus remote Supabase `pgvector` chunking (`tiktoken`) for persistent Map-Reduce document summarization.
2. **🧪 [Experiment Planner](docs/capabilities/experiment-planner.md)**: Generates structured, step-by-step 6-phase research roadmaps with parameter recommendations, baseline configurations, and risk assessments.
3. **💡 [Problem Generator](docs/capabilities/problem-generator.md)**: Two-stage ideation engine that identifies novel research problems in a target domain and expands surface ideas into comprehensive methodology briefs.
4. **🔍 [Gap Detection](docs/capabilities/gap-detection.md)**: Analyzes manuscripts or text inputs for methodological flaws, unstated assumptions, missing literature, and severity scores (Low/Medium/High) on a pinned lightweight LLM route (`llama-3.1-8b-instant`).
5. **📊 [Dataset & Benchmark Finder](docs/capabilities/dataset-benchmark-finder.md)**: Matches research problems with standard datasets, evaluation benchmarks, evaluation metrics, and baseline models.
6. **🗂 [Citation Intelligence](docs/capabilities/citation-intelligence.md)**: Evaluates paper bibliographies via a 4-stage fallback matcher (DOI $\rightarrow$ Exact $\rightarrow$ Title $\rightarrow$ Loose), streams real-time matching progress over Server-Sent Events (SSE), and computes prioritized reading paths.
7. **🤖 [Agent Mode](docs/capabilities/agent-mode.md)**: Flagship autonomous multi-agent orchestrator implementing a turn-compressed ReAct loop, task-scoped tools, deterministic fast-path routing, and native Model Context Protocol (MCP) server integration.

---

## 💻 Tech Stack & Component Ecosystem

| Layer | Primary Technologies | Architecture & Rationale |
|---|---|---|
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion | Fully typed component architecture with dynamic state drawers, interactive execution graphs, and SSE streaming handlers. |
| **Backend Framework** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, Asyncio | Async ASGI server delivering high concurrency, automatic OpenAPI documentation, and strict request/response data contracts. |
| **Auth & Security** | Clerk JWT, RSA-256 JWKS Verification, Custom Token Bucket Rate Limiter | Stateless token validation via Clerk public keys; per-user sliding-window rate limiting protecting LLM & database endpoints. |
| **Database & Persistence** | PostgreSQL, Supabase `pgvector`, SQLAlchemy 2.0 ORM, Alembic | Relational tracking for user activity & documents combined with remote vector embeddings (`paper_chunks`) and Alembic migration control. |
| **RAG & Vector Search** | `PyMuPDF (fitz)`, `rank_bm25`, `faiss-cpu`, `all-MiniLM-L6-v2`, `tiktoken` | Hybrid lexical (BM25) + dense vector (FAISS/pgvector) retrieval; generator-based parsing preventing memory bloat on massive PDFs. |
| **LLM & Fallback Engine** | Groq Cloud API (`llama-3.1-8b-instant`, `openai/gpt-oss-120b`, `llama-3.3-70b`) | Ultra-low latency inference with custom per-attempt model fallback routing for maximum API uptime and cost control. |

---

## 🛠 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm 9+
- Supabase Project (with `pgvector` extension enabled)
- Clerk, Groq Cloud, and Semantic Scholar API keys

### 1) Database Initialization
Run the SQL DDL script from [`backend/supabase_migration.sql`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/supabase_migration.sql) in your Supabase SQL Editor to establish the `paper_chunks` schema and `match_chunks` RPC vector search function.

### 2) Backend Setup
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-key
CLERK_SECRET_KEY=sk_test_...
GROQ_API_KEY=gsk_...
SEMANTIC_SCHOLAR_API_KEY=your-key
```

Run the development server:
```powershell
uvicorn app.main:app --reload --port 8000
```

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

Run the client:
```powershell
npm run dev
```

---

## 📚 Deep-Dive Documentation Index

For technical interviewers, hiring managers, and system contributors seeking in-depth architectural and design analysis:

- 🏗 **[System Architecture Guide (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)** — Complete multi-layer architecture, sequence diagrams, dual RAG pipeline execution, and ReAct agent state machine.
- 💡 **[Design Decisions & Engineering Trade-Offs (`docs/DESIGN_DECISIONS.md`)](docs/DESIGN_DECISIONS.md)** — Rationale behind FAISS vs pgvector, ReAct agent loops vs static DAGs, Groq inference, and Pydantic/XML constraints.
- 🛡️ **[Security & Performance Optimization Audit (`docs/SECURITY_PERFORMANCE.md`)](docs/SECURITY_PERFORMANCE.md)** — In-depth breakdown of Clerk JWKS authentication, token-bucket rate limiting, LLM token benchmarks, and memory profiling.
- 💻 **[Detailed Tech Stack & Dependencies (`docs/TECH_STACK.md`)](docs/TECH_STACK.md)** — Detailed rationale for technology choices, framework comparisons, and complete dependency tree analysis.
- 🗄 **[Database Schema & Vector Architecture (`docs/DATABASE.md`)](docs/DATABASE.md)** — Entity-relationship diagrams, PostgreSQL schemas, Supabase pgvector `paper_chunks` DDL, RPC matching algorithms, and Alembic migrations.
- 📖 **[OpenAPI-Grade API Reference (`docs/API_REFERENCE.md`)](docs/API_REFERENCE.md)** — Complete specification of all REST endpoints, SSE streaming endpoints, MCP server protocols, request/response schemas, and status code matrix.
- 🌍 **[Production Deployment & DevOps Guide (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md)** — Setup instructions for Render (backend 500MB RAM tier optimization), Vercel (frontend), environment variable security, and production migrations.

---

## 📜 License & Credits

Distributed under the MIT License. See [`LICENSE`](file:///d:/Edutation(P)/Learning-code/paper_explainer/LICENSE) for more details.  
Built by **[Arpan Pramanik](https://github.com/arpanpramanik2003)**.
