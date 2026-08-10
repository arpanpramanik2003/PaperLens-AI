# ⚡ PaperLens AI Backend Services

High-performance **FastAPI** backend powering PaperLens AI — featuring autonomous ReAct agent loops, multi-model fallback routing, grounded RAG document QA, experiment planning, problem generation, gap detection, and citation intelligence.

---

## 🛠️ Production Technologies & Stack

### Core Backend & Web Services
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) — Modern, high-performance web framework for building async REST & SSE APIs with automatic OpenAPI docs.
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) — Lightning-fast ASGI server implementation.
- **Authentication**: [Clerk API](https://clerk.com/) — Multi-tenant authentication using PyJWT and RSA-256 JWKS public key verification.
- **Rate Limiting**: Custom async Token Bucket Rate Limiter (`rate_limiter.py`) with per-user throttling and HTTP 429 handling.

### Database, ORM & Migrations
- **Relational DB**: [PostgreSQL](https://www.postgresql.org/) via [SQLAlchemy 2.0 ORM](https://www.sqlalchemy.org/) — Database models for `Document`, `Activity`, `SavedItem`, `AgentTask`, and `AgentStep`.
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/) — Zero-downtime database migration engine managing schema revisions (`alembic/versions`).
- **Vector Database**: [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) — Remote vector extension storing dense 384-dim embeddings (`all-MiniLM-L6-v2`) for multi-page document chunk retrieval.

### AI Engine, LLM Routing & Structured Output
- **LLM Infrastructure**: [Groq Cloud API](https://groq.com/) — Low-latency inference engine powering `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-120b`, and `openai/gpt-oss-20b`.
- **Structured Outputs**: [Pydantic v2](https://docs.pydantic.dev/) — Strict JSON schema enforcement (`ReActDecision`, `SynthesisAndCritiqueResult`) preventing JSON parsing failures.
- **Model Fallback Engine**: Custom resilience layer (`model_fallback.py`) offering automatic per-attempt fallback routing across primary and secondary models.
- **Hybrid Retrieval**: In-memory [FAISS-CPU](https://github.com/facebookresearch/faiss) + [Rank-BM25](https://github.com/dorianbrown/rank_bm25) for high-precision hybrid lexical & vector searching.

### Document Parsing & External APIs
- **PDF Extraction**: [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/) — Memory-efficient generator-based text parser (optimized for production memory caps).
- **DOCX Extraction**: `python-docx` — OOXML document parsing.
- **Academic Citation Graph**: [Semantic Scholar API](https://www.semanticscholar.org/product/api), [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), and [arXiv API](https://arxiv.org/help/api) for paper discovery and literature graph expansion.

---

## 📂 Backend File Architecture

```text
backend/
├── alembic/                      # Alembic database migration management
│   ├── env.py                    # Migration environment runner
│   ├── script.py.mako            # Migration template script
│   └── versions/                 # Versioned migration revision scripts
├── alembic.ini                   # Alembic configuration file
├── app/                          # Core FastAPI application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI entrypoint, middleware, health check, CORS & telemetry
│   ├── api/                      # REST & SSE API route definitions
│   │   ├── __init__.py
│   │   └── routes.py             # Document upload, analyzer, Q&A, planner, gap detection & citation APIs
│   ├── core/                     # Core system utilities & configuration
│   │   ├── __init__.py
│   │   ├── config.py             # Pydantic environment settings & rate limits
│   │   ├── database.py           # SQLAlchemy database session & engine setup
│   │   ├── rate_limiter.py       # Per-user token bucket API rate limiter
│   │   └── security.py           # Clerk JWT token validation & RSA key verification
│   ├── models/                   # Data schemas & SQLAlchemy domain entities
│   │   ├── __init__.py
│   │   ├── agent_task.py         # AgentTask & AgentStep DB models
│   │   ├── domain.py             # Document, Activity & SavedItem DB models
│   │   └── schemas.py            # Pydantic request/response validation schemas
│   ├── routers/                  # Modular API routers
│   │   └── agent.py              # Autonomous ReAct agent execution & SSE event streaming endpoints
│   └── services/                 # Business logic, LLM section solvers & external integrations
│       ├── __init__.py
│       ├── cache.py              # In-memory document & index cache management
│       ├── chunking.py           # Semantic text chunking & page splitting logic
│       ├── citation_intelligence.py # Academic citation graph matching & literature search
│       ├── embedding.py          # Lazy-loaded SentenceTransformer embedding generator
│       ├── llm.py                # Legacy compatibility re-export wrapper
│       ├── model_fallback.py     # Multi-model automatic fallback completion executor
│       ├── parsing.py            # PyMuPDF & python-docx file extraction engine
│       ├── retrieval.py          # Hybrid FAISS & BM25 vector store builder
│       ├── summarization.py      # Batched map-reduce document summarization
│       ├── agents/               # Autonomous ReAct Agent subsystem
│       │   ├── __init__.py
│       │   ├── critique.py       # Peer-review critique & grounding validator
│       │   ├── mcp_server.py     # Model Context Protocol (MCP) server handler
│       │   ├── orchestrator.py   # Multi-agent task workflow dispatcher
│       │   ├── planner.py        # Report synthesis & section header generator
│       │   ├── react_agent.py    # Turn-compressed ReAct execution loop & scratchpad memory
│       │   ├── router.py         # Deterministic Fast-Path & dynamic LLM tool selector
│       │   ├── tools.py          # Scoped tool definitions (papers, datasets, problems, experiments)
│       │   └── trace.py          # ReAct execution event tracer & SSE emitter
│       └── llm_sections/         # Modular LLM section prompt solvers
│           ├── __init__.py
│           ├── analysis.py       # XML-tagged paper analyzer & chunk summarizer
│           ├── client.py         # Groq LLM client instance initialization
│           ├── generation.py     # Experiment planner, problem generator & dataset finder
│           └── qa.py             # Grounded Q&A prompt builder & pgvector RAG retriever
├── uploads/                      # Temporary PDF/DOCX file storage directory
├── requirements.txt              # Production Python package dependencies
├── supabase_migration.sql        # Supabase pgvector table DDL & RPC setup script
├── benchmark_token_savings.py    # Token efficiency & latency benchmark test suite
├── test_agent_architecture.py    # Router fast-path & tool scoping unit test suite
├── test_call_consolidation.py    # LLM call consolidation unit test suite
├── test_structured_outputs.py    # Pydantic & XML structured output validation unit test suite
├── .env                          # Environment secrets (ignored in git)
├── .gitignore                    # Backend gitignore rules
└── README.md                     # Backend system documentation
```

---

## 🚀 Setup & Local Development (Windows / Linux / macOS)

### 1. Environment Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate virtual environment (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration (`backend/.env`)

Create a `backend/.env` file in the backend root directory:

```env
# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/paperlens_db

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...

# AI Models & LLM Services (Groq)
GROQ_API_KEY=gsk_...
MODEL_NAME=llama-3.3-70b-versatile

# Academic API Services
SEMANTIC_SCHOLAR_API_KEY=your_key_here

# Vector Storage (Supabase pgvector)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
```

### 3. Run Database Migrations

```powershell
alembic upgrade head
```

### 4. Start Development Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Server will be ready at: `http://localhost:8000` (API OpenAPI docs at `http://localhost:8000/docs`).

---

## ⚡ Core API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server health check endpoint |
| `GET` | `/api/dashboard` | Required | Telemetry metrics & recent document activity |
| `POST` | `/api/analyze` | Required | Document upload & structured XML paper analysis |
| `POST` | `/api/upload-paper` | Required | Memory-efficient PDF parser & pgvector embedding storage |
| `GET` | `/api/summarize/{paper_id}` | Required | Batched map-reduce document summarization |
| `POST` | `/api/ask` | Required | Grounded Q&A (pgvector RAG + hybrid FAISS/BM25) |
| `POST` | `/api/agent/task` | Required | Create & launch autonomous ReAct agent task loop |
| `GET` | `/api/agent/task/{id}/stream` | Required | Real-time SSE stream of agent thoughts & actions |
| `POST` | `/api/citation-intelligence/stream` | Required | Real-time SSE stream of citation graph matching |

---

## 🏗️ Production Architecture & Optimization Highlights

1. **Low-Memory Footprint (<500MB RAM)**:
   - ML libraries (`torch`, `sentence-transformers`, `faiss`) are **lazy-loaded** on-demand when vector operations are requested, keeping idle memory usage at ~150MB.
   - Generator-based PDF text parsing via PyMuPDF prevents out-of-memory crashes on large 100+ page papers.

2. **Autonomous ReAct Agent Loop**:
   - Features a **Deterministic Fast-Path Router** (`router.py`) that bypasses LLM router calls for simple single-intent queries.
   - **Turn-Based System Prompt Compression**: Compresses system prompts after Turn 1, saving ~40% token overhead per turn.
   - Enforces Pydantic `ReActDecision` schemas to eliminate JSON parsing retries.

3. **Multi-Model Fallback Resilience**:
   - `create_completion_with_fallback()` automatically cycles through a primary model and ordered fallbacks (`llama-3.3-70b-versatile` $\rightarrow$ `llama-3.1-8b-instant` $\rightarrow$ `openai/gpt-oss-120b`), protecting against provider rate limits (429) or temporary outages.

---

## 🧪 Running Automated Test Suites

```powershell
# Run Agent Architecture & Router Fast-Path Tests
python test_agent_architecture.py

# Run Structured Outputs & Pydantic Validation Tests
python test_structured_outputs.py

# Run Call Consolidation & Batching Tests
python test_call_consolidation.py

# Run Token Savings Benchmark Suite
python benchmark_token_savings.py
```
