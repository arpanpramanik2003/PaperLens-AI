# 📄 Paper Analyzer (PaperLens AI) — Exhaustive Architecture & Step-by-Step Workflow Guide

<p align="center">
  <img src="https://img.shields.io/badge/Pipeline-RAG--Powered%20Paper%20Analyzer-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Paper Analyzer Pipeline" />
  <img src="https://img.shields.io/badge/PDF_Parser-PyMuPDF%20(fitz)-red?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="PyMuPDF" />
  <img src="https://img.shields.io/badge/Vector_DB-Supabase%20pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase pgvector" />
  <img src="https://img.shields.io/badge/LLM-Groq%20Llama--3.1--8B-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq Llama 3.1 8B" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
</p>

---

> [!IMPORTANT]
> **Why PaperLens AI Maintains Two Distinct Pipelines**
>
> PaperLens AI features two complementary paper processing architectures tailored to different operational needs:
>
> 1. **Legacy In-Memory Pipeline (`POST /api/analyze` → `doc_id`)**:
>    - **Purpose**: Ultra-fast, zero-database, single-session paper analysis and instant follow-up chat.
>    - **Why it exists**: Users frequently want to analyze a single PDF immediately without waiting for database writes or polluting remote storage. It executes in-memory semantic sentence chunking, BM25 keyword indexing, and local FAISS vector search. `doc_id` is derived deterministically from `SHA256(filename:size)[:12]`.
>
> 2. **Persistent RAG Pipeline (`POST /api/upload-paper` → `paper_id`)**:
>    - **Purpose**: Multi-session document management, persistent map-reduce summarization, and cross-session retrieval.
>    - **Why it exists**: Users need uploaded papers and vector embeddings to persist across server restarts, page refreshes, and backend deployments. It uses token-aware chunking (`tiktoken`) and upserts 384-dimensional embeddings (`all-MiniLM-L6-v2`) into remote **Supabase pgvector** PostgreSQL tables (`paper_chunks`), enabling persistent Map-Reduce summaries (`GET /api/summarize/{paper_id}`).

---

## 🏗️ 1. Complete Architecture & System Data Flow

```mermaid
flowchart TD
    subgraph FrontendGateway ["💻 Frontend Gateway (PaperAnalyzer.tsx)"]
        UI1["📁 Drag & Drop PDF / DOCX Upload"]
        UI2["⚡ Progress Stepper UI (4 Processing Stages)"]
        UI3["📊 Render 6-Section Structured Analysis"]
        UI4["💬 Interactive Grounded Q&A Drawer"]
    end

    subgraph FastAPIRoutes ["⚡ FastAPI Endpoint Gateway (routes.py)"]
        R1["POST /api/analyze (Legacy In-Memory)"]
        R2["POST /api/upload-paper (Persistent pgvector)"]
        R3["GET /api/summarize/{paper_id} (Map-Reduce)"]
        R4["POST /api/ask (Grounded Follow-up Q&A)"]
    end

    subgraph ParsingEngine ["⚙️ Memory-Safe Document Parsing (parsing.py)"]
        P1["PyMuPDF Generator (extract_pdf_pages_generator)"]
        P2["python-docx (DOCX Container Validation)"]
        P3["Title & Header Detection (_detect_paper_title)"]
        P4["Safety Limit Audit (MAX_PAGES = 50, MAX_TOTAL_CHARS = 150k)"]
    end

    subgraph IndexingPipeline ["📊 Dual Chunking & Retrieval Index"]
        subgraph LegacyIndex ["In-Memory Pipeline"]
            I1["Semantic Sentence Chunker (char + sentence window)"]
            I2["BM25 Keyword Index (rank_bm25)"]
            I3["Local FAISS Vector Index (IndexFlatL2)"]
            I4["In-Memory Cache Dict (store_doc)"]
        end
        subgraph VectorDBIndex ["Persistent pgvector Pipeline"]
            I5["Token-Aware Chunker (tiktoken 512-tokens)"]
            I6["Embedding Model (all-MiniLM-L6-v2)"]
            I7["⚡ Remote Supabase pgvector (paper_chunks table)"]
        end
    end

    subgraph LLMInference ["🧠 LLM Orchestration & Model Routing (model_fallback.py)"]
        M1["Groq: llama-3.1-8b-instant (Pinned Light Route)"]
        M2["Completion Token Cap (1200 Tokens)"]
        M3["Map-Reduce Summarization Pipeline"]
    end

    UI1 -->|Multipart Form + Clerk JWT| R1
    UI1 -->|Multipart Form + Clerk JWT| R2
    R1 --> P1 & P2 --> P3 --> P4
    R2 --> P1 & P2 --> P3 --> P4
    P4 -->|Legacy Branch| I1 --> I2 & I3 --> I4 --> M1
    P4 -->|pgvector Branch| I5 --> I6 --> I7 --> M3
    M1 --> UI3
    UI4 -->|POST /api/ask| R4
    R4 -->|Retrieval lookup| I2 & I3
    R4 -->|Retrieval lookup| I7
    I2 & I3 & I7 --> M1 --> M2 --> UI4
```

---

## 🔄 2. Complete Step-by-Step Workflow: From File Upload to Grounded Chat

The end-to-end paper analysis lifecycle consists of 9 distinct, deterministic steps:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as PaperAnalyzer.tsx
    participant Routes as routes.py
    participant Parser as parsing.py
    participant Chunker as chunking.py / retrieval.py
    participant Cache as cache.py / Supabase
    participant LLM as Groq (llama-3.1-8b-instant)

    User->>Frontend: 1. Selects or Drag-Drops PDF/DOCX File
    Frontend->>Frontend: 2. Validates extension & starts 4-stage UI stepper
    Frontend->>Routes: 3. POST /api/analyze (Multipart Form + Authorization: Bearer JWT)
    Routes->>Parser: 4. Extract pages & detect title (_detect_paper_title)
    Parser->>Parser: 5. Verify safety limits (Pages <= 50, Chars <= 150k)
    Parser-->>Routes: List of page objects [{"page": 1, "text": "..."}]
    Routes->>Chunker: 6. Chunk text & build BM25 + FAISS index
    Routes->>Cache: 7. Cache doc in-memory (doc_id = SHA256[:12])
    Routes->>LLM: 8. Send build_analysis_prompt (llama-3.1-8b-instant, max 1200 tokens)
    LLM-->>Routes: Structured Markdown Analysis (6 Sections)
    Routes-->>Frontend: 9. Returns { result, doc_id }
    Frontend->>User: Renders Analysis & enables Interactive Q&A Drawer

    User->>Frontend: 10. Types question ("What is the baseline dataset?")
    Frontend->>Routes: 11. POST /api/ask { question, doc_id }
    Routes->>Cache: Retrieve cached BM25/FAISS index
    Cache-->>Routes: Top-K retrieved chunks with page numbers
    Routes->>LLM: Grounded QA prompt with retrieved context
    LLM-->>Routes: Answer with explicit [Page X] citations
    Routes-->>Frontend: Returns { answer }
    Frontend->>User: Renders grounded response in chat history
```

---

### Step 1: User File Selection & Client Validation
- The user drags and drops or browses a `.pdf` or `.docx` file in `PaperAnalyzer.tsx`.
- Client validates extension and sets up component reactive state (`loading = true`, `currentStep = 1`).

### Step 2: Multipart Form Transmission with Auth
- Frontend calls `apiClient.fetch("/api/analyze")` passing multipart payload `file`.
- Authorization header attaches Clerk JWT token (`Authorization: Bearer <token>`).

### Step 3: Document Parsing & Safety Audit (`parsing.py`)
- **PDF Extraction**: `extract_pdf_pages_generator(file_path)` yields page dictionaries `{"page": int, "text": str}` sequentially via `PyMuPDF` (`fitz`).
- **DOCX Validation**: `extract_docx_pages(file_path)` inspects ZIP container signatures. Malformed files immediately trigger `INVALID_DOCUMENT_FORMAT` (`400 Bad Request`).
- **Limit Enforcement**:
  - `MAX_PAGES = 50`: If exceeded, throws `PaperTooLengthyError` (`413 Payload Too Large`).
  - `MAX_TOTAL_CHARS = 150,000`: Protects against token overflow.

### Step 4: Title & Structural Section Detection
- `_detect_paper_title(pages)` inspects the first two pages to locate the main paper title, filtering out headers, metadata, affiliations, and journal names.
- `_filename_to_title(filename)` provides a clean fallback if text-based title detection fails.

### Step 5: Chunking & Index Generation
- **Legacy In-Memory Pipeline**:
  - `chunk_text_semantic(pages)` splits text into sliding windows (`token_count ~ 256`, `overlap = 32`).
  - Builds BM25 keyword index (`rank_bm25.BM25Okapi`) and FAISS dense vector index (`faiss.IndexFlatL2`).
- **Persistent pgvector Pipeline**:
  - `chunk_text_semantic` or token-aware chunker builds 512-token chunks with 64-token overlap.
  - Embeddings generated via `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) and upserted to remote Supabase PostgreSQL `paper_chunks` table.

### Step 6: Document In-Memory Caching (`cache.py`)
- `doc_id` is computed deterministically via `hashlib.sha256(f"{filename}:{filesize}".encode()).hexdigest()[:12]`.
- `store_doc(doc_id, doc_data)` caches pages, text, chunks, BM25 index, and analysis in Python global memory. Re-uploading the same file returns cached analysis instantly in 0ms!

### Step 7: LLM Analysis Generation (`analysis.py` / `model_fallback.py`)
- `build_analysis_prompt(text, title)` injects raw text into a 6-section prompt.
- Executes via `create_completion_with_fallback` pinned to `llama-3.1-8b-instant`.
- `PAPER_ANALYZER_MAX_TOKENS = 1200` caps output length to prevent Groq TPM 413 rate-limit errors.

### Step 8: Markdown Rendering & Citation Normalization
- Analysis rendered in frontend using `ReactMarkdown`.
- Page citations normalized as `[Page X]` for clear traceability.

### Step 9: Interactive Grounded Q&A Loop (`POST /api/ask`)
- User enters follow-up question in the Q&A drawer.
- `POST /api/ask` receives `{ "question": "...", "doc_id": "..." }`.
- Backend retrieves cached `doc_id`, performs hybrid BM25 + FAISS search for top-K matching chunks, and injects context into LLM prompt.
- LLM outputs grounded answer with page citations (e.g., *"The model achieved 94.2% accuracy on the ISIC dataset [Page 4]."*).

---

## 📊 3. Deep Dive: Legacy In-Memory vs. Persistent pgvector Pipelines

```mermaid
classDiagram
    class LegacyPipeline {
        +doc_id: str (SHA256 12-char)
        +BM25Index: rank_bm25.BM25Okapi
        +FAISSIndex: faiss.IndexFlatL2
        +memory_cache: dict
        +search_bm25(query, top_k)
        +search_faiss(query, top_k)
        +advantages: Instant zero-DB latency, zero storage overhead
        +disadvantages: Volatile (resets on backend restart)
    }
    
    class PersistentRAGPipeline {
        +paper_id: str (UUID)
        +embedding_model: all-MiniLM-L6-v2
        +pgvector_table: paper_chunks
        +match_chunks_rpc()
        +map_reduce_summarize()
        +advantages: Persistent across restarts, multi-session RAG
        +disadvantages: Network latency to Supabase DB
    }

    LegacyPipeline <|-- Main_Paper_Analyzer_Page
    PersistentRAGPipeline <|-- Multi_Session_Workspace
```

### Detailed Pipeline Comparison

| Feature | Legacy In-Memory Pipeline (`/api/analyze`) | Persistent RAG Pipeline (`/api/upload-paper`) |
|---|---|---|
| **Primary Route** | `POST /api/analyze` | `POST /api/upload-paper` |
| **Identifier Type** | `doc_id` (12-char hash: `SHA256(filename:size)[:12]`) | `paper_id` (Database UUID primary key) |
| **Storage Location** | Python process memory global dictionary (`cache.py`) | Supabase PostgreSQL `paper_chunks` (`pgvector`) |
| **Chunking Strategy** | Semantic sentence sliding window (256 tokens) | Fixed token-aware chunking (`tiktoken` 512 tokens) |
| **Search Engine** | Hybrid BM25 (`rank_bm25`) + Local FAISS (`IndexFlatL2`) | Remote Supabase RPC `match_chunks` (Cosine `<=>`) |
| **Summarization** | Single-pass structured 6-section LLM prompt | Multi-stage Map-Reduce pipeline (`/api/summarize/{paper_id}`) |
| **Persistence** | Volatile (cleared when Uvicorn restarts) | **Persistent** (survives restarts, redeployments) |
| **Latency** | **Sub-second (Instant)** | ~1.5s - 3s (Network DB roundtrips) |

---

## 🧠 4. Model Routing & TPM Rate-Limit Protection

Paper Analyzer relies on Groq's high-speed inference engine with strict routing and token safeguards:

> [!NOTE]
> **Pinned Light Model Route**
> To ensure low latency and save token quota for heavy workflows (such as Agent Mode and Experiment Planner), Paper Analyzer is hard-pinned to `llama-3.1-8b-instant`.

```python
# Model Routing Configuration in model_fallback.py
LIGHT_PRIMARY_MODEL = "llama-3.1-8b-instant"
PAPER_ANALYZER_MAX_TOKENS = 1200
PAPER_ANALYZER_SUMMARY_MAX_TOKENS = 320
```

### Token Overflow Safeguards
1. **Input Length Audit**: `_raise_if_paper_too_lengthy` halts processing before calling Groq if pages > 50 or total characters > 150,000.
2. **Completion Token Cap**: Caps completion tokens at 1,200, eliminating HTTP 413 "Tokens Per Minute (TPM) limit exceeded" errors.

---

## 💬 5. Grounded Q&A Prompt Engineering & Strict Attribution

When handling follow-up queries via `POST /api/ask`, the system enforces zero-hallucination grounding:

```mermaid
flowchart LR
    UserQ["User Question"] --> Search["Hybrid BM25 + FAISS Search"]
    Search --> Chunks["Top 3-5 Relevant Text Chunks + Page Numbers"]
    Chunks --> Prompt["System Prompt: 'Answer ONLY using provided chunks. Cite [Page X]'"]
    Prompt --> LLM["Groq Llama-3.1-8B"]
    LLM --> Response["Attributed Response with Page Citations"]
```

### System Grounding Prompt
```text
You are an expert academic assistant. Answer the user's question strictly using the provided paper context chunks below.
Every factual assertion MUST cite its exact page number in the format [Page X].
If the answer cannot be found in the provided context, reply exactly:
"Based on the provided document, this information is not mentioned."
```

---

## 🔐 6. Security & Credentials Setup

> [!WARNING]
> Ensure all API keys are configured in your deployment environment variables and never committed to source control.

### Required Backend Environment Variables (`backend/.env`)
```env
# Supabase PostgreSQL Vector Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk Authentication & Groq LLM
CLERK_SECRET_KEY=sk_test_[CLERK_SECRET_KEY]
GROQ_API_KEY=gsk_[GROQ_API_KEY]
```

### Frontend Environment Variables (`frontend/.env.local`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[CLERK_PUB_KEY]
VITE_API_URL=http://localhost:8000
```
