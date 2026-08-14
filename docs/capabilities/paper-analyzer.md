# 📄 Paper Analyzer Capability

## 1. What It Does
The **Paper Analyzer** parses uploaded academic manuscripts (PDF or DOCX) to generate a structured 6-section analysis and provides grounded Q&A over the document content. It operates via a dual-pipeline design supporting both instant zero-database single-session reads and persistent multi-session vector retrieval.

---

## 2. How It Works

```
PDF/DOCX Upload ──> PyMuPDF Generator ──> SHA256 Doc Hash ──> Dual Pipeline Branch
                                                                 │
         ┌───────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┐
         ▼                                                                                                               ▼
[In-Memory Branch: POST /api/analyze]                                                          [pgvector Branch: POST /api/upload-paper]
Sentence Windowing ──> Rank-BM25 + FAISS Index ──> Groq LLM ──> 6-Section Markdown            tiktoken Chunker ──> all-MiniLM Embeddings ──> Supabase ──> Map-Reduce Summary
```

1. **Document Parsing**: Memory-safe streaming via PyMuPDF generators in [`parsing.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/parsing.py) enforces a 50-page max limit (`MAX_PAGES`) and 150k character cap (`MAX_TOTAL_CHARS`).
2. **Dual Retrieval Routing**:
   - **In-Memory Pipeline (`POST /api/analyze`)**: Keyed by `SHA256(filename:size)[:12]` as `doc_id`. Generates `Rank-BM25` keyword indexes paired with local `FAISS-CPU` vector indexes in process memory (`cache.py`).
   - **Persistent RAG Pipeline (`POST /api/upload-paper`)**: Tokenizes via `tiktoken` (512-token chunks), embeds via `all-MiniLM-L6-v2`, and upserts vectors into Supabase's `paper_chunks` table for cross-session Map-Reduce summarization (`GET /api/summarize/{paper_id}`).
3. **Structured Synthesis**: Outputs a 6-section summary (Core Problem, Methodology, Key Innovations, Benchmarks/Results, Limitations, Future Directions) enforced via explicit XML section tags in [`analysis.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/analysis.py).

---

## 3. Example Usage

### Input Request (`POST /api/analyze`)
- **Content-Type**: `multipart/form-data`
- **Payload**: `file: gnn_drug_discovery.pdf`

### Example Response Payload
```json
{
  "result": "# Core Problem\nTraditional drug discovery pipelines suffer from high candidate screening latency...\n\n# Key Innovations\n- Equivariant Graph Convolution Engine\n- Zero-shot binding affinity estimator...",
  "doc_id": "9b7c2a10df8e",
  "page_count": 12,
  "detected_title": "Equivariant Graph Neural Networks for Molecular Binding"
}
```

---

## 4. Key Implementation Details
- **Memory Footprint Zero Bloat**: PyMuPDF generator parsing (`extract_pdf_pages_generator`) reads page streams sequentially, keeping memory consumption <200MB during heavy PDF parsing.
- **Token Cap & TPM Resilience**: Applies response token caps (1200 tokens) on `llama-3.1-8b-instant` calls to eliminate provider-side 413 token-limit errors.
- **DOCX Format Integrity**: Validates OOXML document structures via `python-docx`, returning `INVALID_DOCUMENT_FORMAT` (HTTP 400) on corrupt uploads instead of throwing unhandled parser exceptions.
