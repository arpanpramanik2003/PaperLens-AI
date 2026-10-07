import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText,
  BarChart3,
  Search,
  FlaskConical,
  Brain,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import SectionHeader from "../../ui/SectionHeader";
import AcademicBadge from "../../ui/AcademicBadge";

const PaperAnalyzerWindow = lazy(() => import("./windows/PaperAnalyzerWindow"));
const CitationIntelligenceWindow = lazy(() => import("./windows/CitationIntelligenceWindow"));
const GapDetectionWindow = lazy(() => import("./windows/GapDetectionWindow"));
const ExperimentPlannerWindow = lazy(() => import("./windows/ExperimentPlannerWindow"));

interface CapabilityTab {
  id: string;
  label: string;
  icon: typeof FileText;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  route: string;
  routeLabel: string;
}

const workstationTabs: CapabilityTab[] = [
  {
    id: "analyzer",
    label: "Paper Deconstructor",
    icon: FileText,
    badge: "AST Equation Parsing",
    title: "Deconstruct Complex Proofs & Methodology",
    description:
      "Upload dual-column academic PDFs or paste arXiv links. PaperLens decomposes dense papers into structured AST representations, extracting mathematical proofs, key assumptions, and baseline caveats with zero context truncation.",
    highlights: [
      "Dual-column OCR & LaTeX mathematical proof extraction",
      "Interactive Q&A grounded directly in paper claims",
      "Confidence-scored methodology breakdown & limitations",
    ],
    route: "/dashboard/analyzer",
    routeLabel: "Launch Paper Analyzer",
  },
  {
    id: "citations",
    label: "Citation Intelligence",
    icon: BarChart3,
    badge: "Semantic Scholar Index",
    title: "Cross-Reference Literature & Influence Graphs",
    description:
      "Extract every reference from your paper, query live Semantic Scholar metadata, and rank citations by academic influence score. Identify prerequisite reading and downstream papers in seconds.",
    highlights: [
      "Automated DOI resolution and citation count tracking",
      "AI-guided 'Must-Read' prioritization algorithm",
      "Sub-second citation lineage linking across top venues",
    ],
    route: "/dashboard/citation-intelligence",
    routeLabel: "Explore Citation Intelligence",
  },
  {
    id: "gaps",
    label: "Gap Detection Engine",
    icon: Search,
    badge: "Novelty Validation",
    title: "Identify Unexplored Research Frontiers",
    description:
      "Scan existing publications and identify unaddressed trade-offs, missing baseline comparisons, and dataset limitations. Transform identified blind spots into high-novelty research directions.",
    highlights: [
      "Categorizes gaps by severity (Critical, High, Moderate)",
      "Pinpoints missing adversarial & robustness checks",
      "Actionable research recommendations to establish novelty",
    ],
    route: "/dashboard/gaps",
    routeLabel: "Open Gap Detection Engine",
  },
  {
    id: "planner",
    label: "Experiment & Ablation Planner",
    icon: FlaskConical,
    badge: "Reproducible Protocol",
    title: "Design Rigorous, Reproducible Ablation Matrices",
    description:
      "Generate end-to-end experimental protocols complete with dataset split recommendations, baseline models, hyperparameter configurations, and multi-stage ablation controls.",
    highlights: [
      "Multi-stage ablation matrix isolating independent variables",
      "Hardware target profiling (NVIDIA Jetson, ARM NPUs, GPUs)",
      "Standardized evaluation metrics (P95/P99 latency, ROC-AUC)",
    ],
    route: "/dashboard/planner",
    routeLabel: "Open Experiment Planner",
  },
];

function WorkstationWindowSkeleton() {
  return (
    <div className="w-full h-[460px] rounded-2xl border border-border bg-card animate-pulse flex flex-col p-4">
      <div className="flex gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-muted" />
        <div className="w-3 h-3 rounded-full bg-muted" />
        <div className="w-3 h-3 rounded-full bg-muted" />
      </div>
      <div className="w-1/2 h-6 bg-muted/60 rounded mb-4" />
      <div className="flex-1 bg-muted/20 rounded-xl" />
    </div>
  );
}

export default function WorkstationSection() {
  const [activeTabId, setActiveTabId] = useState<string>("analyzer");
  const activeTab = workstationTabs.find((t) => t.id === activeTabId) || workstationTabs[0];

  return (
    <section id="features" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Section Header */}
        <SectionHeader
          badgeText="Complete Research Toolchain"
          badgeIcon={<FlaskConical className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="cobalt"
          title="Four Specialized Instruments."
          titleAccent="One Integrated Workbench."
          description="Everything academic scholars need to transform dense literature into publishable directions—from structural AST deconstruction and citation graphs to gap detection and ablation planning."
        />

        {/* Tab Navigation Pill Strip */}
        <div className="flex items-center justify-center mb-8 sm:mb-12 overflow-x-auto pb-2">
          <div className="inline-flex p-1 rounded-2xl border border-border/80 dark:border-white/10 bg-muted/30 backdrop-blur-md gap-1">
            {workstationTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-card text-foreground shadow-xs font-semibold border border-border/70 dark:border-white/12"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-accent" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Capability Workbench Frame */}
        <div className="academic-card rounded-2xl overflow-hidden border border-border/80 dark:border-white/12 bg-card p-6 sm:p-8 lg:p-10 shadow-academic-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Capability Editorial Details (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <AcademicBadge variant="gold">
                {activeTab.badge}
              </AcademicBadge>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-snug">
                {activeTab.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeTab.description}
              </p>

              <div className="space-y-2.5 pt-2 border-t border-border/60">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Methodological Capabilities
                </div>
                {activeTab.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link to={activeTab.route}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
                  >
                    <span>{activeTab.routeLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: Interactive Live Window Mockup (7 Cols) */}
            <div className="lg:col-span-7 h-[440px] sm:h-[480px]">
              <Suspense fallback={<WorkstationWindowSkeleton />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    {activeTab.id === "analyzer" && <PaperAnalyzerWindow />}
                    {activeTab.id === "citations" && <CitationIntelligenceWindow />}
                    {activeTab.id === "gaps" && <GapDetectionWindow />}
                    {activeTab.id === "planner" && <ExperimentPlannerWindow />}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </div>
        </div>

        {/* Supplementary Instruments Strip (Problem Generator & Benchmark Finder) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/dashboard/generator"
            className="academic-card rounded-xl p-4 sm:p-5 border border-border/70 dark:border-white/8 bg-card/60 hover:bg-card transition-all group flex items-start gap-4"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  Problem Statement Generator
                </h4>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Transform domain interests into concrete, falsifiable research hypotheses with novelty ratings.
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard/dataset-benchmarks"
            className="academic-card rounded-xl p-4 sm:p-5 border border-border/70 dark:border-white/8 bg-card/60 hover:bg-card transition-all group flex items-start gap-4"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  Dataset & Benchmark Finder
                </h4>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Match experimental domains against verified leaderboards, HuggingFace splits, and evaluation metrics.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
