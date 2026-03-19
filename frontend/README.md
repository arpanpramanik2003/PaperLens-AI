# PaperLens AI Frontend

React + TypeScript dashboard for interacting with the PaperLens AI backend.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Clerk auth (`@clerk/clerk-react`)
- Framer Motion animations

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

## Run

```powershell
cd frontend
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run build:dev` — development-mode build
- `npm run lint` — lint code
- `npm run test` — run Vitest tests
- `npm run test:watch` — watch tests

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

## Backend Integration

API client: `src/lib/api-client.ts`

- Base URL: `VITE_API_URL` (fallback `http://localhost:8000`)
- Adds `Authorization: Bearer <token>` from Clerk

Feature-page API usage:

- `DashboardHome.tsx` → `GET /api/dashboard`
- `PaperAnalyzer.tsx` → `POST /api/analyze`, `POST /api/ask`
- `ExperimentPlanner.tsx` → `POST /api/plan-experiment`
- `ProblemGenerator.tsx` → `POST /api/generate-problems`
- `GapDetection.tsx` → `POST /api/detect-gaps`

## Auth Flow

- `ClerkProvider` wraps app in `src/App.tsx`.
- `LoginPage` and `SignupPage` use Clerk hosted components.
- Frontend sends Clerk session token to backend for protected API calls.

## Testing

- Vitest configured in `vitest.config.ts` (jsdom + setup file).

## Notes

- Dashboard contains demo-mode fallbacks when no authenticated user is present.
- `SettingsPage` persists profile fields in browser `localStorage` (not backend DB).
