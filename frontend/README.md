# 🎨 PaperLens AI Frontend Application

Modern **React 18 + TypeScript + Vite** web dashboard and autonomous agent interface for PaperLens AI — featuring responsive glassmorphism UI, real-time Server-Sent Events (SSE) progress streaming, Framer Motion animations, grounded document QA, and citation graph visualization.

---

## 🛠️ Production Technologies & Stack

### Core Framework & Build Tooling
- **Core Framework**: [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) — Strict type-safe component architecture.
- **Build System**: [Vite 5](https://vitejs.dev/) with `@vitejs/plugin-react-swc` — Ultra-fast Hot Module Replacement (HMR) and optimized SWC production bundling.
- **Routing**: [React Router DOM v6](https://reactrouter.com/) — Single Page Application (SPA) client-side routing with nested layout routes (`DashboardLayout.tsx`, `AgentModeLayout.tsx`).

### Design System & UI Styling
- **Styling Engine**: [Tailwind CSS 3](https://tailwindcss.com/) — Utility-first styling with HSL color tokens and dark-mode glassmorphism design system.
- **UI Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) primitives (Dialog, Tabs, Popover, Dropdown, Avatar, Resizable Panel).
- **Icons**: [Lucide React](https://lucide.dev/) — High-fidelity icon library.
- **Split Panel Layout**: `react-resizable-panels` — Interactive horizontal desktop panel splitting with double-click reset and mobile vertical stacking fallback.

### Animation & Motion Design
- **Animation Engine**: [Framer Motion 11](https://www.framer.com/motion/) — Fluid stepper progress indicators, ambient mesh glows, card transitions, and micro-interactions.

### Real-Time Streaming & API Integration
- **SSE Streaming**: Native Web `ReadableStream` API — Consumes backend Server-Sent Event (SSE) streams in `AgentMode.tsx` and `CitationIntelligence.tsx` for real-time progress updates.
- **API Client**: Custom `apiClient` ([api-client.ts](file:///d:/Edutation(P)/Learning-code/paper_explainer/frontend/src/lib/api-client.ts)) — Injects Clerk JWT Bearer tokens and handles backend error mapping.

### Authentication & Multi-Tenancy
- **Auth Provider**: [Clerk React](https://clerk.com/docs) (`@clerk/clerk-react`) — JWT authentication, user profile management, and route protection via `ProtectedRoute.tsx`.

### Content Rendering & Math Support
- **Markdown Parser**: `react-markdown` + `remark-gfm` — Renders GitHub Flavored Markdown tables, alerts, and formatting.
- **Math LaTeX Engine**: `katex` + `rehype-katex` / `remark-math` — High-speed LaTeX inline `\(...\)` and block `$$...$$` mathematical expression rendering.

---

## 📂 Frontend File Architecture

```text
frontend/
├── public/                       # Static public assets & brand icons
├── src/                          # React application source code
│   ├── App.css                   # Global app utility styles
│   ├── App.tsx                   # Main React app router, Clerk provider & toast provider
│   ├── index.css                 # Core CSS design system, Tailwind directives & glassmorphism utilities
│   ├── main.tsx                  # React DOM root entrypoint
│   ├── vite-env.d.ts             # Vite environment typescript declarations
│   ├── components/               # Reusable UI & Layout components
│   │   ├── AgentModeLayout.tsx   # Autonomous Agent mode layout wrapper
│   │   ├── DashboardLayout.tsx   # Dashboard navigation sidebar, top header & user menu
│   │   ├── ProtectedRoute.tsx    # Clerk authenticated route guard
│   │   ├── agent/                # Autonomous Agent visual cards & stepper components
│   │   │   ├── AgentGoalInput.tsx        # Research goal input card with prompt suggestion pills
│   │   │   ├── AgentHeaderBanner.tsx     # Cockpit header banner with fast-path status badges
│   │   │   ├── AgentStepperView.tsx      # Live ReAct execution progress bar & working memory scratchpad
│   │   │   ├── DatasetsBenchmarksCard.tsx # SOTA dataset & benchmark recommendation card
│   │   │   ├── ExperimentPlanCard.tsx    # Multi-stage experiment execution roadmap card
│   │   │   ├── LiteratureReviewCard.tsx  # Literature survey & background synthesis card
│   │   │   ├── ProposedDirectionsCard.tsx# Formulated research directions & problem statements card
│   │   │   └── SelfCritiqueCard.tsx      # Peer-review grounding score & citation validation card
│   │   ├── landing/              # Landing page visual sections
│   │   └── ui/                   # shadcn/ui component library (buttons, inputs, cards, skeletons, tabs)
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Helper libraries & API utilities
│   │   ├── api-client.ts         # Async fetch wrapper with Clerk JWT Bearer token injection
│   │   ├── clerk-auth-appearance.ts # Clerk custom dark theme styling config
│   │   ├── error-handler.ts      # Standardized backend HTTP error code parser & user toast notifier
│   │   ├── save-toast.ts         # Item saved feedback toast notifier
│   │   ├── scroll-to-result.ts   # Smooth scroll-to-element utility
│   │   └── utils.ts              # Tailwind class merging utility (`clsx` + `tailwind-merge`)
│   ├── pages/                    # Main Application Page Views
│   │   ├── AgentMode.tsx         # Autonomous Agent cockpit with SSE stream consumer
│   │   ├── CitationIntelligence.tsx # Real-time citation graph matching & literature discovery
│   │   ├── DashboardHome.tsx     # High-density research dashboard with dynamic active stats
│   │   ├── DatasetBenchmarkFinder.tsx # Dataset & benchmark discovery view
│   │   ├── ExperimentPlanner.tsx # Multi-stage experiment roadmap generator view
│   │   ├── GapDetection.tsx      # Paper research limitation & gap detector view
│   │   ├── LandingPage.tsx       # Marketing landing page
│   │   ├── LoginPage.tsx         # Clerk user login view
│   │   ├── NotFound.tsx          # 404 error fallback page
│   │   ├── PaperAnalyzer.tsx     # PDF paper analyzer with 100% mobile-responsive layout & Q&A
│   │   ├── ProblemGenerator.tsx  # Research problem statement generator view
│   │   ├── SettingsPage.tsx      # User settings & saved items library view
│   │   └── SignupPage.tsx        # Clerk user signup view
│   └── test/                     # Frontend unit tests
├── .env.local                    # Local environment settings (Clerk keys & API URL)
├── index.html                    # Root HTML document template
├── package.json                  # NPM dependencies & scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS theme extension & color tokens
├── tsconfig.json                 # TypeScript compiler configuration
├── vercel.json                   # Vercel SPA routing rewrite rules
└── vite.config.ts                # Vite bundler & SWC plugin configuration
```

---

## 🚀 Setup & Local Development (Windows / Linux / macOS)

### 1. Installation

```powershell
# Navigate to frontend directory
cd frontend

# Install NPM dependencies
npm install
```

### 2. Environment Configuration (`frontend/.env.local`)

Create a `frontend/.env.local` file:

```env
# Clerk Authentication Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API Endpoint URL
VITE_API_URL=http://localhost:8000
```
*(When deploying to production, set `VITE_API_URL` to your production backend URL, e.g. `https://your-backend.onrender.com`).*

### 3. Run Local Development Server

```powershell
npm run dev
```
Local development app will be available at: `http://localhost:8080` (or `http://localhost:5173`).

---

## 🗺️ Application Route Directory

| Path | Component | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage.tsx` | No | Marketing landing page |
| `/login` | `LoginPage.tsx` | No | Clerk Sign-in view |
| `/signup` | `SignupPage.tsx` | No | Clerk Sign-up view |
| `/dashboard` | `DashboardHome.tsx` | Yes | High-density research dashboard with 6-stat cards & recent paper feed |
| `/dashboard/agent` | `AgentMode.tsx` | Yes | Autonomous ReAct agent cockpit with real-time SSE stream |
| `/dashboard/analyzer` | `PaperAnalyzer.tsx` | Yes | PDF paper analyzer with 100% mobile responsive layout & document chat |
| `/dashboard/planner` | `ExperimentPlanner.tsx` | Yes | Multi-stage experiment roadmap generator |
| `/dashboard/generator` | `ProblemGenerator.tsx` | Yes | Research problem statement & unexplored direction generator |
| `/dashboard/gaps` | `GapDetection.tsx` | Yes | Paper methodology gap & limitation detector |
| `/dashboard/dataset-benchmarks` | `DatasetBenchmarkFinder.tsx` | Yes | Dataset & benchmark recommendation finder |
| `/dashboard/citation` | `CitationIntelligence.tsx` | Yes | Academic citation graph & literature discovery view |
| `/dashboard/settings` | `SettingsPage.tsx` | Yes | User library & saved item manager |

---

## 📱 Mobile Responsiveness & Desktop Layout Features

1. **Paper Analyzer Responsive Design**:
   - **Desktop (`≥ lg`)**: Side-by-side resizable split panels (`ResizablePanelGroup direction="horizontal"`) with interactive drag handle and double-click reset.
   - **Mobile (`< lg`)**: Full-width stacked layout. The **Summarize / Analysis Result** card is displayed at the top with a dedicated **scrollable container element** (`h-[460px] overflow-y-auto`), followed directly underneath by the **Chat with Paper** chatbot card.

2. **Dashboard High-Density Grid**:
   - Dynamically filters out zero-count stats and automatically stretches active cards across equal-width desktop columns (`lg:grid-cols-6`, `lg:grid-cols-4`, etc.).

---

## 🧪 Build & Type Check Verification

```powershell
# Run TypeScript compilation check
npx tsc --noEmit

# Build production bundle
npm run build
```
