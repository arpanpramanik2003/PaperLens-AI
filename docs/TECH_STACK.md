# 💻 Technology Stack & Architecture Rationale

This document provides a technical breakdown of all frameworks, libraries, database engines, and AI services used in **PaperLens AI**. Every technology selected serves a specific architectural requirement for performance, memory footprint, low latency, or strict type safety.

---

## 🏛 System Stack Overview

```
PaperLens AI Stack Layer Topology
├── Client Layer: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Clerk SDK
├── API & Gateway Layer: FastAPI, Async Uvicorn, PyJWT JWKS, Custom Token-Bucket Limiter
├── LLM & Agent Engine: Groq Cloud API, ReAct Agent, Pydantic v2, Model Fallback Engine
├── Retrieval & Vector Layer: Supabase pgvector, PyMuPDF, FAISS-CPU, Rank-BM25, tiktoken
└── Database & Migrations: PostgreSQL, SQLAlchemy 2.0 ORM, Alembic, Render, Vercel
```

---

## 1. Frontend Client Layer

| Technology | Version / Spec | Purpose & Implementation in PaperLens AI |
|---|---|---|
| **[React](https://react.dev)** | `^18.3.1` | Core UI library powering component state management, dynamic drawers, steppers, and interactive workflow dashboards. Located in [`frontend/src/`](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend/src). |
| **[TypeScript](https://www.typescriptlang.org/)** | `^5.5.3` | Enforces strict compile-time types across API payload contracts, state transitions, and UI prop definitions (`frontend/src/types/`). |
| **[Vite](https://vitejs.dev/)** | `^5.4.2` | High-speed frontend build tool and dev server providing instant hot module replacement (HMR) and optimized production bundler. |
| **[Tailwind CSS](https://tailwindcss.com/)** | `^3.4.1` | Utility-first styling engine driving the modern dark-mode aesthetic, custom gradients, and visual component glassmorphism. |
| **[Framer Motion](https://www.framer.com/motion/)** | `^11.15.0` | Powers smooth micro-animations, animated steppers, sliding Q&A drawers, and dynamic agent turn execution streams. |
| **[shadcn/ui](https://ui.shadcn.com/)** | Radix UI primitives | Accessible, modular UI components (`button`, `card`, `dialog`, `badge`, `tabs`, `progress`) customized for PaperLens AI interface. |
| **[Clerk React SDK](https://clerk.com/)** | `^5.22.0` | Client-side authentication provider handling user login, JWT session tokens, and header authorization injection in [`api-client.ts`](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend/src/lib/api-client.ts). |
| **[Lucide React](https://lucide.dev/)** | `^0.477.0` | Consistent iconography system used across all dashboard navigation items, status badges, and action buttons. |

---

## 2. Backend API & Core Gateway

| Technology | Version / Spec | Purpose & Implementation in PaperLens AI |
|---|---|---|
| **[FastAPI](https://fastapi.tiangolo.com/)** | `^0.110.0` | Modern, high-performance Python ASGI web framework providing asynchronous route handling, automatic OpenAPI schema generation, and Pydantic request validation. Defined in [`main.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/main.py) and [`routes.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/api/routes.py). |
| **[Uvicorn](https://www.uvicorn.org/)** | `^0.28.0` | Asynchronous Server Gateway Interface (ASGI) web server running FastAPI with low overhead. |
| **[PyJWT & Cryptography](https://pyjwt.readthedocs.io/)** | `^2.8.0` | Validates Clerk RSA-256 JWT tokens via remote Json Web Key Sets (JWKS) verification in [`security.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/security.py). |
| **Custom Token Bucket Rate Limiter** | Pure Async Python | Implements per-user sliding window API throttling in [`rate_limiter.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/rate_limiter.py) to prevent LLM quota exhaustion and HTTP 429 errors. |

---

## 3. LLM Orchestration, Agent Engine & Structured Outputs

| Technology | Version / Spec | Purpose & Implementation in PaperLens AI |
|---|---|---|
| **[Groq Cloud API](https://groq.com/)** | Llama 3.1 & GPT-OSS | Primary low-latency LLM inference provider executing models: `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, and `meta-llama/llama-4-scout-17b-16e-instruct`. |
| **[Pydantic v2](https://docs.pydantic.dev/)** | `^2.6.4` | Strict schema validation for request payloads and LLM structured outputs (`ReActDecision`, `SynthesisAndCritiqueResult`) in [`schemas.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py). Eliminates JSON parsing retries. |
| **Custom Model Fallback Engine** | Pure Python Async | Multi-model fallback execution in [`model_fallback.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/model_fallback.py). Automatically routes failed primary LLM requests to secondary models. |
| **Autonomous ReAct Agent Loop** | Pure Python Engine | Turn-compressed agent execution loop with dynamic tool scoping, scratchpad memory, and SSE step tracing in [`react_agent.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/react_agent.py). |
| **Model Context Protocol (MCP)** | Standard Protocol | Exposes PaperLens AI tools over a standardized MCP server interface in [`mcp_server.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/mcp_server.py). |

---

## 4. Retrieval, Document Parsing & Vector Search

| Technology | Version / Spec | Purpose & Implementation in PaperLens AI |
|---|---|---|
| **[Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)** | PostgreSQL Extension | Remote dense vector database storing 384-dimensional text embeddings in the `paper_chunks` table for persistent RAG retrieval. Executed via `match_chunks` RPC in [`qa.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/qa.py). |
| **[PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)** | `^1.23.26` | Memory-safe generator-based PDF text parser (`extract_pdf_pages_generator`) in [`parsing.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/parsing.py), built to operate within Render's 500MB RAM tier. |
| **[python-docx](https://python-docx.readthedocs.io/)** | `^1.1.0` | Validates OOXML containers and extracts structured text from Microsoft Word documents. |
| **[FAISS-CPU](https://github.com/facebookresearch/faiss)** | `^1.8.0` | In-memory dense vector index (`IndexFlatL2`) used for legacy instant single-session paper search in [`retrieval.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/retrieval.py). |
| **[Rank-BM25](https://github.com/dorianbrown/rank_bm25)** | `^0.2.2` | In-memory BM25 lexical keyword search engine paired with FAISS for hybrid retrieval in [`retrieval.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/retrieval.py). |
| **[SentenceTransformers](https://www.sbert.net/)** | `all-MiniLM-L6-v2` | Dense embedding model generating 384-dimensional vector representations. Lazy-loaded in [`embedding.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/embedding.py) to prevent memory allocation spikes. |
| **[tiktoken](https://github.com/openai/tiktoken)** | `^0.6.0` | Byte-pair encoding tokenizer generating exact 512-token chunk boundaries for vector store insertion in [`chunking.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/chunking.py). |

---

## 5. Persistence, Migrations & External Academic APIs

| Technology | Version / Spec | Purpose & Implementation in PaperLens AI |
|---|---|---|
| **[PostgreSQL](https://www.postgresql.org/)** | `^15.0` | Primary relational database storing user activities, uploaded paper metadata, agent execution history (`AgentTask`, `AgentStep`), and saved items. |
| **[SQLAlchemy](https://www.sqlalchemy.org/)** | `^2.0.28` | Async-compatible Python Object Relational Mapper (ORM) defining domain models in [`domain.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/domain.py) and [`agent_task.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/agent_task.py). |
| **[Alembic](https://alembic.sqlalchemy.org/)** | `^1.13.1` | Database migration tool managing versioned schema changes in [`backend/alembic/`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/alembic). |
| **Academic APIs** | REST Services | Integrates [Semantic Scholar Graph API](https://www.semanticscholar.org/product/api), [Crossref REST API](https://www.crossref.org/), and [arXiv API](https://arxiv.org/help/api) for paper metadata, DOI lookup, and literature discovery in [`citation_intelligence.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/citation_intelligence.py). |
