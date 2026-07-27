# 🗂 Citation Intelligence — Exhaustive Architecture & Literature Discovery Guide

<p align="center">
  <img src="https://img.shields.io/badge/Workflow-Citation%20Intelligence-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Citation Intelligence Workflow" />
  <img src="https://img.shields.io/badge/Provider-Semantic%20Scholar%20%2B%20Crossref%20%2B%20arXiv-blue?style=for-the-badge&logo=google-scholar&logoColor=white" alt="Literature APIs" />
  <img src="https://img.shields.io/badge/Streaming-SSE%20Live%20Progress-emerald?style=for-the-badge&logo=fastapi&logoColor=white" alt="SSE Live Progress" />
  <img src="https://img.shields.io/badge/Model-GPT--OSS--120B%20%2B%20Llama%203.3%2070B-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="Groq Model Fallback" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
</p>

---

> [!IMPORTANT]
> **Intelligent Bibliography Parsing & Literature Discovery**
> **Citation Intelligence** turns messy bibliographies into structured, ranked reading plans. Operating in **two modes** (Paper Bibliography Upload & Topic Discovery), it extracts reference entries, resolves citations using a 4-strategy fallback search, streams real-time progress via Server-Sent Events (SSE), and generates AI-guided reading paths.

---

## 🏗️ 1. Complete Architecture & Data Flow

```mermaid
flowchart TD
    subgraph FrontendSurface ["💻 Frontend Gateway (CitationIntelligence.tsx)"]
        UI1["📁 Mode A: Upload PDF / DOCX Bibliography"]
        UI2["🌐 Mode B: Project Discovery (Topic Search)"]
        UI3["⚡ Live SSE Progress Stepper & Counter"]
        UI4["📖 AI Reading Recommendations Panel"]
    end

    subgraph FastAPIRoutes ["⚡ FastAPI Endpoint Gateway (routes.py)"]
        R1["POST /api/citation-intelligence/stream (SSE Upload)"]
        R2["POST /api/citation-intelligence/discover (Topic Discovery)"]
        R3["POST /api/citation-intelligence/recommendations (AI Reading Path)"]
        LOG["Database Activity Logger (Activity Table)"]
    end

    subgraph LiteratureEngine ["📡 Multi-Provider Literature Engine (citation_intelligence.py)"]
        S1["Strategy 1: DOI Resolution (_extract_doi)"]
        S2["Strategy 2: Cleaned Query (_build_search_query)"]
        S3["Strategy 3: Heuristic Title Search (_extract_title_heuristic)"]
        S4["Strategy 4: Fuzzy Title Match Scoring (_score_discovery_candidate)"]
        
        API1["Semantic Scholar API (Primary)"]
        API2["Crossref API (429 Rate Limit Fallback)"]
        API3["arXiv API (Batch Search Engine)"]
    end

    subgraph LLMOrchestration ["🧠 LLM Model Fallback Engine (generation.py)"]
        M1["Primary Model: openai/gpt-oss-120b"]
        M2["Fallback Model: meta-llama/llama-4-scout-17b"]
        PLAN["_build_discovery_query_plan()"]
        REC["generate_citation_recommendations()"]
    end

    UI1 -->|Multipart file upload| R1
    UI2 -->|JSON: project_title + basic_details| R2
    R1 --> LOG & S1
    R2 --> LOG & PLAN
    PLAN --> M1
    M1 -->|429 Rate Limit| M2
    S1 & S2 & S3 & S4 --> API1
    API1 -->|401/403 Key Fail| API1_Anon["Anonymous Retry"]
    API1 -->|429 Rate Limit| API2 & API3
    R1 -->|text/event-stream| UI3
    R2 & R1 -->|Matched Papers| R3 --> REC --> M1 --> UI4
```

---

## 🔄 2. End-to-End Request & Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as CitationIntelligence.tsx
    participant Route as routes.py
    participant DB as PostgreSQL (Activity Log)
    participant Engine as citation_intelligence.py
    participant S2API as Semantic Scholar / Crossref API
    participant LLM as Groq Inference Engine

    alt Mode A: Bibliography Upload (SSE Streaming)
        User->>UI: 1. Select PDF/DOCX file & click Run Citation Intelligence
        UI->>Route: 2. POST /api/citation-intelligence/stream (FormData: file)
        Route->>Engine: 3. Extract reference block & split numbered entries
        Route-->>UI: 4. SSE Stream Start Event { type: "start", total: 35 }
        loop For Each Extracted Reference
            Engine->>S2API: 5. 4-Strategy Fallback Search (DOI -> Cleaned -> Title)
            S2API-->>Engine: Matched Paper Metadata (Citations, Year, Venue, URL)
            Route-->>UI: 6. SSE Progress Event { type: "progress", current: N, matched: true }
        end
        Route-->>UI: 7. SSE Done Event { type: "done", references, top_cited }
    else Mode B: Project Discovery
        User->>UI: 8. Input Project Title & Basic Details
        UI->>Route: 9. POST /api/citation-intelligence/discover { project_title, basic_details }
        Route->>Engine: 10. Generate query plan (_build_discovery_query_plan)
        Engine->>S2API: 11. Execute multi-query search & score candidates
        S2API-->>Engine: Top 30+ Ranked Literature Papers
        Route-->>UI: 12. Return Matched Discovery Report
    end

    User->>UI: 13. Request AI Reading Recommendations
    UI->>Route: 14. POST /api/citation-intelligence/recommendations
    Route->>LLM: 15. Generate reading path (primary: gpt-oss-120b)
    LLM-->>Route: JSON { must_read, reading_path, coverage_gaps, next_search_queries }
    Route-->>UI: 16. Return Recommendations Payload
    UI->>User: 17. Render Interactive Cards & Reading Recommendations Panel
```

---

## 🔑 3. Multi-Provider API Key & Failover Rationale (`citation_intelligence.py`)

> [!IMPORTANT]
> **API Key Downgrade & Multi-Provider Fallback Architecture**
>
> Citation Intelligence uses a multi-tier resilience strategy to guarantee search continuity regardless of API key validity or external rate limits:
>
> 1. **Semantic Scholar API Key Header (`x-api-key`)**: If `SEMANTIC_SCHOLAR_API_KEY` is provided in `.env`, the client includes `x-api-key` in search request headers.
> 2. **Authentication Auto-Downgrade (`401`/`403` Handling)**: If the provided API key is invalid, expired, or rejected (`401 Unauthorized` or `403 Forbidden`), `SemanticScholarClient` automatically deactivates the key (`self.api_key = None`) and transparently retries the search anonymously!
> 3. **Crossref API Fallback (`429`/`503` Handling)**: If Semantic Scholar rate limits (`429 Too Many Requests`) or experiences outages (`503 Service Unavailable`), the engine automatically switches to the **Crossref API** (`https://api.crossref.org/works`).
> 4. **arXiv API Batch Engine**: Concurrently queries **arXiv API** (`http://export.arxiv.org/api/query`) to fetch up to 40 papers sorted by publication recency.

```python
# API Key Auto-Downgrade & Crossref Fallback in citation_intelligence.py
class SemanticScholarClient:
    def __init__(self, api_key: str, min_interval_seconds: float = 1.0):
        self.api_key = api_key
        self.min_interval_seconds = min_interval_seconds
        self._last_request_time = 0.0
        self._client = httpx.Client(timeout=25.0)

    def _get_headers(self) -> dict:
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    def _search_by_query(self, query: str, fields: str = "title,authors,year,citationCount,url,venue,paperId") -> dict | None:
        self._throttle()
        try:
            response = self._client.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={"query": query, "limit": 3, "fields": fields},
                headers=self._get_headers(),
            )
        except Exception:
            fallback = self._search_crossref_fallback(query, limit=1)
            return fallback[0] if fallback else None

        # Auto-Downgrade invalid API key to anonymous mode
        if response.status_code in {401, 403}:
            if self.api_key:
                logger.warning("Semantic Scholar API auth failed. Retrying anonymously...")
                self.api_key = None
                return self._search_by_query(query, fields)

        # Crossref Fallback on Rate Limit
        if response.status_code in {429, 503}:
            logger.info("Semantic Scholar API rate limited (status %d). Using Crossref fallback...", response.status_code)
            fallback = self._search_crossref_fallback(query, limit=1)
            return fallback[0] if fallback else None
```

---

## 🔍 4. Multi-Strategy Reference Matching Search

Each extracted reference entry undergoes a 4-pass matching sequence:

```mermaid
mindmap
  root((4-Strategy Reference Search))
    Strategy1["Strategy 1: Direct DOI Resolution"]
      DOI["Extracts 10.xxxx/xxxx pattern. 100% exact match confidence."]
    Strategy2["Strategy 2: Cleaned Search Query"]
      Clean["Strips URLs, DOIs, volume/issue numbers. Keeps author + title string."]
    Strategy3["Strategy 3: Heuristic Title-Only Query"]
      Title["Extracts paper title between quotes or before venue markers."]
    Strategy4["Strategy 4: Candidate Score Verification"]
      Score["Fuzzy title word overlap scoring (_score_discovery_candidate)."]
```

---

## 📡 5. Real-Time SSE Stream Architecture (`POST /api/citation-intelligence/stream`)

When analyzing paper bibliographies, the backend yields real-time Server-Sent Events (SSE):

```typescript
// SSE Event Types Payload Schema
type SSEEvent = 
  | { type: "start"; total: number; extracted: number }
  | { type: "progress"; current: number; total: number; matched: boolean; title?: string; reference_text: string }
  | { type: "done"; total_references_extracted: number; matched_count: number; missing_count: number; references: any[]; top_cited: any[] }
  | { type: "error"; message: string };
```

---

## 🧠 6. AI Reading Recommendations (`POST /api/citation-intelligence/recommendations`)

Once references or discovery papers are matched, the LLM synthesizes an actionable 3-step reading path:

```json
{
  "topic_focus": "GAN-based leaf disease synthesis and domain-adversarial crop diagnostics.",
  "must_read": [
    {
      "title": "Generative Adversarial Networks for Plant Disease Synthesis",
      "reason": "Establishes foundational Latent GAN architecture for crop lesion augmentation."
    }
  ],
  "reading_path": [
    { "step": 1, "action": "Read baseline GAN synthesis paper to understand generator loss setup." },
    { "step": 2, "action": "Analyze domain-adversarial CycleGAN extensions for field lighting invariance." },
    { "step": 3, "action": "Review MobileStyleGAN quantization papers for on-edge diagnostic deployment." }
  ],
  "coverage_gaps": ["Limited evaluation on multi-pathogen co-infection datasets."],
  "next_search_queries": [
    "conditional latent diffusion plant pathology",
    "edge tensorrt stylegan crop diagnosis"
  ]
}
```

---

## ⚠️ 7. Failure Modes & Error Recovery Matrix

| Scenario | Root Cause | Handling Strategy | User Experience |
|---|---|---|---|
| **Invalid / Expired API Key** | `SEMANTIC_SCHOLAR_API_KEY` invalid | Auto-downgrade to anonymous mode (`self.api_key = None`) | Transparent search execution |
| **API Rate Limit (429 / 503)** | Semantic Scholar quota reached | Auto-fallback to Crossref API (`api.crossref.org`) | Slower progress, zero failure |
| **Scanned PDF / No Text** | Missing OCR text layer | Pre-parse validation check | Toast error: *"No selectable text found."* |
| **LLM Quota Exceeded** | Groq daily TPM cap hit | Fallback to `meta-llama/llama-4-scout-17b` | Terminal log trace (`[MODEL-FALLBACK]`) |

---

## 🔐 8. Safe Environment Setup

> [!WARNING]
> Keep API credentials in environment files and never commit raw secrets to git repositories.

### Required Backend Environment Variables (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
CLERK_SECRET_KEY=sk_test_[CLERK_SECRET_KEY]
GROQ_API_KEY=gsk_[GROQ_API_KEY]
SEMANTIC_SCHOLAR_API_KEY=[SEMANTIC_SCHOLAR_API_KEY]
```

### Frontend Environment Variables (`frontend/.env.local`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[CLERK_PUB_KEY]
VITE_API_URL=http://localhost:8000
```
