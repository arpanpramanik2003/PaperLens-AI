import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/clerk-react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded routes for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const PaperAnalyzer = lazy(() => import("./pages/PaperAnalyzer"));
const ExperimentPlanner = lazy(() => import("./pages/ExperimentPlanner"));
const ProblemGenerator = lazy(() => import("./pages/ProblemGenerator"));
const GapDetection = lazy(() => import("./pages/GapDetection"));
const DatasetBenchmarkFinder = lazy(() => import("./pages/DatasetBenchmarkFinder"));
const CitationIntelligence = lazy(() => import("./pages/CitationIntelligence"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AgentMode = lazy(() => import("./pages/AgentMode"));
const AgentModeLayout = lazy(() => import("./components/AgentModeLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const PageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
    <Loader2 className="w-8 h-8 text-accent animate-spin" />
    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Loading PaperLens AI...</p>
  </div>
);

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route 
                path="/agent"
                element={
                  <ProtectedRoute>
                    <AgentModeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AgentMode />} />
              </Route>
              <Route 
                path="/dashboard" 
                element={<DashboardLayout />}
              >
                <Route index element={<DashboardHome />} />
                <Route path="analyzer" element={<PaperAnalyzer />} />
                <Route path="planner" element={<ExperimentPlanner />} />
                <Route path="generator" element={<ProblemGenerator />} />
                <Route path="gaps" element={<GapDetection />} />
                <Route path="dataset-benchmarks" element={<DatasetBenchmarkFinder />} />
                <Route path="citation-intelligence" element={<CitationIntelligence />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
