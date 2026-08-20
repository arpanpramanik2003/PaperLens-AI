import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { ShinyButton } from "@/components/ui/shiny-button";
import ReasoningLoopFlow from "./ReasoningLoopFlow";

const ease = [0.2, 0, 0, 1] as const;

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
    label: "Goal Deconstruction & Query Formulation",
    tool: "AgentPlanner.decompose",
    duration: "240ms",
    status: "complete",
    detail: "Extracted 3 sub-hypotheses focusing on patch projection latency and linear attention approximations.",
  },
  {
    id: "step-2",
    label: "Citation Signal & Prior Literature Ingestion",
    tool: "CitationGraph.retrieve_k_neighbors",
    duration: "410ms",
    status: "complete",
    detail: "Fetched 18 top-impact papers across NeurIPS/ICLR on mobile Vision Transformer efficiency.",
  },
  {
    id: "step-3",
    label: "Cross-Paper Gap Analysis & Novelty Synthesis",
    tool: "NoveltyValidator.synthesize_matrix",
    duration: "620ms",
    status: "complete",
    detail: "Identified unexplored trade-off between KV-cache quantization and token pruning on edge hardware.",
  },
  {
    id: "step-4",
    label: "Adversarial Stress Testing & Self-Critique",
    tool: "SelfCritique.evaluate_boundary_conditions",
    duration: "380ms",
    status: "complete",
    detail: "Flagged potential latency measurement variance on INT8 tensor cores; added ablation control guardrails.",
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
    badge: "18 Papers Synthesized",
    content: {
      heading: "State of Efficient Vision Transformers on Edge Compute",
      summary:
        "Recent advances focus on hybrid token pruning (SpViT) and kernel-level linear attention (FastViT). However, memory bandwidth bottlenecks during cross-attention remain unaddressed in low-power NPU architectures.",
      items: [
        "Prior SOTA achieves 78.4% Top-1 accuracy at 4.2ms latency on Snapdragon 8 Gen 2.",
        "KV-cache footprint expands quadratically for dense feature maps beyond 512x512 resolution.",
        "Existing pruning algorithms discard spatially critical boundary tokens in object detection tasks.",
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
      heading: "Academic Rigor, Boundary Conditions & Failure Modes",
      summary:
        "The agent adversarially challenged its own hypotheses to identify subtle confounders, measurement pitfalls, and reviewer objections before experiment execution.",
      items: [
        "Potential Confounder: Warm-up cache effects on ARM CPUs may artificially deflate initial latency numbers.",
        "Boundary Limitation: Dynamic gating may cause non-deterministic tensor shapes on fixed-graph compilers (TensorRT/ONNX).",
        "Reviewer Defense: Added a dedicated Section 4.3 measuring static graph export overhead to preempt compiler-compatibility objections.",
      ],
      provenance: "Synthesized via automated multi-agent adversarial debate protocol.",
    },
  },
];

export default function AgentModeSection() {
  const [activeTabId, setActiveTabId] = useState<string>("directions");
  const [selectedStepId, setSelectedStepId] = useState<string>("step-3");

  const activeTab = outputTabs.find((t) => t.id === activeTabId) || outputTabs[0];

  return (
    <section id="agent-mode" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-research flex items-center gap-1.5 px-3.5 py-1.5">
              <Bot className="w-4 h-4 text-accent" />
              <span>Flagship Autonomous Engine</span>
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            One Research Goal. <span className="text-gradient-research">Autonomous Multi-Step Discovery.</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            Define your open-ended research hypothesis. The PaperLens Autonomous Agent plans, queries citation graphs,
            synthesizes literature, stress-tests ideas, and produces publication-grade discovery dossiers with zero manual friction.
          </p>
        </motion.div>

        {/* The Showcase Cockpit */}
        <motion.div
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active Run
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 flex-shrink-0 mt-0.5">
                  <Terminal className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Target Research Objective
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    “Evaluate vision transformer edge-latency bottlenecks on ARM NPUs and synthesize a reproducible ablation protocol for adaptive saliency gating.”
                  </p>
                </div>
              </div>

              <Link to="/agent" className="flex-shrink-0">
                <ShinyButton variant="hero" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
                  Launch Agent Mode <ArrowRight className="w-3.5 h-3.5" />
                </ShinyButton>
              </Link>
            </div>
          </div>

          {/* Interactive SVG Flow Diagram */}
          <ReasoningLoopFlow
            activeStepId={selectedStepId}
            onSelectStep={(stepId) => setSelectedStepId(stepId)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
            <div className="lg:col-span-5 p-4 sm:p-6 bg-muted/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Autonomous Execution Trace
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">4/4 Steps Done</span>
                </div>

                <div className="space-y-2.5">
                  {traceSteps.map((step) => {
                    const isSelected = selectedStepId === step.id;
                    return (
                      <motion.div
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
                            ? "bg-card border-accent/50 shadow-xs ring-1 ring-accent/30"
                            : "bg-card/60 border-border hover:bg-card hover:border-border/80"
                        }`}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success text-[10px] font-bold" aria-hidden="true">
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
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Hallucination Guard active
                </span>
                <span className="font-mono text-accent">Confidence: 98.6%</span>
              </div>
            </div>

            <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-card">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border overflow-x-auto gap-2">
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
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isActive
                              ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                              : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Header with Title & Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                        <activeTab.icon className="w-4 h-4 text-accent" />
                        {activeTab.content.heading}
                      </h4>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent whitespace-nowrap self-start sm:self-auto">
                        {activeTab.badge}
                      </span>
                    </div>

                    {/* Summary Box */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-muted/40 border border-border">
                      {activeTab.content.summary}
                    </p>

                    {/* Key Synthesized Items */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Synthesized Key Insights
                      </div>
                      {activeTab.content.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/70 text-xs text-foreground/90 shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Provenance Badge */}
                    <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20 flex items-center justify-between text-[11px] text-muted-foreground">
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
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
                  <div className="font-bold text-foreground">Zero Manual Prompts</div>
                  <div className="text-[10px] text-muted-foreground">Full loop autonomy</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
                  <div className="font-bold text-foreground">Audit Trail</div>
                  <div className="text-[10px] text-muted-foreground">Receipts for every tool</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
                  <div className="font-bold text-foreground">1-Click Export</div>
                  <div className="text-[10px] text-muted-foreground">PDF, LaTeX & Markdown</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
