# 📄 Paper Analyzer — Deep Document Analysis & Grounded Research Q&A

> **PaperLens AI Document Intelligence System**: An enterprise-grade academic manuscript parser, structured multi-section synthesizer, and grounded conversational Q&A engine. Operates via a dual-pipeline architecture supporting instant zero-database in-memory reads and persistent pgvector retrieval with page-level citation attribution.

---

## 1. Executive Summary & Request Lifecycle

The **Paper Analyzer** transforms dense academic PDFs and Word documents (`.pdf`, `.docx`) into a structured 6-section technical intelligence report and powers an interactive, cited conversational interrogation assistant.

### End-to-End Architecture & Data Flow

```mermaid
flowchart TD
    User([User Uploads PDF / DOCX]) --> UploadGateway["POST /api/analyze OR /api/analyze_stream"]
    UploadGateway --> ParseEngine["Document Parsing Engine\n(parsing.py: extract_pdf_pages / extract_docx_pages)"]
    
    ParseEngine --> TitleHeuristic["Title & Metadata Detection\n(_detect_paper_title / _sanitize_detected_title)"]
    ParseEngine --> SemanticChunker["Sentence-Aware Semantic Chunking\n(chunking.py: chunk_text_semantic)"]
    
    SemanticChunker --> DualIndex{Storage Pipeline}
    
    %% In-Memory Path
    DualIndex -->|In-Memory Cache (doc_id)| InMemIndex["Hybrid In-Memory Index\n• Dense: FAISS (IndexFlatIP)\n• Sparse: BM25 (BM25Okapi)"]
    
    %% Persistent DB Path
    DualIndex -->|Persistent Postgres (paper_id)| PgVectorIndex["PostgreSQL + pgvector\n• sentence-transformers/all-MiniLM-L6-v2\n• HNSW Cosine Vector Index"]
    
    %% Analysis Pass
    InMemIndex --> SectionSampler["Targeted Keyword Section Sampler\n• Problem Statement, Methodology\n• Results, Limitations, Future Work"]
    SectionSampler --> MetricExtractor["Regex Metric Extractor\n(MAE, RMSE, MAPE, Params, Latency)"]
    MetricExtractor --> AnalysisEngine["LLM Analysis Engine (analysis.py)\nPrimary: openai/gpt-oss-120b\nFallback: openai/gpt-oss-20b"]
    
    AnalysisEngine --> XMLEnforce["Strict XML Section Enforcer\n(enforce_strict_analysis_format)"]
    XMLEnforce --> UIAnalysis["Left Panel: 6-Section Intelligence Report\n• Executive Summary\n• Problem Statement\n• Methodology\n• Results & Metrics\n• Limitations\n• Future Work"]
    
    %% QA Path
    UserQA([User Question in Chat]) --> QAGateway["POST /api/ask\n(question, doc_id / paper_id, history)"]
    QAGateway --> HybridRetriever["Hybrid Retrieval Fusion\n(retrieval.py: search_chunks / search_pgvector_chunks)"]
    HybridRetriever --> CitationContext["Context Assembly with Page Tags\n[Page 1], [Page 4], [Page 7]..."]
    CitationContext --> QAEngine["LLM Grounded QA Engine (qa.py)\nStrict Citation Formatting & Anti-Hallucination"]
    QAEngine --> UIChat["Right Panel: Interactive Cited Chat\n• Real-Time Token Streaming\n• Clickable Page Citations\n• Table-to-Point Sanitizer"]
```

---

## 2. Core Architectural Components

### A. Document Parsing & Title Heuristics
- **High-Fidelity Extraction**: [`extract_pdf_pages`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/parsing.py) leverages PyMuPDF and pdfplumber with OCR fallbacks to preserve page coordinates, whitespace layout, and structural flow.
- **Intelligent Title Heuristics (`_detect_paper_title`)**: Scans early page lines while filtering out institutional boilerplate, university affiliations, author lists, and section headers (`"Abstract"`, `"Introduction"`, `"Department of Computer Science"`).
- **Safety Gates**: Enforces strict payload validation:
  - `MAX_UPLOAD_MB`: 25 MB max file size.
  - `MAX_PAGES`: 50 pages maximum to prevent out-of-memory crashes.
  - `MAX_TOTAL_CHARS`: Character count limits for dense multi-column manuscripts.

### B. Dual-Pipeline Hybrid Indexing & Retrieval
The analyzer implements a dual-pipeline strategy tailored for both ephemeral reads and persistent workspace storage:

| Pipeline Layer | Primary Use Case | Dense Index | Sparse Index | Persistence |
| :--- | :--- | :--- | :--- | :--- |
| **Instant In-Memory Cache** | Instant document inspection via `/api/analyze` and `/api/analyze_stream`. | FAISS `IndexFlatIP` (normalized inner product cosine similarity). | Rank-BM25 (`BM25Okapi` with English tokenization). | In-memory cache keyed by SHA-256 hash (`doc_id`). |
| **Persistent pgvector Store** | Multi-turn agent workspace and longitudinal paper library. | PostgreSQL `pgvector` with HNSW cosine distance index (`vector(384)`). | PostgreSQL full-text search (`tsvector`). | Persisted in PostgreSQL database tables (`documents`, `paper_chunks`). |

- **Score Fusion**: Combines dense semantic similarity and sparse keyword scores via configurable alpha-blending ($\alpha \cdot \text{Dense} + (1-\alpha) \cdot \text{Sparse}$) to retrieve high-precision excerpts even for niche technical terminology.

---

## 3. Structured 6-Section Analysis Engine

Rather than passing raw document dumps to an LLM, [`analysis.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/analysis.py) performs targeted context routing:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RAW PAPER CHUNKS                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[Methodology Chunks]        [Results Chunks]            [Limitations Chunks]
("method", "model",         ("result", "metric",        ("limitation", "drawback",
 "architecture")             "accuracy", "mae")          "shortcoming")
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
       [Regex Metric Extractor: MAE, RMSE, MAPE, Parameters, Latency]
                                    ▼
       [Prompt Assembly with Section Contexts & Page Citations]
                                    ▼
       [LLM Inference: Primary openai/gpt-oss-120b | Fallback gpt-oss-20b]
                                    ▼
       [Strict XML Tag Validation: enforce_strict_analysis_format]
```

### The 6 Analysis Sections
1. **Executive Summary**: A coherent, dense paragraph synthesizing core research questions, architectural contributions, and experimental breakthroughs.
2. **Problem Statement**: Explicit bullet points highlighting the theoretical or empirical bottleneck the authors aim to resolve.
3. **Methodology**: Detailed breakdown of mathematical formulations, neural network layers, loss objectives, and training protocols.
4. **Results & Metrics**: Quantitative benchmarks with exact metric extractions (e.g. *"Achieves 30% MAE reduction on PDBbind v2020 benchmark [Page 4]"*).
5. **Limitations**: Methodological assumptions, hardware constraints, out-of-distribution failure modes, and dataset scale boundaries.
6. **Future Work**: Unexplored directions and algorithmic extensions proposed by the authors.

---

## 4. Grounded Conversational Q&A Engine

[`qa.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/qa.py) provides a multi-turn chat assistant strictly grounded in the document context:

### Key QA Mechanics
1. **Strict Page Attribution**: Responses cite source page numbers (`[Page 1]`, `[Page 4]`). If information is not in the text, the model is strictly constrained to reply *"Not mentioned in the paper."*
2. **Table-to-Point Sanitization (`_sanitize_no_table_output`)**: Automatically converts awkward multi-column markdown tables into readable bulleted key-value lists for optimal reading on desktop and mobile.
3. **Multi-Turn Conversation Memory**: Normalizes and tracks the last 8 conversation turns (`_normalize_history`) to resolve pronouns and follow-up inquiries (*"What baseline did they compare against?"* $\rightarrow$ *"Are you sure?"*).
4. **Follow-Up Detection (`_is_follow_up_question`)**: Identifies challenging or clarifying queries to provide in-depth citations from the paper's ablation sections.

---

## 5. API Reference

### 1. Synchronous Paper Analysis
`POST /api/analyze`

#### Request (Multipart Form)
- `file`: PDF or DOCX file (up to 25 MB).

#### Response (`200 OK`)
```json
{
  "result": "## Executive Summary\nThis paper introduces...\n\n## Problem Statement\n- 2D graphs fail to capture...\n\n## Methodology\n- SE(3)-equivariant convolutions...",
  "doc_id": "a1b2c3d4e5f6",
  "page_count": 12,
  "detected_title": "Equivariant Graph Transformers for Molecular Conformation",
  "fallback_title": "paper_v2_final"
}
```

---

### 2. Streaming Paper Analysis
`POST /api/analyze_stream`

Streams real-time analysis tokens over Server-Sent Events (SSE).

#### Stream Event Structure
```text
event: doc_id
data: {"doc_id": "a1b2c3d4e5f6"}

event: token
data: {"token": "## Executive Summary\n"}

event: token
data: {"token": "This paper presents..."}

event: done
data: {}
```

---

### 3. Grounded Question & Answering
`POST /api/ask`

#### Request Body
```json
{
  "question": "What loss function was used to train the equivariant layers?",
  "doc_id": "a1b2c3d4e5f6",
  "paper_id": null,
  "history": [
    {"role": "user", "text": "What is the core architecture?"},
    {"role": "assistant", "text": "The paper uses an SE(3)-equivariant graph transformer [Page 2]."}
  ]
}
```

#### Response (`200 OK`)
```json
{
  "answer": "The equivariant message-passing layers were trained using a combination of Huber loss for distance prediction and cosine similarity regularizers [Page 4].\n\nKey Parameters:\n- Huber delta: 0.1\n- Learning rate: 1e-4 with cosine decay"
}
```

---

## 6. Frontend UI/UX Architecture

The interface ([`PaperAnalyzer.tsx`](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend/src/pages/PaperAnalyzer.tsx)) delivers a production-grade, split-screen workspace with resizable panels:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Paper Icon] Equivariant Graph Transformers (12 pages)       [PDF Export] [Markdown]   │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ LEFT PANEL: Structured Analysis Document  │ RIGHT PANEL: Grounded Interrogation Chat   │
│ (Resizable: 65% default)                  │ (Resizable: 35% default)                   │
│                                           │                                            │
│ [Section Quick Nav: Summary|Methods|...]  │ [Chat Thread]                              │
│                                           │ User: "What baseline was used?"            │
│ ## Executive Summary                      │                                            │
│ This paper introduces a novel...          │ AI: "The authors benchmarked against 3D    │
│                                           │ UNet and SchNet baselines [Page 5]."       │
│ ## Methodology                            │                                            │
│ - SE(3)-equivariant convolutions...       │ Quick Prompts:                             │
│ - Pre-trained on 10M structures...        │ [Summarize 5 bullets] [List Limitations]   │
│                                           │                                            │
│ ## Results                                │ ┌────────────────────────────────────────┐ │
│ - 30% MAE reduction on PDBbind [Page 4].  │ │ Ask a question about this paper...  [>]│ │
│                                           │ └────────────────────────────────────────┘ │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

### Key UI Features
- **Resizable & Collapsible Panels**: Smooth drag-to-resize split screen using `react-resizable-panels` with one-click maximize/minimize buttons.
- **Section Quick Navigator**: Interactive jump chips to instantly scroll to Problem Statement, Methodology, Results, or Limitations.
- **Multi-Format Export**: One-click Markdown copy and formatted PDF export.
- **Interactive Chat Citations**: Grounded responses with page badges for rapid fact-checking.

---

## 7. Quality Assurance & Verification

To verify the Paper Analyzer parsing, extraction, and formatting pipelines:

```bash
# 1. Test XML section formatting & parsing
python backend/test_structured_outputs.py

# 2. Test Paper Analyzer integration & LLM fallback models
python backend/test_agent_architecture.py

# 3. Verify frontend build
cd frontend && npm run build
```
