# 📖 PaperLens AI — Production API & Endpoint Specification

This document provides a production-grade API reference for **PaperLens AI**. All request models match Pydantic schemas in [`backend/app/models/schemas.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py), and routes match FastAPI specifications in [`routes.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/api/routes.py) and [`agent.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/routers/agent.py).

---

## 🔐 Global Authentication & Rate Limiting

### Authentication Header
Unless explicitly marked as Public, all endpoints require a valid Clerk JWT Bearer token:
```http
Authorization: Bearer <CLERK_JWT_TOKEN>
```
Tokens are validated via RSA-256 Json Web Key Sets (JWKS) in [`backend/app/core/security.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/security.py).

### Rate Limits & Error Matrix
Request throttling is enforced via an async sliding window rate limiter in [`backend/app/core/rate_limiter.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/rate_limiter.py):

| Category | Limit per User | HTTP Status on Exceeded | Response Header |
|---|---|---|---|
| **Standard LLM & Query Endpoints** | 10 requests / minute | `429 Too Many Requests` | `Retry-After: <seconds>` |
| **Document Upload Routes** | 5 uploads / minute | `429 Too Many Requests` | `Retry-After: <seconds>` |

### Common Error Responses
- `401 Unauthorized`: Token missing, expired, or invalid RSA signature.
- `400 Bad Request`: Validation failure or malformed OOXML document (`INVALID_DOCUMENT_FORMAT`).
- `413 Payload Too Large`: Document exceeds 50 pages or 150k characters (`PAPER_TOO_LENGTHY`).
- `429 Too Many Requests`: Rate limit exceeded.

---

## 1. System Health & Authentication Check

### `GET /health`
- **Auth**: None (Public)
- **Rate Limit**: Unrestricted
- **Purpose**: System readiness and deployment health check.
- **Success Response (200 OK)**:
```json
{ "status": "ok" }
```

### `GET /api/test-auth`
- **Auth**: Required (`Bearer JWT`)
- **Rate Limit**: Unrestricted
- **Purpose**: Verifies Clerk RSA-256 JWT decoding and extracts user ID (`sub`).
- **Success Response (200 OK)**:
```json
{
  "message": "You are fully authenticated!",
  "user_id": "user_2bXYZ..."
}
```

---

## 2. Dashboard & User Persistence Endpoints

### `GET /api/dashboard`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Purpose**: Retrieves aggregated user statistics and recent paper uploads.
- **Success Response (200 OK)**:
```json
{
  "stats": [
    { "label": "Papers Analyzed", "value": "4", "icon": "FileText", "change": "" },
    { "label": "Experiments Planned", "value": "2", "icon": "FlaskConical", "change": "" },
    { "label": "Ideas Generated", "value": "5", "icon": "Lightbulb", "change": "" },
    { "label": "Gaps Detected", "value": "3", "icon": "ScanSearch", "change": "" },
    { "label": "Citations Analyzed", "value": "12", "icon": "BarChart3", "change": "" }
  ],
  "recentPapers": [
    { "title": "gnn_drug_discovery.pdf", "date": "10 minutes ago", "status": "Analyzed" }
  ]
}
```

### `POST /api/save-item`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`SaveItemRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L64-L70)
- **Request Payload**:
```json
{
  "section": "experiment_planner",
  "title": "GNN Drug Discovery Roadmap",
  "summary": "6-phase execution plan for molecular graph embeddings",
  "payload": { "phases": [...] }
}
```
- **Success Response (200 OK)**: [`SavedItemResponse`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L96-L103)

---

## 3. RAG Paper Analysis & Grounded Q&A

### `POST /api/analyze` (Legacy In-Memory Pipeline)
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: 5 uploads/min
- **Form Data**: `file` (PDF or DOCX file stream)
- **Purpose**: Extracts PDF text via PyMuPDF generators, builds in-memory BM25 + FAISS index, and returns structured 6-section analysis.
- **Success Response (200 OK)**: [`AnalyzeResponse`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L106-L112)
```json
{
  "result": "# Document Executive Summary\n...",
  "doc_id": "a1f9c3e210ab",
  "page_count": 14,
  "detected_title": "Graph Neural Networks for Drug Discovery"
}
```

### `POST /api/upload-paper` (Persistent pgvector Pipeline)
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: 5 uploads/min
- **Form Data**: `file` (PDF or DOCX file stream)
- **Purpose**: Tokenizes document via `tiktoken`, generates 384-dim embeddings (`all-MiniLM-L6-v2`), and upserts vectors into Supabase `paper_chunks`.
- **Success Response (200 OK)**: [`UploadPaperResponse`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L131-L137)
```json
{
  "paper_id": "paper_99b7c2",
  "page_count": 18,
  "chunk_count": 42,
  "status": "success",
  "message": "Paper stored and indexed in Supabase pgvector successfully"
}
```

### `GET /api/summarize/{paper_id}`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Purpose**: Executes batched Map-Reduce summarization over `paper_id` vector chunks in Supabase.
- **Success Response (200 OK)**: [`SummarizeResponse`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L139-L143)

### `POST /api/ask`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`AskRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L6-L11)
- **Request Payload**:
```json
{
  "question": "What baseline datasets were used for performance evaluation?",
  "doc_id": "a1f9c3e210ab",
  "paper_id": null,
  "history": []
}
```
- **Success Response (200 OK)**:
```json
{
  "answer": "The paper evaluated performance on ZINC250k, MUTAG, and Tox21 benchmarks..."
}
```

---

## 4. Scientific Ideation & Planning Capabilities

### `POST /api/plan-experiment`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`ExperimentPlanRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L14-L18)
- **Request Payload**:
```json
{
  "topic": "Contrastive Representation Learning for Single-Cell RNA",
  "difficulty": "Advanced"
}
```
- **Model Route**: Primary `openai/gpt-oss-120b` (Fallback: `llama-3.3-70b-versatile`).

### `POST /api/generate-problems`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`ProblemGeneratorRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L20-L25)

### `POST /api/expand-problem`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`ProblemDetailRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L27-L33)

### `POST /api/detect-gaps`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`GapDetectionRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L35-L38)
- **Model Route**: Pinned lightweight `llama-3.1-8b-instant`.

### `POST /api/find-datasets-benchmarks`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`DatasetBenchmarkFinderRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L40-L44)

---

## 5. Citation Intelligence & Academic Graph

### `POST /api/citation-intelligence`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Form Data**: `file` (PDF/DOCX) or `text` (raw reference list)
- **Purpose**: Evaluates reference list via 4-stage fallback matcher (DOI $\rightarrow$ Exact $\rightarrow$ Title $\rightarrow$ Loose) against Semantic Scholar and Crossref APIs.
- **Success Response (200 OK)**: [`CitationIntelligenceResponse`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py#L119-L125)

### `POST /api/citation-intelligence/stream`
- **Auth**: Required (via query param `?token=` or header)
- **Rate Limit**: 10 req/min
- **Content-Type**: `text/event-stream` (Server-Sent Events)
- **Purpose**: Streams real-time reference matching progress step-by-step.

---

## 6. Autonomous Agent Mode & MCP Protocol

### `POST /api/agent/task`
- **Auth**: Required
- **Rate Limit**: 10 req/min
- **Pydantic Model**: [`CreateTaskRequest`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/routers/agent.py#L21-L23)
- **Request Payload**:
```json
{
  "goal": "Literature review on graph neural networks for drug discovery and 3 research gaps"
}
```
- **Success Response (200 OK)**:
```json
{
  "task_id": "d8e3b1a0-5c62-4b71-9f3b-82194a2b901e",
  "status": "running",
  "goal": "Literature review on graph neural networks..."
}
```

### `GET /api/agent/task/{task_id}/stream`
- **Auth**: Required
- **Content-Type**: `text/event-stream` (SSE)
- **Purpose**: Streams live turn-by-turn ReAct agent steps (`thought`, `action`, `observation`, `completed`).

### `GET /api/agent/task/{task_id}`
- **Auth**: Required
- **Purpose**: Retrieves final status, step history, and generated markdown report.

### `POST /api/agent/task/{task_id}/cancel`
- **Auth**: Required
- **Purpose**: Cancels an active autonomous agent task process.

---

## 🔌 Model Context Protocol (MCP) Server

PaperLens AI tools are exposed via a standard Model Context Protocol (MCP) server in [`backend/app/services/agents/mcp_server.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/mcp_server.py).

### Protocol Specifications
- **Transport**: Stdio / JSON-RPC 2.0
- **Supported Tools**: `search_papers`, `search_workspace_vector_db`, `plan_experiment`, `generate_problems`, `find_datasets`.
