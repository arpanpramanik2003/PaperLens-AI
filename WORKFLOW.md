# PaperLens AI Workflow

This document explains how PaperLens AI processes a document from upload to grounded question answering.

## End-to-End Flow

1. The frontend uploads a PDF or DOCX file to the backend.
2. The backend computes a SHA-256 hash of the file contents and derives a short document ID.
3. If the document is already cached, the stored analysis and indexes are reused.
4. If the document is new, the backend writes it temporarily to the uploads folder.
5. The parser extracts text per page from PDF files, or paragraph text from DOCX files.
6. The chunker splits text into sentence-aware chunks with overlap.
7. The retrieval layer creates dense embeddings and a BM25 index.
8. The LLM layer produces a structured paper analysis.
9. The backend stores the analysis, chunks, and retrieval indexes in memory under the document ID.
10. The frontend renders streamed markdown analysis.
11. Later questions use the same document ID to retrieve the active document context.
12. Retrieved chunks are reranked, then the LLM answers using only the selected evidence.

## Architecture

### Frontend

The React frontend provides three main interactions:

- upload a document
- render streamed analysis markdown
- submit grounded follow-up questions

The frontend uses VITE_API_URL when set, and otherwise falls back to http://localhost:8000.

### Backend

The FastAPI backend is organized by responsibility:

- api: route definitions for analyze and ask endpoints
- core: runtime settings loaded from environment variables
- models: request schemas
- services/parsing: PDF and DOCX extraction
- services/chunking: sentence splitting and overlap chunking
- services/retrieval: embeddings, FAISS search, BM25 search, reranking
- services/llm: analysis prompt construction and grounded answering
- services/cache: in-memory document and active-index storage

## Document Processing Details

### Parsing

- PDF parsing uses pdfplumber to extract text page by page.
- DOCX parsing uses python-docx and maps the entire file to a single logical page.

### Chunking

- Text is normalized and split into sentences.
- Chunks are built until they reach the configured character limit.
- A configurable overlap is carried into the next chunk to preserve context.

Default values:

- chunk size: 1200
- overlap: 220

### Retrieval Strategy

PaperLens AI uses hybrid retrieval:

- Dense semantic retrieval with SentenceTransformer embeddings and FAISS inner-product search
- Sparse lexical retrieval with BM25
- Weighted score fusion using 0.6 dense and 0.4 BM25 contribution
- Cross-encoder reranking for the candidate set

This combination improves both semantic matching and exact phrase matching.

## Analysis Generation

The backend creates a structured analysis in markdown with these sections:

- Summary
- Problem Statement
- Methodology
- Results
- Limitations
- Future Work

The implementation also attempts to:

- identify chunks likely to contain each section
- extract explicit metrics such as MAE, MAPE, RMSE, parameter counts, and timing values
- attach chunk and page citations when the context supports them
- label inferred claims when a section is not explicitly present in the extracted context

## Question Answering Behavior

For Q and A, the system:

1. Receives a question and document ID.
2. Restores the active document indexes from cache.
3. Retrieves top chunks using hybrid retrieval.
4. Builds an evidence prompt using the selected chunks.
5. Generates a concise answer with chunk and page citations when explicit evidence exists.

The backend also includes small special cases for questions about:

- total page count
- likely author lines on the first page
- limitations when explicit limitation text is missing

## Streaming Behavior

Streaming endpoints send plain text progressively to improve responsiveness:

- analyze_stream sends a header line with the generated document ID, then streams the analysis
- ask_stream streams answer tokens as they arrive from the model

The frontend listens to the response body stream and updates the UI incrementally.

## State and Caching

The current implementation stores these items in memory:

- extracted chunks
- FAISS index
- BM25 index
- completed analysis text
- filename
- active document ID

This keeps the code simple, but it also means:

- data is lost after a restart
- there is no persistence across processes
- there is no user-level isolation

## Migration Note

This project was originally started with Flask and later migrated to FastAPI plus React. The active backend is now the FastAPI app in backend/app, and the root-level requirements file is aligned to that runtime.