# PaperLens AI Frontend

React + TypeScript dashboard for interacting with the PaperLens AI backend.

## Stack & Features

- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Clerk (`@clerk/clerk-react`)
- **Animations:** Framer Motion (used extensively for the advanced real-time progress bars)
- **Streaming:** Native `ReadableStream` API used to consume Server-Sent Events (SSE) from the backend.

## Setup

```powershell
cd frontend
npm install
```

Create or update `frontend/.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```
*(If deployed to Vercel, set `VITE_API_URL` to your Render backend URL).*

## Run

```powershell
npm run dev
```

## Route Map

- `/` — landing page
- `/login` — Clerk sign-in
- `/signup` — Clerk sign-up
- `/dashboard` — dashboard home
- `/dashboard/analyzer` — paper analyzer + Q&A
- `/dashboard/planner` — experiment planner
- `/dashboard/generator` — problem generator
- `/dashboard/gaps` — gap detection
- `/dashboard/settings` — local profile/preferences
- `/dashboard/citation` — real-time citation intelligence

## Backend Integration Details

API client operations are handled in `src/lib/api-client.ts` leveraging the `VITE_API_URL` variable.

**Standard REST Endpoints:**
- `DashboardHome.tsx` → `GET /api/dashboard`
- `ExperimentPlanner.tsx` → `POST /api/plan-experiment`
- `PaperAnalyzer.tsx` → `POST /api/analyze`, `POST /api/ask`
- `GapDetection.tsx` → `POST /api/detect-gaps`
- `DatasetBenchmarkFinder.tsx` → `POST /api/find-datasets-benchmarks`
- `ProblemGenerator.tsx` → `POST /api/generate-problems`, `POST /api/expand-problem`

**Streaming Capabilities:**
The frontend utilizes real-time streaming to provide users with visual feedback during long-running tasks:
- **`CitationIntelligence.tsx`**: Uses the native fetch `ReadableStream` to consume the `POST /api/citation-intelligence/stream` endpoint. It processes `start`, `progress`, and `done` JSON chunks to animate the high-fidelity framer-motion progress bar.

## Runtime Behavior Notes

- Paper Analyzer and Gap Detection are pinned to a lightweight model in backend for stable throughput.
- Planner/Generator/Finder/Citation recommendation routes use heavy model routing with fallback in backend.
- Backend terminal prints model traces (`[MODEL]`, `[MODEL-FALLBACK]`) for each AI request.

## Error Semantics (Important)

- HTTP 413 is not always file size.
	- It can also be model token/TPM limit exceeded from provider.
- Invalid DOCX package now returns HTTP 400 with backend code `INVALID_DOCUMENT_FORMAT`.
- Frontend can show clearer user messages by checking backend `code` values where available.

## Troubleshooting (UI Messaging)

Use backend `code` (when present) to show precise user-facing messages.

### Recommended mapping

- `INVALID_DOCUMENT_FORMAT` (HTTP 400)
	- Show: "This DOCX file is invalid or corrupted. Please upload a valid .docx or PDF."

- `PAPER_TOO_LENGTHY` (HTTP 413)
	- Show: "Paper is too large for current limits. Try a shorter file or fewer pages."

- Provider token-limit 413 (`rate_limit_exceeded`, `type=tokens`)
	- Show: "Analysis request exceeded model token throughput. Please retry or use smaller input."

### Quick payload checks

If backend returns:

```json
{ "code": "INVALID_DOCUMENT_FORMAT", "error": "..." }
```

Treat as file-format issue.

If backend returns:

```json
{ "code": "PAPER_TOO_LENGTHY", "error": "..." }
```

Treat as upload/parsing size-limit issue.

If backend returns provider error body containing:
- `"type": "tokens"`
- `"code": "rate_limit_exceeded"`

Treat as model TPM/token issue (not file-size issue).

## Auth Flow

- `ClerkProvider` wraps app in `src/App.tsx`.
- Frontend passes the Clerk JWT to the backend via the `Authorization: Bearer <token>` header for all protected API routes.
