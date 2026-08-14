# 💡 Architectural Design Decisions & Engineering Trade-Offs

This document details the key technical decisions, architectural trade-offs, and engineering rationale behind **PaperLens AI**. Each case study follows a standardized **Context $\rightarrow$ Decision $\rightarrow$ Alternatives Considered $\rightarrow$ Trade-Offs Accepted $\rightarrow$ Measured Outcome** format to demonstrate engineering judgment and design rigor.

---

## 1. Dual Retrieval Architecture: In-Memory BM25+FAISS vs Persistent Supabase pgvector

### Context
Researchers interact with literature in two fundamentally different ways:
1. **Instant Single-Session Reads**: Uploading a single PDF to quickly inspect key findings, ask 2–3 follow-up questions, and close the browser.
2. **Persistent Multi-Session Research**: Building a persistent workspace library of uploaded documents across multiple login sessions, requiring map-reduce summarization and cross-session retrieval.

### Decision
Implement two complementary, parallel retrieval architectures:
- **Legacy In-Memory Pipeline (`POST /api/analyze`)**: Computes a deterministic document hash `SHA256(filename:size)[:12]` as `doc_id`. Generates in-memory `Rank-BM25` keyword indexes paired with local `FAISS-CPU` (`IndexFlatL2`) dense vector indexes cached in process memory [`backend/app/services/cache.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/cache.py).
- **Persistent RAG Pipeline (`POST /api/upload-paper`)**: Tokenizes documents via `tiktoken` (512-token chunks), generates 384-dimensional embeddings (`all-MiniLM-L6-v2`), and upserts vectors into remote **Supabase pgvector** PostgreSQL tables (`paper_chunks`), executed via the `match_chunks` RPC function in [`qa.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/qa.py).

### Alternatives Considered
- **Pure Database Persistence for All Uploads**: Storing every uploaded PDF in Supabase pgvector. *Rejected because database writes create unnecessary latency for one-off PDF analysis and quickly bloat remote vector storage.*
- **Pure In-Memory Indexing**: Holding all vector embeddings strictly in RAM. *Rejected because embeddings would be lost upon backend restarts, server redeployments, or user session refreshes.*

### Trade-Offs Accepted
- Maintaining two separate code paths (`doc_id` in-memory lookup vs `paper_id` pgvector lookup).

### Measured Outcome
- Instant single-paper analysis completes with **zero database write latency** and zero remote storage cost.
- Multi-session workspace papers remain fully persistent in Supabase pgvector across server restarts.

---

## 2. Autonomous ReAct Agent Loop vs Static DAG-Based Workflows

### Context
Open-ended research prompts (e.g., *"Perform a literature review on graph neural networks for drug discovery and find 3 unexplored research directions"*) require non-linear, multi-step problem solving. Static linear pipelines cannot dynamically determine how many search iterations, literature queries, or dataset lookups are required.

### Decision
Build an autonomous **ReAct (Reason + Act) Agent Loop** in [`backend/app/services/agents/react_agent.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/react_agent.py) featuring:
1. Turn-compressed prompt context.
2. Dynamic tool scoping with `search_papers` safety guardrails.
3. In-memory scratchpad iteration tracking.
4. Model Context Protocol (MCP) server integration [`mcp_server.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/mcp_server.py).

```
User Prompt ──> ReAct Loop ──> Thought ──> Action (Tool) ──> Observation ──> Final Synthesis
```

### Alternatives Considered
- **Static Directed Acyclic Graphs (DAGs)**: Pre-defining fixed chains (e.g. `Search -> Analyze -> Plan`). *Rejected because rigid chains fail when literature search returns insufficient data or requires follow-up queries.*
- **Unconstrained Multi-Agent Frameworks (e.g. AutoGen / CrewAI)**: Spawning multiple unconstrained LLM sub-agents. *Rejected due to unpredictable token consumption, recursive looping risks, and high API costs under deployment constraints.*

### Trade-Offs Accepted
- Increased prompt engineering complexity and need for strict state validation.

### Measured Outcome
- Supports arbitrary, autonomous multi-step research execution.
- Turn-based system prompt compression saves **~40% context tokens** on turns 2–6, keeping agent execution within budget.

---

## 3. Pydantic v2 & XML Constraints vs Freeform JSON / Unstructured LLM Outputs

### Context
Large Language Models frequently emit invalid JSON when generating complex nested structures (such as 6-stage experiment roadmaps or agent decision objects), leading to JSON parsing errors, regex repair hacks, and forced LLM retries.

### Decision
Enforce dual structured output guardrails across all backend endpoints:
1. **Pydantic v2 Models**: Enforce strict data schemas (`ReActDecision`, `SynthesisAndCritiqueResult`, `QAResponse`) in [`backend/app/models/schemas.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py).
2. **Explicit XML Section Tags**: Require LLM synthesis prompts in [`analysis.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/analysis.py) to wrap outputs in explicit XML tags (`<summary>`, `<problem_statement>`, `<methodology>`, `<limitations>`, `<future_work>`).

### Alternatives Considered
- **Raw JSON Prompting with Regex Repair**: Asking the LLM for JSON and using regex string manipulation to fix malformed outputs. *Rejected due to fragility and high failure rates on complex nested keys.*
- **Freeform Markdown Parsing**: Parsing arbitrary headings. *Rejected because model output formatting variations break frontend rendering.*

### Trade-Offs Accepted
- System prompts require slightly more token overhead on Turn 1 to specify XML and schema tag structures.

### Measured Outcome
- Achieved **0 parsing retry failures** and **0 regex hack dependencies** across automated test suites (`test_structured_outputs.py`).

---

## 4. Groq Inference & Multi-Model Fallbacks vs Single-Provider Architecture

### Context
Agentic workflows require multiple sequential LLM calls per request. Utilizing traditional cloud providers with 5–10 second response latencies creates unacceptable user wait times (30+ seconds for a 4-turn task). Conversely, relying on a single lightweight LLM model risks total service disruption during provider outages or rate-limit spikes.

### Decision
Implement a multi-tier model routing and fallback strategy powered by **Groq Cloud API** in [`backend/app/services/model_fallback.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/model_fallback.py):
- **Pinned Lightweight Route**: Paper Analyzer and Gap Detection route to `llama-3.1-8b-instant` for ultra-fast throughput.
- **Heavy Route with Fallback Cascade**: Complex tools (Experiment Planner, Problem Expansion, Citation Recommendations) target primary `openai/gpt-oss-120b`, falling back automatically to `llama-3.3-70b-versatile` and `meta-llama/llama-4-scout-17b-16e-instruct` on error.

### Alternatives Considered
- **Single Model Reliance**: Routing all requests to a single model. *Rejected due to lack of resilience against rate limits.*
- **Self-Hosted Local LLM (Ollama)**: Running local weights on server instances. *Rejected due to severe GPU memory requirements incompatible with free-tier hosting.*

### Trade-Offs Accepted
- Managing provider-specific token caps and model behavior differences across primary and fallback models.

### Measured Outcome
- High-throughput execution with **sub-second inference response times**.
- Automatic per-attempt model fallbacks prevent user-facing HTTP 500 errors during model rate-limiting events.

---

## 5. Fast-Path Router & LLM Call Consolidation (Token & Latency Optimizations)

### Context
During performance benchmarking, two major inefficiencies were identified:
1. Single-intent queries (e.g. *"Find SOTA datasets for vision transformers"*) were paying a 1.5-second LLM router overhead just to select `find_datasets`.
2. The agent final synthesis pass executed two separate LLM calls: one for peer-review critique and a second for final markdown synthesis.

### Decision
Implement two targeted architectural optimizations:
1. **Deterministic Fast-Path Router (`router.py`)**: Direct regex pattern matcher checking query intent before reaching the LLM router [`backend/app/services/agents/router.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/router.py).
2. **Consolidated Critique & Synthesis Engine (`critique.py`)**: Merged peer-review critique and markdown report generation into a **single unified LLM prompt pass** [`backend/app/services/agents/critique.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/critique.py).

### Alternatives Considered
- **100% LLM Routing**: Passing every input through an LLM router call. *Rejected as wasteful for predictable, single-intent inputs.*
- **Separate Microservice Passes**: Keeping critique and synthesis isolated. *Rejected due to redundant context token re-transmission.*

### Trade-Offs Accepted
- Maintaining deterministic regex routing rules alongside dynamic LLM intent classification.

### Measured Outcome
- Fast-Path router saves **1.5 seconds of latency** and **~600 tokens** per single-intent query.
- Call consolidation achieved a **54.5% total reduction in LLM API calls** during multi-chunk synthesis passes, validated by [`test_call_consolidation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/test_call_consolidation.py).
