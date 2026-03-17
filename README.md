<div align="center">

# PaperLens AI

**An intelligent research paper analysis engine powered by hybrid RAG and large language models.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Groq](https://img.shields.io/badge/LLM-Groq%20API-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Upload a research paper — get a structured AI analysis in seconds and ask unlimited follow-up questions grounded in the document.

![PaperLens AI Screenshot](frontend/public/image.png)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Configuration & Tuning](#configuration--tuning)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

PaperLens AI is an end-to-end research paper intelligence tool built for academics, engineers, and students who need to extract insight from dense technical documents quickly.

Instead of reading a 30-page paper from cover to cover, you upload it — PaperLens AI automatically extracts structure, identifies the core problem, methodology, results, limitations, and future directions, and presents everything as clean, readable markdown. After the initial analysis you can ask any follow-up question and receive a grounded answer with chunk and page citations drawn directly from the paper.

The retrieval pipeline uses **hybrid search** (dense semantic embeddings + sparse BM25) followed by **cross-encoder reranking**, which significantly outperforms single-strategy retrieval for academic text where both concept matching and exact phrase matching matter.

> PaperLens AI is a local-first prototype. All document processing happens inside the backend process. No data is sent to third parties except the LLM prompt, which goes to the Groq API.

---

## Key Features

| Feature | Description |
|---|---|
| **PDF & DOCX Support** | Upload research papers in either format; text is extracted per page or per paragraph |
| **Structured Analysis** | Generates a structured breakdown: Summary, Problem Statement, Methodology, Results, Limitations, and Future Work |
| **Grounded Q&A** | Follow-up questions are answered using document context only — no hallucinated answers |
| **Hybrid Retrieval** | Combines FAISS dense semantic search with BM25 lexical search for higher recall |
| **Cross-Encoder Reranking** | A second-pass reranker selects the most relevant evidence chunks from the candidate set |
| **Streaming Responses** | Analysis and Q&A answers stream token-by-token for a low-latency user experience |
| **In-Memory Caching** | SHA-256 document hashing prevents redundant processing of the same paper |
| **Metric Extraction** | The analysis prompt explicitly targets numeric metrics (MAE, MAPE, RMSE, parameter counts, timing) |
| **Source Citations** | Responses include chunk and page citations when explicit evidence is found |

---

## System Architecture

```
+------------------------------------------------------------------+
|                        User Browser                               |
|  +------------------------------------------------------------+  |
|  |         React 19 + Vite + Tailwind CSS Frontend            |  |
|  |                                                            |  |
|  |  [Upload PDF/DOCX]  -->  [Streamed Markdown Analysis]      |  |
|  |                     -->  [Grounded Q&A Interface]          |  |
|  +------------------------------+-----------------------------+  |
+----------------------------------|--------------------------------+
                                   | HTTP / SSE (Server-Sent Events)
                                   v
+------------------------------------------------------------------+
|                   FastAPI Backend (Uvicorn)                        |
|                                                                   |
|  +----------+   +----------+   +-----------------------------+   |
|  |  Parser  |-->| Chunker  |-->|      Retrieval Layer         |   |
|  | pdfplumb |   | Sentence |   | FAISS  |  BM25  | Reranker  |   |
|  | python-  |   | aware +  |   | Dense  | Sparse |  Cross-   |   |
|  |   docx   |   | overlap  |   | Embed. | Index  |  Encoder  |   |
|  +----------+   +----------+   +------------+----------------+   |
|                                             |                     |
|  +-----------------------------+            |                     |
|  |      In-Memory Cache        |<-----------+                     |
|  | (SHA-256 keyed documents)   |                                  |
|  +-----------------------------+                                  |
|                                             |                     |
|                                             v                     |
|                                   +------------------+            |
|                                   |    LLM Layer      |            |
|                                   |  Groq API / LLM   |            |
|                                   +------------------+            |
+------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 | UI framework |
| | Vite 8 | Build tool and dev server |
| | Tailwind CSS | Utility-first styling |
| | react-markdown + remark-gfm | Streamed markdown rendering |
| **Backend** | FastAPI | Async REST and SSE API |
| | Uvicorn | ASGI server |
| | Groq Python SDK | LLM inference (low-latency) |
| **Retrieval** | sentence-transformers | Dense embedding generation |
| | FAISS (CPU) | Approximate nearest-neighbor search |
| | rank-bm25 | Sparse BM25 lexical index |
| | CrossEncoder (ms-marco) | Reranking candidate chunks |
| **Parsing** | pdfplumber | Page-by-page PDF text extraction |
| | python-docx | DOCX paragraph extraction |
| **Infra** | Vercel | Frontend hosting (prototype) |
| | Render | Backend hosting (prototype) |

---

## How It Works

The processing pipeline runs in two distinct phases: **indexing** (document upload) and **inference** (analysis or Q&A).

### Phase 1 — Document Ingestion & Indexing

```
Upload
  |
  +-> SHA-256 Hash  --> Cache Hit? --> Return cached result
  |
  +-> Parse (pdfplumber / python-docx)
  |      +-> Structured pages / paragraphs
  |
  +-> Chunk (sentence-aware sliding window)
  |      +-> chunk_size: 1200 chars
  |      +-> overlap: 220 chars
  |
  +-> Build Retrieval Indexes
         +-> SentenceTransformer embeddings --> FAISS inner-product index
         +-> BM25 tokenized corpus --> BM25Okapi index
```

### Phase 2 — Analysis or Q&A

```
Query / Analysis Request
  |
  +-> Section-aware chunk selection (for analysis)
  |      +-> Target keywords per section heading
  |
  +-> Hybrid Retrieval
  |      +-> FAISS dense search --> top-K candidates (weight: 0.6)
  |      +-> BM25 sparse search --> top-K candidates (weight: 0.4)
  |
  +-> Score Fusion (weighted sum of normalized scores)
  |
  +-> Cross-Encoder Reranking (optional, ENABLE_RERANKER=true)
  |
  +-> LLM Prompt Construction --> Groq API --> Stream tokens to client
```

### Analysis Output Sections

The structured analysis generates the following sections for every paper:

1. **Summary** — High-level abstract of the paper's contribution
2. **Problem Statement** — The specific gap or challenge being addressed
3. **Methodology** — Techniques, models, and experimental setup
4. **Results** — Key numeric findings, metrics, and comparisons
5. **Limitations** — Acknowledged weaknesses or boundary conditions
6. **Future Work** — Directions proposed by the authors

---

## Repository Structure

```text
paper_explainer/
|
+-- backend/                        # FastAPI backend
|   +-- app/
|   |   +-- api/                    # Route definitions (analyze, ask)
|   |   +-- core/
|   |   |   +-- config.py           # Environment-based settings
|   |   +-- models/                 # Pydantic request schemas
|   |   +-- services/
|   |   |   +-- cache.py            # In-memory document store
|   |   |   +-- chunking.py         # Sentence-aware sliding window chunker
|   |   |   +-- llm.py              # Groq prompt construction and streaming
|   |   |   +-- parsing.py          # PDF and DOCX text extraction
|   |   |   +-- retrieval.py        # FAISS + BM25 + reranking
|   |   +-- main.py                 # App entry point, CORS config
|   +-- .env.example                # Environment variable template
|   +-- requirements.txt            # Pinned Python dependencies (CPU torch)
|   +-- README.md                   # Backend-specific guide
|
+-- frontend/                       # React 19 frontend
|   +-- public/                     # Static assets and screenshot
|   +-- src/                        # React components and hooks
|   +-- .env.example                # Frontend environment template
|   +-- package.json
|   +-- README.md                   # Frontend-specific guide
|
+-- .gitignore
+-- .python-version                 # Pins Python 3.10.14
+-- runtime.txt                     # Render Python version pin
+-- WORKFLOW.md                     # Detailed pipeline documentation
+-- DEPLOYMENT.md                   # Vercel + Render deployment guide
+-- LICENSE
+-- README.md                       # This file
```

---

## Quick Start

### Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Python | 3.10 | 3.10.14 recommended (pinned in `.python-version`) |
| Node.js | 18.x | 20.x or 22.x LTS preferred |
| npm | 9.x | Bundled with Node.js |
| Groq API Key | — | Free tier available at console.groq.com |

> **Windows users:** All commands below use PowerShell syntax. Git Bash or WSL work equally well with minor path adjustments.

---

### Backend Setup

**1. Clone and navigate**

```powershell
git clone <your-repo-url>
cd paper_explainer
```

**2. Create and activate a virtual environment**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

> On macOS / Linux: `source .venv/bin/activate`

**3. Install dependencies**

```powershell
pip install -r requirements.txt
```

Dependencies are pinned and configured to install the CPU-only PyTorch wheel, which avoids pulling in the multi-gigabyte CUDA distribution:

```
--extra-index-url https://download.pytorch.org/whl/cpu
```

**4. Configure environment**

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and set at minimum:

```env
GROQ_API_KEY=gsk_your_key_here
```

All other variables have sensible defaults and can be left as-is for local development.

**5. Start the server**

```powershell
uvicorn app.main:app --reload
```

Verify the backend is running:

```
GET http://localhost:8000/health
-> {"status": "ok"}
```

---

### Frontend Setup

**1. Navigate to frontend**

```powershell
cd ../frontend
```

**2. Install Node dependencies**

```powershell
npm install
```

**3. Configure environment**

```powershell
Copy-Item .env.example .env
```

The only required variable is:

```env
VITE_API_URL=http://localhost:8000
```

If `VITE_API_URL` is not set, the frontend automatically falls back to `http://localhost:8000`.

**4. Start the development server**

```powershell
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | _(empty)_ | API key for Groq inference |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` | Groq chat model for analysis and Q&A |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | SentenceTransformer model for dense embeddings |
| `RERANKER_MODEL` | No | `cross-encoder/ms-marco-MiniLM-L-6-v2` | CrossEncoder model for reranking |
| `UPLOAD_FOLDER` | No | `uploads` | Directory for temporary file storage |
| `CHUNK_SIZE` | No | `1200` | Maximum chunk length in characters |
| `CHUNK_OVERLAP` | No | `220` | Overlap carried from one chunk to the next |
| `TOP_K` | No | `5` | Number of final chunks passed to the LLM |
| `MAX_UPLOAD_MB` | No | `12` | Maximum accepted file size in megabytes |
| `MAX_PAGES` | No | `12` | Maximum accepted page count |
| `MAX_TOTAL_CHARS` | No | `120000` | Maximum extracted character count before rejection |
| `MAX_CHUNKS` | No | `220` | Maximum number of chunks to index |
| `EMBEDDING_BATCH_SIZE` | No | `16` | Batch size for embedding generation |
| `ENABLE_RERANKER` | No | `false` | Set to `true` to enable cross-encoder reranking |
| `MAX_CACHED_DOCS` | No | `1` | Maximum number of documents held in the in-memory cache |

### Frontend — `frontend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000` | Base URL of the FastAPI backend |

---

## API Reference

All endpoints are served from the FastAPI backend. The base URL is `http://localhost:8000` by default.

### `GET /health`

Returns the backend health status.

**Response**
```json
{ "status": "ok" }
```

---

### `POST /api/analyze`

Analyzes a document and returns the full structured markdown as a single response body.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | `File` | PDF or DOCX research paper |

**Response** — `application/json`

```json
{
  "doc_id": "a3f9c2b1",
  "analysis": "## Summary\n\n..."
}
```

---

### `POST /api/analyze_stream`

Analyzes a document and streams the structured markdown as server-sent events (SSE). Recommended over `/api/analyze` for interactive use.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | `File` | PDF or DOCX research paper |

**Response** — `text/event-stream`

Streams `data: <token>` events followed by `data: [DONE]`.

The response header also includes `X-Doc-ID` for use in subsequent Q&A requests.

---

### `POST /api/ask`

Answers a question against a previously analyzed document. Returns the full answer as a single response.

**Request** — `application/json`

```json
{
  "doc_id": "a3f9c2b1",
  "question": "What dataset was used for evaluation?"
}
```

**Response** — `application/json`

```json
{
  "answer": "The authors evaluated on the MIMIC-III dataset (Chunk 3, Page 7)."
}
```

---

### `POST /api/ask_stream`

Answers a question and streams the response as SSE. Recommended for interactive Q&A.

**Request** — `application/json`

```json
{
  "doc_id": "a3f9c2b1",
  "question": "What are the main limitations of this approach?"
}
```

**Response** — `text/event-stream`

Streams `data: <token>` events followed by `data: [DONE]`.

---

## Configuration & Tuning

### Retrieval Quality

| Parameter | Effect | Recommendation |
|---|---|---|
| `CHUNK_SIZE` | Larger chunks preserve more context per retrieval unit | Lower for precise factual Q&A, higher for synthesis tasks |
| `CHUNK_OVERLAP` | More overlap reduces edge-case context loss | Keep at ~18% of `CHUNK_SIZE` |
| `TOP_K` | More chunks = more context for the LLM, higher token cost | Start at 5; increase for complex questions |
| `ENABLE_RERANKER` | Reranking improves precision at the cost of latency | Enable for important Q&A; disable for faster prototype runs |

### Model Selection

The default `llama-3.1-8b-instant` model on Groq is optimized for speed. For more detailed analysis consider switching to `llama-3.3-70b-versatile` in your `.env`. The `GROQ_MODEL` variable accepts any model ID listed in the Groq model catalog.

### Document Size Limits

The backend enforces three guards before indexing:

- `MAX_UPLOAD_MB` — rejects the file before reading
- `MAX_PAGES` — rejects after page count is known
- `MAX_TOTAL_CHARS` — rejects after text extraction

Raising these limits may increase memory consumption and indexing latency linearly.

---

## Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for the complete guide. The recommended prototype setup is:

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Connect GitHub repo; set `VITE_API_URL` to Render backend URL |
| Backend | Render Web Service | Python 3.10.14; CPU-only wheel avoids CUDA bloat |
| LLM | Groq API | Set `GROQ_API_KEY` in Render dashboard environment |

**Render build command:**
```bash
pip install -r backend/requirements.txt
```

**Render start command:**
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

> The in-memory cache and FAISS index do not persist across Render restarts (free tier spins down). All documents must be re-uploaded after a cold start.

---

## Known Limitations

| Limitation | Impact | Notes |
|---|---|---|
| In-memory cache only | Cache resets on backend restart | Planned: persistent vector store option |
| Scanned / image-only PDFs | Text extraction returns empty or partial content | OCR integration not yet implemented |
| No authentication | Any user can query any cached document ID | Acceptable for local prototype; not for multi-user deployment |
| Synchronous indexing | Indexing happens inside the HTTP request | Large papers may cause slow initial response |
| Single-instance cache | Horizontal scaling is not supported | Each Render instance maintains its own independent cache |

---

## Roadmap

- [ ] Persistent vector store (e.g., ChromaDB or Qdrant) to survive restarts
- [ ] OCR support for scanned PDFs via Tesseract or a cloud Vision API
- [ ] Per-user document isolation with session tokens
- [ ] Background indexing with job queue to decouple upload from processing
- [ ] Multi-paper comparison mode
- [ ] Citation export (BibTeX, RIS)
- [ ] Fine-grained section detection using document heading structure

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests if applicable
4. Commit with a clear message: `git commit -m "feat: describe your change"`
5. Push and open a pull request against `main`

Please follow existing code conventions. Backend code should pass `ruff` linting. Frontend code should pass ESLint.

---

## Additional Documentation

| Document | Description |
|---|---|
| [WORKFLOW.md](WORKFLOW.md) | Deep dive into the full processing pipeline |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Cloud deployment guide for Vercel and Render |
| [backend/README.md](backend/README.md) | Backend setup, configuration, and API details |
| [frontend/README.md](frontend/README.md) | Frontend setup, scripts, and component overview |

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with FastAPI, React, and the Groq API.

</div>
