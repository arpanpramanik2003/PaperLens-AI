# Paper Analyzer LLM Flow (Upload → Analysis → Q/A)

This document explains how the Paper Analyzer works in the current PaperLens AI codebase, from file upload to grounded question-answering.

## 1) High-Level Flow

1. Frontend uploads PDF/DOCX to `POST /api/analyze`.
2. Backend validates type + size, then parses text page-wise.
3. Backend enforces limits (pages/chars/chunks) to avoid overload.
4. Text is chunked semantically (sentence-aware with overlap).
5. Retrieval indexes are built and cached with analysis output.
6. Groq LLM generates structured markdown analysis.
7. User asks follow-up questions via `POST /api/ask` using `doc_id`.
8. Backend retrieves relevant chunks and generates grounded answers.

---

## 2) Frontend Request Lifecycle

Primary UI file:
- `frontend/src/pages/PaperAnalyzer.tsx`

### Analyze
- On file select, frontend sends `multipart/form-data` (`file`) to `/api/analyze`.
- Auth header is added by `frontend/src/lib/api-client.ts`.
- Response shape:
  - `result`: markdown analysis
  - `doc_id`: active document id for chat

### Q/A
- User message is sent to `/api/ask` with JSON:
  - `question`
  - `doc_id`
- Response shape:
  - `answer`

### Error UX
- If backend returns `413` or `PAPER_TOO_LENGTHY`, frontend shows a professional warning toast/message.

---

## 3) Backend Analyze Pipeline

Main route file:
- `backend/app/api/routes.py`

Endpoint:
- `POST /api/analyze`

Detailed steps:

### Step A: Validate upload
- Accepts only `.pdf` or `.docx`.
- Checks byte size against `MAX_UPLOAD_MB`.
- Creates deterministic `doc_id` from `filename:size` SHA256 prefix.

### Step B: Cache short-circuit
- If `doc_id` already exists in in-memory cache:
  - marks it active
  - returns cached analysis immediately

### Step C: Parse document text
- PDF parsing: `extract_pdf_pages(...)` in `backend/app/services/parsing.py`
- DOCX parsing: `extract_docx_pages(...)`
- Parsing enforces:
  - `MAX_PAGES`
  - `MAX_TOTAL_CHARS`
- Violations raise `ParsingLimitError` → backend returns `413` with `code: PAPER_TOO_LENGTHY`.

### Step D: Chunking
- Uses `chunk_text_semantic(...)` in `backend/app/services/chunking.py`.
- Sentence split + overlap (`CHUNK_OVERLAP`) to preserve context continuity.
- Capped by `MAX_CHUNKS`.

### Step E: Retrieval indexes
- Built by `build_vector_store(...)` in `backend/app/services/retrieval.py`.
- Always builds BM25 sparse index.
- Dense vector index (FAISS + sentence-transformers) is optional via `ENABLE_VECTOR_RETRIEVAL`.

### Step F: LLM analysis generation
- Uses `analyze_paper(chunks)` in `backend/app/services/llm.py`.
- Internally:
  - samples summary context
  - selects section-specific chunks by keywords (problem/method/results/etc.)
  - extracts metrics with regex heuristics
  - builds structured prompt with citation expectations (`[Page X]`)
  - calls Groq chat completion

### Step G: Store active doc context
- Stores in-memory payload (`chunks`, indexes, `analysis`, filename) via `store_doc(...)`.
- Sets active doc via `set_active_doc(doc_id)` for follow-up Q/A.
- Persists activity/document metadata to database.

---

## 4) Backend Q/A Pipeline

Endpoint:
- `POST /api/ask`

Detailed steps:

1. Validates question.
2. Activates document context via provided `doc_id`.
3. Calls `answer_question(question)` in `backend/app/services/llm.py`.
4. `answer_question(...)`:
   - handles special intents (page-count / author shortcut logic), then
   - retrieves relevant chunks using `search_chunks(question)`
   - builds grounded prompt with chunk snippets and page labels
   - calls Groq to generate final concise answer

### Retrieval logic for Q/A
- Implemented in `backend/app/services/retrieval.py`.
- Current behavior:
  - BM25 always active.
  - If `ENABLE_VECTOR_RETRIEVAL=true`, combines dense + sparse scores.
  - Optional reranking if `ENABLE_RERANKER=true`.

---

## 5) Prompt Design (Current Implementation)

### Analyze prompt goals
- Force fixed sectioned output:
  - Summary
  - Problem Statement
  - Methodology
  - Results
  - Limitations
  - Future Work
- Encourage explicit metrics and page citations.
- Require “Inferred:” label when context is missing.

### Q/A prompt goals
- Answer from retrieved context only.
- Include page citations for explicit claims.
- If missing info, return short inferred response clearly labeled.

---

## 6) Memory, Limits, and Stability

Configured in:
- `backend/app/core/config.py`

Important controls:
- `MAX_UPLOAD_MB`
- `MAX_PAGES`
- `MAX_TOTAL_CHARS`
- `MAX_CHUNKS`
- `MAX_CACHED_DOCS`
- `ENABLE_VECTOR_RETRIEVAL`
- `ENABLE_RERANKER`

Why large files can fail on low-memory hosts:
- Parsing/chunking large documents can produce many chunks.
- Dense embedding models consume significant RAM.
- On 512MB instances, keeping `ENABLE_VECTOR_RETRIEVAL=false` is safer.

---

## 7) Caching Model (Important Behavior)

Cache module:
- `backend/app/services/cache.py`

Key points:
- In-memory only (lost on restart/redeploy).
- Active doc is process-local.
- With `MAX_CACHED_DOCS=1`, each new analysis evicts previous cached doc.

Implication:
- If the backend restarts, frontend may still hold a `doc_id`, but backend may not have that cached document anymore; user must re-upload.

---

## 8) Streaming Endpoints (Available)

Also implemented:
- `/api/analyze_stream`
- `/api/ask_stream`

Current frontend page uses non-stream endpoints (`/api/analyze`, `/api/ask`), but streaming routes are available for token-by-token UX.

---

## 9) Sequence Summary

```text
User Upload
  -> Frontend /api/analyze
  -> Validate + Parse + Limits
  -> Chunk + Index Build
  -> LLM Structured Analysis
  -> Cache + DB Activity
  -> Return { result, doc_id }

User Question
  -> Frontend /api/ask (question + doc_id)
  -> Activate doc context
  -> Retrieve top chunks
  -> LLM grounded answer
  -> Return { answer }
```

---

## 10) Practical Recommendations

1. Keep `ENABLE_VECTOR_RETRIEVAL=false` on low-memory deployment tiers.
2. Raise limits gradually (`MAX_PAGES`, `MAX_TOTAL_CHARS`) only after memory testing.
3. Move cache/indexes to external storage if multi-instance scaling is needed.
4. If required, switch frontend to stream endpoints for more responsive long outputs.
5. Add OCR path for scanned/image PDFs if your users upload such documents.
