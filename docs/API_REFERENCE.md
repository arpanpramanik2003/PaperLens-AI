# PaperLens AI API Reference

Base URL (local): `http://localhost:8000`

Authentication:
- Most /api/* endpoints require a valid Clerk JWT.
- Header format:

```http
Authorization: Bearer <Clerk JWT>
```

---

## 1) Health & Auth

### GET /health
- Auth: No
- Methods supported: GET, HEAD
- Response:

```json
{ "status": "ok" }
```

### GET /api/test-auth
- Auth: Yes
- Response:

```json
{ "message": "You are fully authenticated!", "user_id": "<clerk_user_id>" }
```

---

## 2) Dashboard

### GET /api/dashboard
- Auth: Yes
- Response:

```json
{
  "stats": [
    { "label": "Papers Analyzed", "value": "2", "icon": "FileText", "change": "" },
    { "label": "Experiments Planned", "value": "1", "icon": "FlaskConical", "change": "" },
    { "label": "Ideas Generated", "value": "4", "icon": "Lightbulb", "change": "" },
    { "label": "Gaps Detected", "value": "1", "icon": "ScanSearch", "change": "" },
    { "label": "Citations Analyzed", "value": "3", "icon": "BarChart3", "change": "" }
  ],
  "recentPapers": [
    { "title": "paper.pdf", "date": "2 hours ago", "status": "Analyzed" }
  ]
}
```

---

## 3) Paper Analyzer (legacy in-memory pipeline)

This is the original pipeline used by the current analyzer UI:

- Upload → parse → chunk → (optional FAISS) + BM25 → LLM analysis
- Q&A uses in-memory indexes, so it is **not persistent across backend restarts**

### POST /api/analyze
- Auth: Yes
- Content-Type: multipart/form-data
- Form fields:
  - file: required (PDF or DOCX)
- Success response:

```json
{
  "result": "## Summary\n...",
  "doc_id": "12charhash"
}
```

- Notes:
  - If same filename+size already cached in-process, cached analysis is returned.
  - doc_id is derived from SHA256(filename:size), truncated to 12 chars.

- Error examples:
  - 400: no file, invalid type, extraction failure
  - 413: too large / too many pages / too many chars

```json
{
  "error": "Paper is too lengthy ...",
  "code": "PAPER_TOO_LENGTHY"
}
```

### POST /api/analyze_stream
- Auth: Yes
- Content-Type: multipart/form-data
- Stream media type: text/plain
- First emitted line:

```text
__DOC_ID__:<doc_id>
```

- Remaining stream: incremental analysis text tokens.

---

## 4) Paper Q&A

Request schema used by both endpoints:

```json
{
  "question": "What are the key results?",
  "doc_id": "12charhash",
  "history": [
    { "role": "user", "text": "Summarize the results section." },
    { "role": "assistant", "text": "..." }
  ]
}
```

### POST /api/ask
- Auth: Yes
- Response:

```json
{ "answer": "..." }
```

### POST /api/ask_stream
- Auth: Yes
- Stream media type: text/plain
- Response: incremental answer tokens.

Validation behavior for both:
- 400 if question is empty.
- 400 if doc_id provided but not found in active in-memory cache.
- 400 if no active document exists and doc_id omitted.

---

## 5) Paper RAG (pgvector pipeline — persistent chunks)

This is the newer, memory-efficient pipeline:

- Upload → parse (PyMuPDF generator) → **token-based chunking** → embeddings → store in Supabase `pgvector`
- Q&A can use `paper_id` to retrieve relevant chunks from Supabase even after restarts

### POST /api/upload-paper
- Auth: Yes
- Content-Type: multipart/form-data
- Form fields:
  - file: required (PDF or DOCX)
- Response:

```json
{
  "paper_id": "16charhash",
  "page_count": 12,
  "chunk_count": 87,
  "status": "indexed",
  "message": "Paper uploaded and indexed successfully."
}
```

- Notes:
  - `paper_id` is deterministic per `(filename, size_bytes, user_id)` to support deduplication.
  - If already indexed, returns `status="already_indexed"` with existing chunk_count.

### GET /api/summarize/{paper_id}
- Auth: Yes
- Response:

```json
{
  "paper_id": "16charhash",
  "summary": "Unified narrative summary...",
  "chunk_count": 87
}
```

- Notes:
  - Runs **map-reduce summarization** over chunks stored in pgvector.
  - Summary is cached in memory per `paper_id` for fast repeats.

### POST /api/ask (pgvector mode)
If `paper_id` is provided, `/api/ask` switches to pgvector retrieval automatically.

```json
{
  "question": "What loss function is used?",
  "paper_id": "16charhash",
  "history": [
    { "role": "user", "text": "What is the model architecture?" },
    { "role": "assistant", "text": "..." }
  ]
}
```

Response:

```json
{ "answer": "..." }
```

---

## 6) Experiment Planner

### POST /api/plan-experiment
- Auth: Yes
- Request body:

```json
{
  "topic": "Fine-tuning BERT",
  "difficulty": "advanced"
}
```

- Response shape:

```json
{
  "steps": [
    {
      "num": 1,
      "title": "Dataset Selection",
      "iconName": "Database",
      "details": "...",
      "params": "...",
      "risks": "..."
    }
  ]
}
```

---

## 7) Problem Generator & Expansion

### POST /api/generate-problems
- Auth: Yes
- Request body:

```json
{
  "domain": "NLP",
  "subdomain": "Sentiment Analysis",
  "complexity": "high"
}
```

- Response shape:

```json
{
  "ideas": [
    {
      "title": "...",
      "desc": "...",
      "tags": ["NLP", "LLM"],
      "rating": 4
    }
  ]
}
```

### POST /api/expand-problem
- Auth: Yes
- Request body:

```json
{
  "domain": "NLP",
  "subdomain": "Sentiment Analysis",
  "complexity": "high",
  "idea": {
    "title": "...",
    "desc": "...",
    "tags": ["..."],
    "rating": 5
  }
}
```

- Response: expanded problem details JSON (generated by LLM).

---

## 8) Gap Detection

### POST /api/detect-gaps
- Auth: Yes
- Content-Type: multipart/form-data
- Supported input modes:
  - file: PDF/DOCX
  - text: plain text

At least one of file or text must be provided.

- Response shape:

```json
{
  "gaps": [
    {
      "title": "...",
      "explanation": "...",
      "severity": "low|medium|high",
      "suggestion": "..."
    }
  ]
}
```

- Error examples:
  - 400 invalid file type
  - 400 no file or text provided
  - 413 parsing limits exceeded

---

## 9) Dataset & Benchmark Finder

### POST /api/find-datasets-benchmarks
- Auth: Yes
- Request body:

```json
{
  "project_title": "Multimodal Brain Tumor Classification",
  "project_plan": "Detailed methodology and goals..."
}
```

- Validation:
  - Returns 400 if both project_title and project_plan are empty after trim.

- Response shape:

```json
{
  "domain_summary": "1-2 line summary",
  "datasets": [
    {
      "name": "Dataset name",
      "fit_score": 4.7,
      "short_description": "...",
      "best_for": ["..."],
      "details": {
        "modality": "...",
        "size": "...",
        "license": "...",
        "tasks": ["..."],
        "pros": ["..."],
        "limitations": ["..."],
        "source_hint": "..."
      }
    }
  ],
  "benchmarks": [
    {
      "name": "Benchmark name",
      "fit_score": 4.6,
      "short_description": "...",
      "details": {
        "primary_metrics": ["..."],
        "evaluation_protocol": "...",
        "baselines": ["..."],
        "what_good_looks_like": "...",
        "pitfalls": ["..."]
      }
    }
  ],
  "technologies": [
    {
      "name": "PyTorch",
      "category": "Framework",
      "reason": "...",
      "used_for": ["..."]
    }
  ]
}
```

---

## 10) Citation Intelligence

See full workflow documentation: `docs/6_CITATION_INTELLIGENCE.md`

### POST /api/citation-intelligence
- Auth: Yes
- Request: multipart/form-data
  - file: PDF or DOCX

- Behavior:
  - Extracts references from uploaded paper text.
  - Queries Semantic Scholar per extracted reference.
  - Returns references sorted by citation count in `top_cited`.
  - Includes unmatched count (`missing_count`).

- Response shape:

```json
{
  "total_references_extracted": 47,
  "references_processed": 35,
  "matched_count": 28,
  "missing_count": 7,
  "references": [
    {
      "reference_index": 1,
      "reference_text": "...",
      "matched": true,
      "paper_id": "abc123",
      "title": "Paper title",
      "year": 2020,
      "citation_count": 134,
      "url": "https://www.semanticscholar.org/...",
      "venue": "NeurIPS",
      "authors": ["Author A", "Author B"]
    }
  ],
  "top_cited": []
}
```

- Error examples:
  - 400 invalid file type
  - 413 upload/parsing limits exceeded
  - 500 Semantic Scholar API key missing on server

---

### POST /api/citation-intelligence/stream
- Auth: Yes
- Request: multipart/form-data (`file`)
- Response: Server-Sent Events (`text/event-stream`)

Event stream (each message is `data: <json>\n\n`):

- Start:

```json
{ "type": "start", "total": 35, "extracted": 47 }
```

- Progress:

```json
{ "type": "progress", "current": 8, "total": 35, "matched": true, "title": "....", "reference_text": "First 80 chars..." }
```

- Done:

```json
{ "type": "done", "matched_count": 28, "missing_count": 7, "references": [], "top_cited": [] }
```

---

### POST /api/citation-intelligence/recommendations
- Auth: Yes
- Request body:

```json
{
  "paper_context": "Optional user context...",
  "top_cited": [ { "title": "...", "authors": ["..."], "year": 2022, "citation_count": 123 } ],
  "missing_references": ["Raw ref line 1", "Raw ref line 2"],
  "recommendation_mode": "upload"
}
```

- Response (strict JSON):
  - `paper_focus` (upload mode) or `topic_focus` (discover mode)
  - `must_read`, `reading_path`, `coverage_gaps`, `next_search_queries`

---

### POST /api/citation-intelligence/discover
- Auth: Yes
- Request body:

```json
{ "project_title": "Diffusion models for medical imaging", "basic_details": "MRI segmentation", "limit": 35 }
```

- Response: same report structure as citation intelligence, but generated from topic discovery.

---

## 11) Documents

### GET /api/documents
- Auth: Yes
- Response:

```json
[
  { "id": "12charhash", "filename": "paper.pdf" }
]
```

---

## 12) Request Model Summary

Current request models in backend/app/models/schemas.py:

- AskRequest
  - question: string
  - doc_id: string | null
  - paper_id: string | null
  - history: list[dict] | null
- ExperimentPlanRequest
  - topic: string
  - difficulty: string
- ProblemGeneratorRequest
  - domain: string
  - subdomain: string
  - complexity: string
- ProblemDetailRequest
  - domain: string
  - subdomain: string
  - complexity: string
  - idea: object
- DatasetBenchmarkFinderRequest
  - project_title: string | null
  - project_plan: string | null

Note: GapDetectionRequest class exists but /api/detect-gaps currently accepts multipart form fields (file/text), not this model.

---

## 13) Limits and Controls

Key backend controls (app.core.config settings):

- MAX_UPLOAD_MB
- MAX_PAGES
- MAX_TOTAL_CHARS
- MAX_CHUNKS
- TOP_K
- CITATION_MAX_REFERENCES
- TOKEN_CHUNK_SIZE (pgvector pipeline)
- TOKEN_CHUNK_OVERLAP (pgvector pipeline)

Citation Intelligence additionally requires:

- SEMANTIC_SCHOLAR_API_KEY

When parsing/size limits are exceeded, endpoints may return 413 with descriptive error text (and PAPER_TOO_LENGTHY code for analyzer paths).
