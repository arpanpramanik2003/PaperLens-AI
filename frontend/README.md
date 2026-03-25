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

**Streaming Capabilities:**
The frontend utilizes real-time streaming to provide users with visual feedback during long-running tasks:
- **`CitationIntelligence.tsx`**: Uses the native fetch `ReadableStream` to consume the `POST /api/citation-intelligence/stream` endpoint. It processes `start`, `progress`, and `done` JSON chunks to animate the high-fidelity framer-motion progress bar.

## Auth Flow

- `ClerkProvider` wraps app in `src/App.tsx`.
- Frontend passes the Clerk JWT to the backend via the `Authorization: Bearer <token>` header for all protected API routes.
