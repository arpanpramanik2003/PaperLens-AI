# Backend Guide

This backend exposes the document analysis and grounded question answering API for PaperLens AI.

## Stack

- FastAPI
- Uvicorn
- Groq Python SDK
- sentence-transformers
- FAISS CPU
- rank-bm25
- pdfplumber
- python-docx

## Directory Layout

```text
backend/
|-- app/
|   |-- api/
|   |-- core/
|   |-- models/
|   `-- services/
|-- requirements.txt
|-- uploads/
|-- .env.example
`-- README.md
```

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Dependencies are pinned in requirements.txt and configured to use CPU-only PyTorch wheels, which is better for Render prototype deployments.

Add your Groq API key to the created .env file.

## Run

```powershell
cd backend
uvicorn app.main:app --reload
```

Default local URL:

- http://localhost:8000

## Deployment (Render)

The backend is configured for deployment on [Render](https://render.com/) via the `render.yaml` file in the project root.

1. Create a new **Blueprint** service on Render.
2. Connect your GitHub repository.
3. Configure environment variables in the Render dashboard:
   - `DATABASE_URL`
   - `CLERK_SECRET_KEY`
   - `GROQ_API_KEY`

## Useful endpoints

- GET /health
- POST /api/analyze
- POST /api/analyze_stream
- POST /api/ask
- POST /api/ask_stream

## Configuration

Environment variables are loaded in app/core/config.py.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| GROQ_API_KEY | Yes | empty | Authentication for Groq API |
| GROQ_MODEL | No | llama-3.1-8b-instant | Chat model used for analysis and Q and A |
| EMBEDDING_MODEL | No | all-MiniLM-L6-v2 | Dense embedding model |
| RERANKER_MODEL | No | cross-encoder/ms-marco-MiniLM-L-6-v2 | Reranking model |
| UPLOAD_FOLDER | No | uploads | Temporary uploaded file storage |
| CHUNK_SIZE | No | 1200 | Chunk size in characters |
| CHUNK_OVERLAP | No | 220 | Overlap between chunks |
| TOP_K | No | 5 | Final number of retrieved chunks |
| MAX_UPLOAD_MB | No | 12 | Reject files above this upload size |
| MAX_PAGES | No | 12 | Reject documents above this page count |
| MAX_TOTAL_CHARS | No | 120000 | Reject documents with too much extracted text |

## API Contract

### POST /api/analyze

Request:

- multipart form data
- file field name must be file

Response:

```json
{
  "result": "markdown analysis",
  "doc_id": "12charhash"
}
```

### POST /api/analyze_stream

Request:

- multipart form data
- file field name must be file

Response:

- plain text stream
- first line starts with __DOC_ID__:
- subsequent text is the streamed analysis body

### POST /api/ask

Request:

```json
{
  "question": "What results are reported?",
  "doc_id": "12charhash"
}
```

Response:

```json
{
  "answer": "..."
}
```

### POST /api/ask_stream

Request body matches /api/ask and returns a plain text stream.

## Processing Pipeline

1. Parse PDF or DOCX content.
2. Split text into sentence-aware overlapping chunks.
3. Encode chunks using sentence-transformers.
4. Build FAISS and BM25 indexes.
5. Select paper sections and metrics for analysis generation.
6. Cache the finished analysis and retrieval structures by document ID.
7. Answer follow-up questions from retrieved chunk context.

## Implementation Notes

- CORS is configured permissively for local development.
- Cache storage is in memory only.
- Uploaded files are deleted after successful processing when possible.
- The retrieval layer combines dense and sparse search before reranking.
- Some answers may include inferred content, and the prompt instructs the model to label that explicitly.

## Limitations

- No persistent database
- No authentication
- No test suite yet
- No OCR pipeline for image-only PDFs
- Model loading can increase cold-start time