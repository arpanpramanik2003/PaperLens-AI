# 🤖 Agent Mode — Autonomous Multi-Agent Research Orchestrator

<p align="center">
  <img src="https://img.shields.io/badge/Orchestrator-Autonomous%20Multi--Agent-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Autonomous Multi-Agent" />
  <img src="https://img.shields.io/badge/Protocol-MCP%20JSON--RPC-blue?style=for-the-badge&logo=json&logoColor=white" alt="MCP Server" />
  <img src="https://img.shields.io/badge/Streaming-SSE%20Live%20Progress-emerald?style=for-the-badge&logo=fastapi&logoColor=white" alt="SSE Stream" />
  <img src="https://img.shields.io/badge/VectorDB-Supabase%20pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase pgvector" />
  <img src="https://img.shields.io/badge/LLM-Groq%20%2B%20GPT--OSS--120B-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="LLM Engine" />
</p>

---

> [!IMPORTANT]
> **UX & Architectural Isolation Contract**
> Agent Mode is **100% additive and non-breaking**. Operating under its own isolated page route (`/agent`) and top navigation button, Agent Mode wraps existing PaperLens AI services into standard Python `@tool` definitions without altering legacy backend routes (`analysis.py`, `generation.py`, `qa.py`). If Agent Mode is modified or encounters runtime errors, the rest of the application remains fully functional.

---

## 🎯 1. Overview & Core Mission

**Agent Mode** transforms PaperLens AI from a step-by-step tool into an **autonomous multi-agent research assistant**. Given an open-ended, free-text research goal (such as *"Do a literature review on graph neural networks for drug discovery and find 3 unexplored directions"*), the agent independently plans its execution, queries literature repositories, embeds workspace documents, synthesizes problem statements, evaluates SOTA benchmarks, performs peer-review self-critiques, and builds multi-stage experimental execution plans.

```mermaid
flowchart TD
    A["👤 User Prompt (Free Text Goal)"] --> B["🧠 Agent Planner (planner.py)"]
    
    subgraph ToolRegistry ["🛠️ Autonomous Multi-Agent Tool Registry (tools.py)"]
        C1["🔍 search_papers"]
        C2["🧬 search_workspace_vector_db"]
        C3["📄 analyze_paper"]
        C4["💡 generate_problem"]
        C5["📊 find_datasets"]
        C6["🛡️ validate_citations"]
        C7["🧪 plan_experiment"]
    end

    subgraph LiteratureEngine ["📡 Multi-Provider Literature Fallback"]
        D1["Semantic Scholar API"]
        D2["Crossref API (429 Rate Limit Fallback)"]
        D3["arXiv API (40 Paper Batch Search)"]
    end

    B -->|Tool Call Loop| ToolRegistry
    C1 --> LiteratureEngine
    C2 --> E["⚡ Supabase pgvector (Remote DB)"]
    C7 --> F["🚀 /api/plan-experiment Route"]

    ToolRegistry -->|Live Event Stream| G["📡 Server-Sent Events (/api/agent/task/{id}/stream)"]
    ToolRegistry -->|Stdio JSON-RPC| H["💻 MCP Server (mcp_server.py)"]
    G --> I["💻 Interactive Agent Workspace UI (AgentMode.tsx)"]
```

---

## 🛠️ 2. Autonomous Multi-Agent Tool Registry (`tools.py`)

Agent Mode exposes decorated `@tool` functions that wrap core application services into reusable agent actions:

| Tool Identifier | Function Decorator | Target Backend Service | Description & Return Schema |
|---|---|---|---|
| `search_papers` | `@tool("search_papers")` | `citation_intelligence.py` | Queries Semantic Scholar, Crossref API fallback, and arXiv API for up to 40 literature records. Returns `{ "papers": [...] }`. |
| `search_workspace_vector_db` | `@tool("search_workspace_vector_db")` | `retrieval.search_pgvector_chunks` | Executes dense vector similarity search over uploaded PDF document chunks in Supabase `pgvector`. |
| `analyze_paper` | `@tool("analyze_paper")` | `llm_sections/analysis.py` | Extracts structural abstractions, methodology, and key insights from literature paper text. |
| `generate_problem` | `@tool("generate_problem")` | `llm_sections/generation.py` | Formulates novel research directions with **100% unique, title-specific objectives** and problem statements. |
| `find_datasets` | `@tool("find_datasets")` | `llm_sections/generation.py` | Recommends SOTA datasets, evaluation benchmarks, and primary tasks with full field normalization (`type`, `tasks`, `metrics`, `fit_score`). |
| `validate_citations` | `@tool("validate_citations")` | Peer-Review Audit | Verifies claim coverage and citation backing against literature sources. |
| `plan_experiment` | `@tool("plan_experiment")` | `llm_sections/generation.py` | Connects directly to `/api/plan-experiment` backend route to generate 6-stage experimental execution roadmaps. |

> [!NOTE]
> All tool functions use non-blocking `asyncio.get_running_loop().run_in_executor()` calls to execute heavy synchronous LLM inference without blocking FastAPI's async event loop.

---

## 📡 3. Multi-Provider Literature Search Engine

To prevent single-provider rate-limit failures during deep research tasks, `search_papers` implements a 3-tier fallback literature engine:

1. **Primary**: Queries **Semantic Scholar API** (`https://api.semanticscholar.org/graph/v1/paper/search`).
2. **HTTP 429 Fallback**: If Semantic Scholar returns `429 Too Many Requests`, the engine automatically switches to the **Crossref API** (`https://api.crossref.org/works`).
3. **arXiv Batch Fetching**: Concurrently queries **arXiv API** (`http://export.arxiv.org/api/query`) to fetch up to 40 papers sorted by relevance and publication recency.

---

## ⚡ 4. Supabase pgvector Integration (`search_workspace_vector_db`)

Agent Mode seamlessly queries your workspace vector database using `@tool("search_workspace_vector_db")`:

- **Retrieval Function**: Wraps `search_pgvector_chunks(query, limit=5)` in `backend/app/services/retrieval.py`.
- **Match RPC**: Calls Supabase PostgreSQL function `match_chunks(query_embedding, match_count, filter)` via cosine similarity search (`<=>` operator).
- **Persistent Knowledge**: Allows the agent to incorporate insights from user-uploaded PDFs alongside external literature APIs.

---

## 📡 5. Real-Time SSE Stream & Auth Architecture

Agent Mode streams execution updates to the frontend using **Server-Sent Events (SSE)**:

### 1) Execution Flow
1. **Initialize Task**: `POST /api/agent/task` receives `{ "goal": "..." }`, creates a unique `task_id`, and launches `AgentPlanner` in a background worker task.
2. **Open SSE Connection**: Frontend opens `GET /api/agent/task/{task_id}/stream?token={encodedJwtToken}`.
3. **Stream Events**: Backend yields JSON payload lines prefixed with `data: ` as tools execute.

### 2) Token Query Authentication
> [!TIP]
> Native browser `EventSource` API cannot pass custom HTTP request headers. Agent Mode passes the Clerk JWT via a URL query parameter (`?token=...`), which FastAPI's `get_current_user_from_token` function validates in `backend/app/core/security.py`.

### 3) SSE Event Types
```typescript
interface EventStep {
  type: "tool_call" | "tool_result" | "critique" | "synthesis_start" | "final" | "error";
  tool?: string;
  step_index?: number;
  args?: Record<string, any>;
  data?: any;
  answer?: string;
  results?: any[];
  critique?: any;
}
```

---

## 💻 6. Model Context Protocol (MCP) Server Protocol

Agent Mode tools are exposed to external MCP client applications over standard input/output (stdio) using standard JSON-RPC 2.0:

- **Executable Entry Point**: `backend/app/mcp_server.py`
- **Supported Capabilities**:
  - `tools/list`: Returns JSON schemas for all registered tools.
  - `tools/call`: Executes standard tool invocations remotely.

### Running MCP Server Standalone
```powershell
cd backend
python app/mcp_server.py
```

---

## 🎨 7. Interactive Workspace UI & Experiment Planner Integration

The frontend (`frontend/src/pages/AgentMode.tsx`) renders a structured research environment:

1. **Live Research Progress Stepper**: 6-stage animated progress bar and status cards (Literature Search $\rightarrow$ Insights Analysis $\rightarrow$ Novel Directions $\rightarrow$ Dataset Selection $\rightarrow$ Peer-Review Critique $\rightarrow$ Report Synthesis).
2. **Citation Intelligence Repository**: Scrollable container displaying 30+ literature papers with **Year Buckets** filter chips and sorting controls (Newest, Oldest, Highest Citations).
3. **Proposed Novel Research Directions**: Clean direction cards displaying:
   - **Title** & **High Impact Direction** badge.
   - 2-Column Grid: **Core Bottleneck / Problem Statement** and **Proposed Solution & Objective**.
   - **CTA Button**: **"Plan Roadmap in Experiment Planner"** (`<FlaskConical className="w-4 h-4" />`).
4. **Interactive Inline Roadmap**: Clicking the CTA button calls `/api/plan-experiment` to expand an interactive 6-stage experimental roadmap (Stage #, Title, Details, Parameters/Configurations, and Risk Checkpoints).
5. **Normalized Datasets Matrix**: 2-column grid rendering SOTA benchmarks with **Fit Scores** (e.g., `4.9/5 Fit`), Modalities/Format, Primary Tasks, and Evaluation Metrics.

---

## 🔐 8. Security & Credentials Best Practices

PaperLens AI enforces strict credential protection across all environments:

> [!WARNING]
> Never hardcode API keys or secrets in source code, documentation, or git commits.

### Required Environment Configuration (`backend/.env`)
```env
# Database & Vector DB
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
CLERK_SECRET_KEY=sk_test_[CLERK_SECRET_KEY]

# LLM & Literature APIs
GROQ_API_KEY=gsk_[GROQ_API_KEY]
SEMANTIC_SCHOLAR_API_KEY=[SEMANTIC_SCHOLAR_API_KEY]
```

### Frontend Configuration (`frontend/.env.local`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[CLERK_PUB_KEY]
VITE_API_URL=http://localhost:8000
```
