# Citation Intelligence: Complete Workflow Documentation

**Purpose:** Turn messy bibliographies into a ranked, actionable reading plan by extracting references, matching them against Semantic Scholar, and generating AI-guided reading recommendations.

This workflow supports **two modes**:

- **Upload Paper mode (SSE streaming)**: Upload a PDF/DOCX → extract references → match each reference → stream real-time progress → produce `top_cited` + `missing` lists.
- **Project Discovery mode**: Provide a project title (+ optional details) → discover relevant papers from Semantic Scholar → rank them → generate reading recommendations.

---

## Architecture Overview

```
Frontend (Citation Intelligence page)
  ├─ Mode A: Upload paper (PDF/DOCX)
  │    └─ POST /api/citation-intelligence/stream  (SSE progress)
  ├─ Mode B: Project discovery (title + context)
  │    └─ POST /api/citation-intelligence/discover
  └─ AI reading guidance (both modes)
       └─ POST /api/citation-intelligence/recommendations

Backend (FastAPI)
  ├─ Parse PDF/DOCX into pages (PyMuPDF / python-docx)
  ├─ Extract references block + split entries (heuristics + dedupe)
  ├─ Match each reference using Semantic Scholar (multi-strategy search)
  ├─ Rank matches (citation count / year)
  ├─ (Optional) Stream per-reference progress via SSE
  └─ Generate recommendations via Groq (strict JSON)
```

---

## 1) Frontend Workflow (UI + request flow)

**File:** `frontend/src/pages/CitationIntelligence.tsx`

### 1.1 Modes

- **Upload Paper**
  - User selects a `.pdf` or `.docx`
  - Clicks **Run Citation Intelligence**
  - UI shows a high-fidelity progress card (live counters + animated progress bar)

- **Project Discovery**
  - User provides **Project title (required)** and **Basic details (optional)**
  - Clicks **Discover 30+ Papers**
  - UI shows step-by-step loading states, then results + recommendations

### 1.2 Results UI (what the user sees)

- **Top cited references**
  - Sort controls: Newest / Oldest / Highest citation / Lowest citation
  - Each card shows title, citation count, authors, venue, year, and an external link

- **Unmatched references**
  - Plain list of reference strings that could not be matched

- **AI Recommendations (sticky panel on large screens)**
  - Focus summary (`paper_focus` or `topic_focus`)
  - Must-read list (3–6)
  - 3-step reading path
  - Coverage gaps
  - Next search queries

---

## 2) Backend Endpoints

### 2.1 Upload-paper citation analysis (non-stream)

**Endpoint:** `POST /api/citation-intelligence`  
**Request:** `multipart/form-data` with `file` (PDF/DOCX)  
**Response:** Citation report JSON:

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

### 2.2 Upload-paper citation analysis (SSE streaming)

**Endpoint:** `POST /api/citation-intelligence/stream`  
**Request:** `multipart/form-data` with `file` (PDF/DOCX)  
**Response:** `text/event-stream` events (each is `data: <json>\n\n`)

Event types:

- **Start**

```json
{ "type": "start", "total": 35, "extracted": 47 }
```

- **Progress**

```json
{
  "type": "progress",
  "current": 8,
  "total": 35,
  "matched": true,
  "title": "Matched paper title (optional)",
  "reference_text": "First 80 chars of reference..."
}
```

- **Done** (final payload contains the full report)

```json
{
  "type": "done",
  "total_references_extracted": 47,
  "references_processed": 35,
  "matched_count": 28,
  "missing_count": 7,
  "references": [],
  "top_cited": []
}
```

- **Error**

```json
{ "type": "error", "message": "Semantic Scholar API authentication failed." }
```

### 2.3 Project discovery (topic → papers)

**Endpoint:** `POST /api/citation-intelligence/discover`  
**Request JSON:**

```json
{ "project_title": "Diffusion models for medical imaging", "basic_details": "MRI segmentation", "limit": 35 }
```

**Response:** Citation report JSON (all entries are “matched” because they come from Semantic Scholar search).

### 2.4 AI Reading recommendations (both modes)

**Endpoint:** `POST /api/citation-intelligence/recommendations`  
**Request JSON (shape):**

```json
{
  "paper_context": "Optional context string built from top-cited + reference samples",
  "top_cited": [{ "title": "...", "authors": ["..."], "year": 2022, "citation_count": 123 }],
  "missing_references": ["Raw reference string 1", "Raw reference string 2"],
  "recommendation_mode": "upload"
}
```

**Response JSON (strict):**
- Upload mode returns `paper_focus`
- Discover mode returns `topic_focus`
- Also returns `must_read`, `reading_path` (exactly 3), `coverage_gaps`, `next_search_queries`

---

## 3) Matching Logic (Semantic Scholar)

**Core implementation:** `backend/app/services/citation_intelligence.py`

### 3.1 Reference extraction

- Attempts to find a “References/Bibliography/Works cited …” section.
- If no header is found, falls back to the last ~300 lines of the document.
- Splits references via:
  - Numbered reference parsing (`[12]` / `12.` / `12)`), otherwise
  - Heuristic “looks like a reference start” detection
- Deduplicates using normalized text.

### 3.2 Multi-strategy search (per reference)

Order of strategies:

1. **DOI lookup** (most precise)
2. **Full cleaned query** (author+title portion)
3. **Title-only query** (heuristic title extraction)
4. **Shortened query** fallback

To reduce false positives, candidate results are validated using a fuzzy overlap check on title words.

---

## 4) Configuration & Limits

**File:** `backend/app/core/config.py`

| Config | Default | Purpose |
|--------|---------|---------|
| `MAX_UPLOAD_MB` | 20 | File size limit for uploaded papers |
| `MAX_PAGES` | 60 | Page cap during parsing |
| `MAX_TOTAL_CHARS` | 300000 | Total extracted text cap |
| `CITATION_MAX_REFERENCES` | 60 | Limits how many extracted references are processed |
| `SEMANTIC_SCHOLAR_API_KEY` | (required) | Enables Semantic Scholar matching and discovery |

---

## 5) Failure Modes & Recovery

| Scenario | Root cause | User experience | Recovery |
|---|---|---|---|
| File rejected | Wrong extension | 400 error | Upload PDF/DOCX only |
| Paper too large | Upload/parsing limits exceeded | 413 error | Upload smaller paper / fewer pages |
| No text extracted | Scanned PDF / empty pages | 400 error | Use selectable-text PDF (OCR is future enhancement) |
| Semantic Scholar auth fails | Bad/missing API key | Error event / 500 | Configure `SEMANTIC_SCHOLAR_API_KEY` |
| Rate limiting | 429/503 | Partial matches / slower progress | Retry after a pause |

---

## 6) End-to-End Summary

### Upload Paper mode
1. User uploads a paper → frontend calls `POST /api/citation-intelligence/stream`.
2. Backend extracts references and matches each entry against Semantic Scholar.
3. Frontend renders live progress from SSE events.
4. Final report returns `top_cited` + `missing` references.
5. Frontend calls `POST /api/citation-intelligence/recommendations` to generate a reading plan.

### Project Discovery mode
1. User enters project title (+ optional details) → frontend calls `POST /api/citation-intelligence/discover`.
2. Backend searches Semantic Scholar, ranks papers, returns a structured report.
3. Frontend calls `POST /api/citation-intelligence/recommendations` to generate what-to-read-next guidance.

