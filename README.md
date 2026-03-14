# PaperLens AI

PaperLens AI is an AI-powered research paper explainer that accepts PDF and DOCX files, generates a structured paper analysis, and supports grounded question answering over the uploaded document.

The project is split into a React frontend and a FastAPI backend. The backend parses the document, chunks it into semantically sized passages, builds a hybrid retrieval index, and uses Groq-hosted LLM responses to produce summaries and answers with citations.

## Features

- Upload PDF and DOCX research papers
- Stream structured paper analysis to the UI
- Ask follow-up questions grounded in extracted paper content
- Hybrid retrieval using dense embeddings plus BM25
- Cross-encoder reranking for more relevant context selection
- Lightweight in-memory document cache keyed by document hash
- Simple React interface for analysis and Q&A

## Tech Stack

### Frontend

- React 19
- Vite 8
- Tailwind CSS
- react-markdown
- remark-gfm

### Backend

- FastAPI
- Uvicorn
- Groq API
- sentence-transformers
- FAISS
- rank-bm25
- pdfplumber
- python-docx

## Project Structure

```text
paper_explainer/
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- models/
|   |   `-- services/
|   |-- requirements.txt
|   `-- README.md
|-- frontend/
|   |-- src/
|   |-- package.json
|   `-- README.md
|-- requirements.txt
|-- uploads/
|-- README.md
`-- WORKFLOW.md
```

## Recommended Runtime

Use the FastAPI backend in the backend folder together with the Vite frontend in the frontend folder.

This repository has already been migrated away from the earlier Flask version. The active backend is the FastAPI app under backend/app, and the root requirements file now points to the backend requirements for convenience.

## Quick Start

### 1. Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set your Groq API key in backend/.env.

### 2. Start backend

```powershell
cd backend
uvicorn app.main:app --reload
```

Backend endpoints will be available at http://localhost:8000.

### 3. Frontend setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

### 4. Start frontend

```powershell
cd frontend
npm run dev
```

The frontend runs on the Vite development server, usually at http://localhost:5173.

## Environment Variables

### Backend

Defined in backend/.env:

- GROQ_API_KEY: required Groq API key
- GROQ_MODEL: optional, defaults to llama-3.1-8b-instant
- EMBEDDING_MODEL: optional, defaults to all-MiniLM-L6-v2
- RERANKER_MODEL: optional, defaults to cross-encoder/ms-marco-MiniLM-L-6-v2
- UPLOAD_FOLDER: optional upload temp folder, defaults to uploads
- CHUNK_SIZE: optional semantic chunk size, defaults to 1200
- CHUNK_OVERLAP: optional chunk overlap, defaults to 220
- TOP_K: optional retrieval result count, defaults to 5

### Frontend

Defined in frontend/.env:

- VITE_API_URL: backend base URL, defaults to http://localhost:8000 if omitted

## API Overview

### Health

- GET /health

Returns a simple status response.

### Analyze document

- POST /api/analyze
- POST /api/analyze_stream

Accepts a multipart upload field named file. Supported formats are PDF and DOCX.

Returns or streams:

- analysis markdown
- doc_id for caching and follow-up Q&A

### Ask questions

- POST /api/ask
- POST /api/ask_stream

JSON body:

```json
{
  "question": "What methodology does the paper use?",
  "doc_id": "optional-document-id"
}
```

## Documentation

- See WORKFLOW.md for the detailed processing pipeline and architecture notes.
- See backend/README.md for backend setup, API behavior, and implementation notes.
- See frontend/README.md for frontend development and deployment notes.

## Known Constraints

- Document state is stored in memory, so cached papers are lost when the backend restarts.
- Very large papers may be slower because embedding, reranking, and LLM summarization happen in the request lifecycle.
- Scanned PDFs without extractable text may fail or produce incomplete analysis.
- The current cache is process-local and not suitable for multi-instance deployment.

## Future Improvement Areas

- Persistent document storage and cache eviction
- Background task processing for long analyses
- Authentication and per-user document isolation
- Better OCR support for scanned documents
- Tests for API routes and service modules