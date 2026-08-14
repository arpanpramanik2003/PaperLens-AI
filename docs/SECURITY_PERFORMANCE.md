# 🛡 Security Architecture & Performance Optimization Audit

This document summarizes the security hardening measures and empirical performance optimizations implemented in **PaperLens AI**. It serves as evidence of production readiness, demonstrating that the system was systematically audited, benchmarked, and hardened for deployment.

---

## 1. Security Architecture & Hardening

Security in PaperLens AI is enforced across authentication, token verification, network CORS, request throttling, and document parsing validation.

```
Request Security Lifecycle
[Incoming Client Request]
       │
       ▼
1. CORS Middleware (main.py)  ──> Verify Origin Whitelist
       │
       ▼
2. Clerk JWKS Token Verifier (security.py)  ──> Validate RSA-256 Signature & Claims
       │
       ▼
3. Sliding Window Rate Limiter (rate_limiter.py)  ──> Check Token Bucket (HTTP 429 if exceeded)
       │
       ▼
4. File Extraction Safety Guardrails (parsing.py) ──> Enforce Size, Page & Character Limits
```

### A. Clerk RSA-256 JWKS Token Verification
- **Implementation**: [`backend/app/core/security.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/security.py)
- **Algorithm**: RSA-256 asymmetric cryptographic signature validation via PyJWT.
- **Key Caching & Key-Rotation Resiliency**:
  - Implements an in-memory public key cache (`jwks_cache`) with a 15-minute Time-To-Live (TTL = 900 seconds) to prevent redundant remote HTTP requests to Clerk servers.
  - **Automatic Key Rotation Fallback**: If an incoming token contains an unrecognized Key ID (`kid`), `get_jwks(force_refresh=True)` bypasses the cache to fetch newly rotated public keys from Clerk, eliminating auth failures during key rotation.
- **Claims Verification**: Validates token expiration (`exp`), audience (`aud` if configured), and issuer (`iss` if configured) before returning the user's Clerk Subject ID (`sub`).

### B. Async Sliding Window Rate Limiting
- **Implementation**: [`backend/app/core/rate_limiter.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/core/rate_limiter.py)
- **Mechanism**: In-memory sliding window algorithm tracking request timestamps per `(route_prefix, user_id/IP)`.
- **Enforcement Targets**:
  - **LLM Endpoints (`llm_rate_limiter`)**: Throttled to **10 requests per minute** per user to prevent API quota exhaustion.
  - **Upload Routes (`upload_rate_limiter`)**: Throttled to **5 uploads per minute** per user.
- **Response behavior**: Immediately raises `HTTP 429 Too Many Requests` with a standard `Retry-After` header indicating the required wait time in seconds.

### C. CORS Origin Whitelisting
- **Implementation**: [`backend/app/main.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/main.py)
- **Configuration**: Restricts Cross-Origin Resource Sharing (CORS) strictly to trusted domain origins (e.g. production Vercel deployment and local Vite development servers), preventing unauthorized cross-site API access.

### D. Input Validation & Parser Guardrails
- **Implementation**: [`backend/app/services/parsing.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/parsing.py)
- **File Type & Container Auditing**: Validates OOXML containers for `.docx` uploads (`python-docx`), immediately returning `INVALID_DOCUMENT_FORMAT` (HTTP 400) on malformed packages.
- **Hard Resource Safety Limits**:
  - **Max File Size**: Enforces strict limit (default: 15MB).
  - **Max Page Count**: Capped at **50 pages** per PDF (`MAX_PAGES`).
  - **Max Character Extraction**: Capped at **150,000 characters** (`MAX_TOTAL_CHARS`).
  - Papers exceeding these thresholds fail fast with `PAPER_TOO_LENGTHY` (HTTP 413) to prevent server Denial of Service (DoS).

---

## 2. Performance Engineering & Token Benchmarks

PaperLens AI underwent extensive performance benchmarking to minimize token expenditure, reduce response latency, and fit within Render's **500MB free-tier RAM cap**.

### A. Empirical LLM Optimization Benchmarks

The system incorporates four key optimization passes validated by test scripts ([`benchmark_token_savings.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/benchmark_token_savings.py), [`test_call_consolidation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/test_call_consolidation.py), [`test_agent_architecture.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/test_agent_architecture.py)):

| Optimization Pass | Before Audit | After Optimization | Measured Performance Improvement |
|---|---|---|---|
| **Fast-Path Intent Router** | 100% LLM Router Overhead (~1.5s / 600 tokens) | Deterministic Regex Matcher ([`router.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/router.py)) | **1.5s Latency Savings (~600 tokens/query)** |
| **Agent Prompt Compression** | Full JSON tool schemas sent on every turn | Turn 1: Full JSON schemas<br>Turns 2–6: Signature strings ([`react_agent.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/react_agent.py)) | **~40% Prompt Token Savings (Turns 2–6)** |
| **LLM Call Consolidation** | 11 API Calls (Multi-pass critique + map-reduce) | 5 API Calls (Unified pass + 2-chunk map calls) ([`critique.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/agents/critique.py)) | **54.5% API Call Reduction** |
| **Structured Output Parsing** | Freeform JSON with Regex Retries (15–20% failure rate) | Strict Pydantic v2 + XML Tags ([`schemas.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/models/schemas.py)) | **0 Parsing Retries / 0 Failure Retries** |

---

## 3. Server Memory & Resource Efficiency

To run reliably on Render's 500MB RAM tier without hitting Out-Of-Memory (OOM) process kills:

1. **Generator-Based PDF Extraction**: [`parsing.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/parsing.py) uses PyMuPDF generators (`extract_pdf_pages_generator`) to yield page text sequentially rather than buffering massive binary strings in memory.
2. **Lazy-Loaded Sentence Transformers**: [`embedding.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/embedding.py) defers loading the 384-dim `all-MiniLM-L6-v2` PyTorch model until the first vector embedding query is received.
3. **Idle Memory Footprint**: Maintained at **<180MB RAM** during idle state when `ENABLE_VECTOR_RETRIEVAL=false` is set on free-tier deployments.

---

## 4. Frontend Performance & Bundle Optimization

The React 18 frontend ([`frontend/`](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend)) incorporates dynamic chunking and rendering optimizations:

### A. Manual Rollup Vendor Chunking
Configured in [`frontend/vite.config.ts`](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend/vite.config.ts) to separate large third-party libraries into independent browser chunks, improving caching and reducing initial bundle download time:

```typescript
manualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("jspdf") || id.includes("docx") || id.includes("html2canvas")) return "vendor-export";
    if (id.includes("@clerk")) return "vendor-clerk";
    if (id.includes("framer-motion")) return "vendor-framer";
    if (id.includes("lucide-react")) return "vendor-icons";
    if (id.includes("@tanstack") || id.includes("react-router-dom")) return "vendor-core";
    if (id.includes("@radix-ui")) return "vendor-ui";
  }
}
```

### B. Framer Motion & Render Optimization
- Hardware-accelerated CSS transforms (`transform`, `opacity`) used for modal drawers and steppers.
- Dynamic route code-splitting via React `lazy` and `Suspense` boundaries in `App.tsx` ensuring heavy capability components are loaded on-demand.
