# Paper Analyzer: Complete Workflow Documentation

**Purpose:** Upload research papers (PDF/DOCX) and receive AI-powered structured analysis with follow-up Q&A capability.

---

## Architecture Overview

```
User Interface (Frontend)
    ↓
    ├─ File Upload → /api/analyze
    ├─ Follow-up Questions → /api/ask
    └─ Real-time Chat Responses
    
Backend Processing Pipeline
    ├─ Document Validation & Parsing
    ├─ Semantic Chunking & Indexing
    ├─ LLM-based Structured Analysis
    └─ Retrieval-Augmented Q&A
    
Output Layers
    ├─ Markdown Analysis (6 sections)
    ├─ Page Citations & Metrics
    └─ Conversational Follow-ups
```

---

## 1. Frontend Request Lifecycle

**File:** `frontend/src/pages/PaperAnalyzer.tsx`

### 1.1 Upload Phase
- User selects PDF or DOCX file via drag-drop or file picker
- Frontend shows progress with 4 processing steps:
  1. Uploading file
  2. Extracting sections
  3. Generating analysis
  4. Finalizing result
- Multipart form data sent to `/api/analyze` with auth headers

### 1.2 Response Handling
- **Success:** Returns `{ result, doc_id }`
  - `result`: Markdown-formatted analysis
  - `doc_id`: Unique document identifier for Q&A
- **Error (413):** File too large → Professional error toast displayed
- **Caching:** If same file uploaded again (same filename + size), returns cached analysis immediately

### 1.3 Chat Phase
- User can ask follow-up questions about the paper
- Each question sent to `/api/ask` with:
  - `question`: User query string
  - `doc_id`: Document identifier from analysis phase
- AI responses rendered inline with markdown formatting

### 1.4 UX Enhancements
- Markdown normalization ensures clean heading display (fixes glued heading issue)
- Page citations formatted as `[Page X]` for traceability
- Chat messages cached in component state for context continuity

---

## 2. Data Retrieval Flow

### 2.1 Document Parsing
**File:** `backend/app/services/parsing.py`

**Input:** PDF or DOCX file  
**Output:** List of page objects with text content

#### PDF Processing
```python
extract_pdf_pages(file_path) → List[{"page": int, "text": str}]
```
- Uses PyPDF library to extract text page-by-page
- Honors limits: `MAX_PAGES`, `MAX_TOTAL_CHARS`
- Raises `ParsingLimitError` if limits exceeded

#### DOCX Processing
```python
extract_docx_pages(file_path) → List[{"page": int, "text": str}]
```
- Uses python-docx to extract text
- Treats paragraphs as continuous text blocks
- Same limit enforcement as PDF

**Limits (Configurable):**
- `MAX_PAGES`: 100 (prevent memory overload)
- `MAX_TOTAL_CHARS`: 500,000 (prevent tokenization cost)
- `MAX_UPLOAD_MB`: 25 (file size cap)

### 2.2 Semantic Chunking
**File:** `backend/app/services/chunking.py`

**Input:** List of pages with full text  
**Output:** List of semantic chunks with metadata

```python
chunk_text_semantic(pages) → List[{
    "text": str,
    "page": int,
    "chunk_id": int,
    "start_char": int,
    "end_char": int
}]
```

**Strategy:**
1. Join all pages into document text
2. Split by sentences (preserves meaning)
3. Group sentences into chunks (~300-500 chars)
4. Add overlap (~50 chars) between adjacent chunks for context continuity
5. Cap total chunks at `MAX_CHUNKS` (default: 500)

**Why Semantic Chunking?**
- Preserves sentence boundaries (don't split mid-sentence)
- Overlap ensures context isn't lost at chunk boundaries
- Dense vector retrieval later performs better with sentence-aware chunks

### 2.3 Retrieval Index Building
**File:** `backend/app/services/retrieval.py`

**Input:** Semantic chunks  
**Output:** BM25 index + optional FAISS vector index

```python
build_vector_store(chunks) → (faiss_index, bm25_index)
```

#### Sparse Index (BM25)
- Always enabled
- Keyword-based matching (fast, no embeddings needed)
- Good for explicit terminology matching

#### Dense Index (FAISS)
- Optional: `ENABLE_VECTOR_RETRIEVAL=true`
- Uses sentence-transformers embeddings
- Semantic similarity matching
- Requires more RAM (~2GB for 1000+ chunks)

**On Low-Memory Hosts:**
- Keep `ENABLE_VECTOR_RETRIEVAL=false`
- Rely on BM25 only
- BM25-only still provides good recall for Q&A

---

## 3. Data Processing & Analysis

### 3.1 LLM Analysis Generation
**File:** `backend/app/services/llm.py` → `analyze_paper(chunks)`

**Input:** Semantic chunks with full document context  
**Output:** Structured markdown analysis

#### Processing Steps:

**Step 1: Context Sampling**
```python
summary_chunks = sample_chunks_evenly(chunks, 3)
```
- Uniformly sample 3 chunks from start, middle, end
- Use for overview summary

**Step 2: Section-Specific Keyword Retrieval**
```python
pick_chunks_by_keywords(chunks, keywords, max_chunks=2)
```
- Problem Statement: Keywords = ["problem", "challenge", "motivation", "objective"]
- Methodology: Keywords = ["method", "approach", "model", "architecture"]
- Results: Keywords = ["result", "evaluation", "experiment", "performance"]
- Limitations: Keywords = ["limitation", "drawback", "constraint"]
- Future Work: Keywords = ["future work", "extension", "next step"]

Each section gets up to 2 most relevant chunks.

**Step 3: Metric Extraction**
```python
extract_metrics(chunks) → List[str]
```
- Regex patterns for numerical metrics:
  - `MAE: 0.45`
  - `MAPE: 12.3%`
  - `RMSE: 156`
  - `Parameters: 250M`
  - Duration metrics
- Up to 4 unique metrics extracted from document

**Step 4: Prompt Construction**
Groq LLM receives:
- Summary context (3-chunk overview)
- Problem Statement context (up to 2 chunks)
- Methodology context (up to 2 chunks)
- Results context + top 4 metrics
- Limitations context (if available)
- Future Work context (if available)

**Prompt Syst Note:**
```
You write strict markdown research summaries.
Never add a title before the first required heading.
```

**Step 5: Response Enforcement**
```python
enforce_strict_analysis_format(response_text)
```
- Removes any title/preface before first `## Summary`
- Fixes glued headings (e.g., `Text## Heading` → `Text\n\n## Heading`)
- Ensures space after heading markers

#### Output Format
```markdown
## Summary
[Overview of paper contribution]

## Problem Statement
[What gap/challenge does this paper address?]

## Methodology
[How did they approach it?]

## Results
- Metric: Value
- Metric: Value
[Narrative of findings]

## Limitations
[Constraints or edge cases]

## Future Work
[Proposed next steps]
```

**Rules:**
- Each section starts fresh
- Explicit metrics listed as bullets
- All explicit claims cite page numbers: `[Page 5]`
- Missing sections labeled `Inferred:` when context unavailable
- Total output ~500-1000 tokens

### 3.2 In-Memory Caching
**File:** `backend/app/services/cache.py`

```python
store_doc(doc_id, {
    "chunks": chunks,
    "vector_index": faiss_index,
    "bm25_index": bm25_index,
    "analysis": result,
    "filename": filename
})
set_active_doc(doc_id)
```

**Cache Behavior:**
- In-memory only (lost on restart)
- Active doc is process-local
- `MAX_CACHED_DOCS=1` means each new analysis evicts the previous one
- Re-uploading same file returns cached analysis instantly

### 3.3 Database Persistence
```python
db_doc = Document(id=doc_id, user_id=user_id, filename=file.filename, ...)
db_activity = Activity(user_id=user_id, action_type="analyze_paper", ...)
```

- Stores document metadata (not chunks, not analysis, too large)
- Logs user activity for analytics
- Enables document history retrieval

---

## 4. Q&A Retrieval-Augmented Generation

### 4.1 Question Routing
**File:** `backend/app/services/llm.py` → `answer_question(question)`

**Special Intent Detection:**
1. **Page Count Queries:** "How many pages...", "Total pages..."
   - Returns: `get_total_pages()` from cached chunks
2. **Author Queries:** "Who are the authors...", "Authors..."
   - Returns: First page snippets where author names likely appear
3. **Limitation Queries:** "What are the limitations..."
   - Returns: Limitations section or inferred common limitation patterns

**Default Path:** General Q&A via retrieval

### 4.2 Chunk Retrieval
```python
search_chunks(question) → List[chunks_ranked_by_relevance]
```

**Retrieval Strategy:**
1. **BM25 Scoring:** Always active
   - Term frequency matching
   - Fast, no embeddings
2. **Dense Scoring (Optional):** If `ENABLE_VECTOR_RETRIEVAL=true`
   - Sentence-transformer embeddings for both question and chunks
   - Cosine similarity matching
   - Semantic relevance > exact keyword match
3. **Reranking (Optional):** If `ENABLE_RERANKER=true`
   - Fine-tuned cross-encoder ranks results
   - Most accurate but slowest

**Return:** Top 3-5 most relevant chunks with page context

### 4.3 Answer Generation
```python
client.chat.completions.create(
    model=settings.MODEL_NAME,
    messages=[{"role": "user", "content": grounded_prompt}]
)
```

**Prompt Template:**
```
You are a research assistant.

Answer the question using the research paper context.

Rules:
- If answer not present, provide brief inferred response labeled "Inferred:".
- Cite page numbers like [Page 5] for explicit claims.
- Be concise and academic.

Context:
[Retrieved chunks with [Page X] labels]

Question:
[User query]
```

**Response Constraints:**
- Max ~300 tokens
- Grounded in retrieved context
- Page citations preserved
- Falls back to "Not mentioned in the paper" if retrieval empty

---

## 5. Visualization & UX

### 5.1 Analysis Rendering
- **Framework:** React with Framer Motion
- **Markdown Parser:** `react-markdown` with custom component styling
- **Headings:** Color-coded by level (h1, h2, h3)
- **Page Citations:** Displayed as-is in markdown, formatted as `[Page X]`

### 5.2 Chat UI
- **Layout:** Paper analysis on left (scrollable), chat sidebar on right (sticky)
- **Message Display:**
  - User messages: Right-aligned, secondary background
  - AI messages: Left-aligned, markdown-rendered
  - Loading state: Animate dots while generating
- **Input:** Bottom text field with Send button

### 5.3 Error Handling
- **413 Payload Too Large:** Show professional warning with file size recommendations
- **Parsing Timeout:** Graceful fallback with "Could not extract text"
- **LLM Timeout:** Show "Analysis failed" with retry option
- **Network Error:** Toast notification with error details

---

## 6. Configuration & Limits

**File:** `backend/app/core/config.py`

| Config | Default | Purpose |
|--------|---------|---------|
| `MAX_PAGES` | 100 | Page limit to prevent parsing overload |
| `MAX_TOTAL_CHARS` | 500,000 | Total character limit |
| `MAX_UPLOAD_MB` | 25 | Maximum file size in MB |
| `MAX_CHUNKS` | 500 | Maximum chunks after semantic split |
| `MAX_CACHED_DOCS` | 1 | Concurrent cached documents |
| `ENABLE_VECTOR_RETRIEVAL` | false | Use FAISS dense indexing |
| `ENABLE_RERANKER` | false | Use cross-encoder reranking |
| `MODEL_NAME` | "mixtral-8x7b-32768" | Groq LLM model |

---

## 7. Failure Modes & Recovery

| Scenario | Root Cause | User Experience | Recovery |
|----------|-----------|-----------------|----------|
| Upload fails | File > MAX_UPLOAD_MB | Error toast with file size limit | Re-upload smaller file |
| Parsing fails | Corrupt PDF / Unsupported format | "Could not extract text" error | Try different file format |
| Analysis timeout | Large doc + slow LLM | Spinner loops indefinitely | Backend timeout returns 504 |
| Chunk retrieval fails | Empty/None chunks | Q&A returns "Not mentioned" | (Expected behavior) |
| Cache eviction | New upload with MAX_CACHED_DOCS=1 | Previous doc_id loses context | Re-upload same file or keep browser open |
| Low-memory crash | Dense embeddings + large doc | Backend 500 error | Disable `ENABLE_VECTOR_RETRIEVAL` |

---

## 8. Performance Characteristics

| Operation | Time | Memory | Notes |
|-----------|------|--------|-------|
| PDF Parse (10 pages) | ~1-2s | 50MB | Depends on PDF complexity |
| Chunking (500 chunks) | ~0.5s | 30MB | Sentence-aware split |
| Index Build (BM25 only) | ~0.2s | 20MB | Very fast, linear |
| Index Build (+ FAISS) | ~5-10s | 500MB | Embedding compute intensive |
| LLM Analysis | ~3-5s | 100MB | Groq API latency dominant |
| Q&A Retrieval | ~0.5-1s | 50MB | BM25 retrieval + LLM gen |

---

## 9. Streaming Endpoints (Available)

Alternative endpoints for real-time token-by-token experience:
- `POST /api/analyze_stream` – Streams analysis tokens as generated
- `POST /api/ask_stream` – Streams Q&A answer tokens

Current frontend uses non-stream endpoints, but streaming routes available for future UX enhancements.

---

## 10. Summary

1. **User uploads paper** → Frontend sends multipart to `/api/analyze`
2. **Backend parses & chunks** → Validates size, extracts pages, semantically chunks with overlap
3. **Indexes built** → BM25 + optional FAISS vector index stored in-memory
4. **LLM generates analysis** → Structured 6-section markdown with citations and metrics
5. **Analysis cached** → Stored in-memory and persisted to DB
6. **User asks questions** → Routed through special intent detection or retrieval-augmented Q&A
7. **Grounded answers** → Retrieved chunks + LLM generation with page citations
8. **Chat continues** → Q&A loop until user moves to new paper or logs out

**Key Strengths:**
- Fast retrieval via BM25 + optional semantic search
- Grounded analysis with page citations
- Structured output enforced via prompt engineering
- In-memory caching eliminates re-processing

**Key Constraints:**
- Single cached document in-memory (lost on restart)
- Large files require disabled vector retrieval
- Q&A limited to document context (no external knowledge)
