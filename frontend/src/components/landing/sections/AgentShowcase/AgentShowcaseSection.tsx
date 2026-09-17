import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ArrowRight,
  CheckCircle2,
  Code2,
  Layers,
  BookOpen,
  Lightbulb,
  FlaskConical,
  Database,
  Scale,
  Terminal,
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { Link } from "react-router-dom";
import ReasoningFlowCircuit from "./ReasoningFlowCircuit";
import AcademicBadge from "../../ui/AcademicBadge";
import SectionHeader from "../../ui/SectionHeader";
import KeyCap from "../../ui/KeyCap";
import { reviewerCritiques } from "../../data/interactiveDemoData";

const ease = [0.16, 1, 0.3, 1] as const;

interface TraceStep {
  id: string;
  label: string;
  tool: string;
  duration: string;
  status: "complete" | "running" | "queued";
  detail: string;
}

const traceSteps: TraceStep[] = [
  {
    id: "step-1",
    label: "Goal Deconstruction & Sub-Hypotheses",
    tool: "AgentPlanner.decompose",
    duration: "240ms",
    status: "complete",
    detail: "Extracted 3 testable sub-hypotheses focusing on patch projection latency and linear attention approximations.",
  },
  {
    id: "step-2",
    label: "Citation Graph Ingestion & Traversal",
    tool: "CitationGraph.retrieve_k_neighbors",
    duration: "410ms",
    status: "complete",
    detail: "Fetched 18 top-impact papers across NeurIPS/ICLR on mobile Vision Transformer efficiency with citation lineages.",
  },
  {
    id: "step-3",
    label: "Cross-Paper Gap Analysis & Novelty Check",
    tool: "NoveltyValidator.synthesize_matrix",
    duration: "620ms",
    status: "complete",
    detail: "Identified unexplored trade-off between KV-cache quantization and early saliency gating on ARM NPUs.",
  },
  {
    id: "step-4",
    label: "Adversarial Stress Testing & Self-Critique",
    tool: "SelfCritique.evaluate_boundary_conditions",
    duration: "380ms",
    status: "complete",
    detail: "Flagged potential latency jitter on INT8 tensor cores; generated automated ablation controls.",
  },
];

interface OutputTab {
  id: string;
  title: string;
  icon: typeof BookOpen;
  badge: string;
  content: {
    heading: string;
    summary: string;
    items: string[];
    provenance: string;
  };
}

const outputTabs: OutputTab[] = [
  {
    id: "lit-review",
    title: "Literature Review",
    icon: BookOpen,
    badge: "18 Papers Grounded",
    content: {
      heading: "State of Efficient Vision Transformers on Edge Hardware",
      summary:
        "Recent advances focus on structural token pruning (SpViT) and kernel-level linear attention (FastViT). However, memory bandwidth bottlenecks during cross-attention remain unaddressed in low-power NPU architectures.",
      items: [
        "Prior SOTA achieves 78.4% Top-1 accuracy at 4.2ms latency on Snapdragon 8 Gen 2.",
        "KV-cache footprint expands quadratically for dense feature maps beyond 512x512 resolution.",
        "Existing pruning algorithms discard spatially critical boundary tokens in object localization tasks.",
      ],
      provenance: "Anchored to 18 verified arXiv/CVPR DOIs with sentence-level citations.",
    },
  },
  {
    id: "directions",
    title: "Novel Directions",
    icon: Lightbulb,
    badge: "3 Hypotheses Generated",
    content: {
      heading: "Adaptive Hardware-Aware Saliency Gating (AHSG)",
      summary:
        "Proposes dynamic token sparsification guided by lightweight early-layer saliency heads, bypassing redundant patch computation without altering final classification heads.",
      items: [
        "Hypothesis 1: Early-exit saliency routing reduces edge latency by 32% with < 0.4% Top-1 accuracy delta.",
        "Hypothesis 2: Mixed-precision 4-bit attention masks prevent memory bandwidth saturation during burst inference.",
        "Novelty Check: Zero prior publications combining dynamic saliency gating with INT4 attention on ARM NPUs.",
      ],
      provenance: "Cross-verified against Semantic Scholar index with 0 duplicate proposals found.",
    },
  },
  {
    id: "experiments",
    title: "Experiment Blueprint",
    icon: FlaskConical,
    badge: "Ablation Protocol Ready",
    content: {
      heading: "End-to-End Ablation Matrix & Measurement Setup",
      summary:
        "Standardized protocol evaluating throughput, latency percentiles (P95/P99), and Top-1 accuracy against MobileNetV4, EfficientFormerV2, and FastViT baselines.",
      items: [
        "Hardware Target: NVIDIA Jetson Orin Nano (15W) & Raspberry Pi 5 (ARM Cortex-A76).",
        "Baselines: FastViT-SA12, EfficientFormer-L1, MobileNetV4-Conv-Medium.",
        "Ablation Matrix: 4-stage ablation testing gating ratio (10%–50%), batch size (1, 8, 32), and INT4 vs FP16 precision.",
      ],
      provenance: "Includes reproducible PyTorch execution snippet and exact seed initialization settings.",
    },
  },
  {
    id: "benchmarks",
    title: "Datasets & Benchmarks",
    icon: Database,
    badge: "4 Verified Benchmarks",
    content: {
      heading: "Benchmark Alignment & Evaluation Protocol",
      summary:
        "Curated standard evaluation datasets with exact validation splits and established reporting metrics to ensure fair comparison with published literature.",
      items: [
        "ImageNet-1K (ILSVRC2012): 50,000 validation images for zero-shot classification evaluation.",
        "MS COCO 2017: Val2017 (5,000 images) using Mask R-CNN backbones for downstream dense prediction transfer.",
        "EdgeLatency-100: Real-time on-device inference profiling across 100 standardized test batches.",
      ],
      provenance: "Direct links to HuggingFace / PapersWithCode benchmarks and reference leaderboard scores.",
    },
  },
  {
    id: "critique",
    title: "Self-Critique",
    icon: Scale,
    badge: "Adversarial Stress Test",
    content: {
      heading: "Academic Rigor, Boundary Conditions & Reviewer Defense",
      summary:
        "The agent adversarially challenged its own hypotheses to identify subtle confounders, measurement pitfalls, and reviewer objections before experiment execution.",
      items: [
        "Potential Confounder: Warm-up cache effects on ARM CPUs artificially deflate initial latency numbers.",
        "Boundary Limitation: Dynamic gating causes non-deterministic tensor shapes on fixed-graph compilers (TensorRT/ONNX).",
        "Reviewer Defense: Added a dedicated Section 4.3 measuring static graph export overhead to preempt compiler objections.",
      ],
      provenance: "Synthesized via automated multi-agent adversarial critique protocol.",
    },
  },
];

export default function AgentShowcaseSection() {
  const [activeTabId, setActiveTabId] = useState<string>("directions");
  const [selectedStepId, setSelectedStepId] = useState<string>("step-3");
  const [reviewerTwoMode, setReviewerTwoMode] = useState<boolean>(false);

  const activeTab = outputTabs.find((t) => t.id === activeTabId) || outputTabs[0];

  return (
    <section id="agent-mode" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Section Header */}
        <SectionHeader
          badgeText="Flagship Autonomous Engine"
          badgeIcon={<Bot className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="cobalt"
          title="One Research Objective."
          titleAccent="Autonomous Multi-Step Discovery."
          description="Define an open-ended research hypothesis. The PaperLens Autonomous Agent plans, traverses citation graphs, synthesizes prior literature, stress-tests ideas, and outputs publication-grade discovery dossiers with zero manual friction."
        />

        {/* The Showcase Cockpit */}
        <motion.div
          className="academic-card rounded-2xl overflow-hidden border border-border/80 dark:border-white/12 bg-card shadow-academic-lg"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 dark:border-white/10 bg-muted/40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
              </div>
              <span className="text-xs font-medium text-muted-foreground ml-2 font-mono">
                paperlens-agent-orchestrator :: v2.4.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Session Active • Zero Hallucinations
              </span>
            </div>
          </div>

          {/* Research Objective Banner */}
          <div className="p-4 sm:p-5 border-b border-border/70 dark:border-white/10 bg-muted/20">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 flex-shrink-0 mt-0.5">
                  <Terminal className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 font-mono">
                    Target Research Objective
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    “Evaluate vision transformer edge-latency bottlenecks on ARM NPUs and synthesize a reproducible ablation protocol for adaptive saliency gating.”
                  </p>
                </div>
              </div>

              <Link to="/agent" className="flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
                >
                  <span>Launch Agent Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Interactive SVG Flow Circuit */}
          <ReasoningFlowCircuit
            activeStepId={selectedStepId}
            onSelectStep={(stepId) => setSelectedStepId(stepId)}
          />

          {/* Split Cockpit: Left Execution Trace, Right Output Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70 dark:divide-white/10">
            {/* Left Col: Execution Trace Feed (5 Cols) */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-muted/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Execution Trace Feed
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    4/4 Steps Complete
                  </span>
                </div>

                <div className="space-y-2.5">
                  {traceSteps.map((step) => {
                    const isSelected = selectedStepId === step.id;
                    return (
                      <div
                        key={step.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedStepId(step.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedStepId(step.id);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? "bg-card border-accent/60 shadow-xs ring-1 ring-accent/30"
                            : "bg-card/60 border-border/70 hover:bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate">
                              {step.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                            {step.duration}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-md w-fit mb-1.5">
                          <Code2 className="w-3 h-3" />
                          {step.tool}
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/70 dark:border-white/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Hallucination Guard: Active
                </span>
                <span className="text-accent font-semibold">Provenance: 99.4%</span>
              </div>
            </div>

            {/* Right Col: Verified Synthesized Dossier (7 Cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-card">
              <div>
                {/* Dossier Tabs */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/70 dark:border-white/10 overflow-x-auto gap-2">
                  <div className="flex items-center gap-1.5 flex-nowrap" role="tablist">
                    {outputTabs.map((tab) => {
                      const isActive = activeTabId === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveTabId(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            isActive
                              ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                              : "bg-muted/40 border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Header with Title & Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                        <activeTab.icon className="w-4 h-4 text-accent" />
                        {activeTab.content.heading}
                      </h4>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent whitespace-nowrap self-start sm:self-auto font-mono">
                        {activeTab.badge}
                      </span>
                    </div>

                    {/* Whimsical "Reviewer 2 Mode" Toggle (in Self-Critique Tab) */}
                    {activeTab.id === "critique" && (
                      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <div>
                            <span className="font-semibold text-foreground">Peer Review Simulation:</span>{" "}
                            <span className="text-muted-foreground text-[11px]">
                              Switch between Co-Pilot and brutal peer reviewer
                            </span>
                          </div>
                        </div>

                        <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setReviewerTwoMode(false)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                              !reviewerTwoMode
                                ? "bg-accent text-accent-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Co-Pilot Mode
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewerTwoMode(true)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                              reviewerTwoMode
                                ? "bg-destructive text-destructive-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>Reviewer #2</span>
                            <span className="text-[10px]">🔥</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Summary Box (Dynamically switches if Reviewer 2 Mode is on in critique tab) */}
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      {activeTab.id === "critique" && reviewerTwoMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-destructive font-mono uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {reviewerCritiques.reviewerTwo.headline}
                          </div>
                          <p className="text-xs text-foreground/90 leading-relaxed">
                            "{reviewerCritiques.reviewerTwo.body}"
                          </p>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                            Recommendation: {reviewerCritiques.reviewerTwo.recommendation}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">
                          {activeTab.content.summary}
                        </p>
                      )}
                    </div>

                    {/* Synthesized Key Items */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Synthesized Insights & Proof Signals
                      </div>
                      {activeTab.content.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/70 text-xs text-foreground/90 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Provenance Footer */}
                    <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-accent" />
                        {activeTab.content.provenance}
                      </span>
                      <span className="font-semibold text-accent flex items-center gap-0.5">
                        Verified <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Quick Feature Highlights */}
              <div className="mt-6 pt-4 border-t border-border/70 dark:border-white/10 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-muted/20 border border-border/60">
                  <div className="font-bold text-foreground">Zero Manual Prompts</div>
                  <div className="text-[10px] text-muted-foreground">Full loop autonomy</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/20 border border-border/60">
                  <div className="font-bold text-foreground">Audit Trail</div>
                  <div className="text-[10px] text-muted-foreground">Receipts for every tool</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/20 border border-border/60">
                  <div className="font-bold text-foreground">1-Click Export</div>
                  <div className="text-[10px] text-muted-foreground">PDF, LaTeX & BibTeX</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
