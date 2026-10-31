import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bot,
  ArrowRight,
  Code2,
  FileText,
  GitBranch,
  Cpu,
  CheckCircle2,
  Terminal,
  Activity,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Binary,
  Layers,
  ChevronRight,
} from "lucide-react";
import SectionHeader from "../../ui/SectionHeader";

interface PresetStepEvidence {
  badge: string;
  badgeType: "success" | "warning" | "accent";
  title: string;
  detail: string;
  codeSnippet?: string;
  metrics?: { label: string; value: string }[];
  bulletPoints: string[];
}

interface InvestigationStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tool: string;
  duration: string;
  evidence: PresetStepEvidence;
}

interface ResearchPreset {
  id: string;
  tag: string;
  paperTitle: string;
  arxivId: string;
  hypothesis: string;
  steps: InvestigationStep[];
}

const RESEARCH_PRESETS: ResearchPreset[] = [
  {
    id: "flash-attention",
    tag: "Hardware Architecture",
    paperTitle: "FlashAttention-3: Fast and Accurate Attention with Asynchrony",
    arxivId: "arXiv:2407.08608",
    hypothesis:
      "Audit whether Equation 3 eliminates memory-bound softmax overhead without precision degradation during FP8 tensor core accumulation.",
    steps: [
      {
        id: "step-1",
        number: "01",
        title: "Mathematical Proof & Causal Masking",
        subtitle: "Verifies asynchronous GEMM and softmax overlap equations",
        tool: "ast_proof_engine",
        duration: "0.42s",
        evidence: {
          badge: "Derivation Verified",
          badgeType: "success",
          title: "Hardware Asynchrony & Softmax Interleaving",
          detail:
            "Deconstructed Eq. 3 & Eq. 4. Verified non-blocking tensor core warp specialization against causal lower-triangular constraints.",
          codeSnippet: `// Interleaved Softmax + GEMM Loop
__device__ void async_flash_attn_step(
  TensorCoreWarp& warp_gemm, 
  SoftmaxWarp& warp_softmax
) {
  warp_gemm.issue_async_tile(Q, K_next); // sm_90a TMA
  warp_softmax.rescale_accumulators(S_prev, P_curr);
}`,
          metrics: [
            { label: "Memory Bandwidth", value: "1.74 TB/s" },
            { label: "Arithmetic Intensity", value: "94.2%" },
            { label: "Proof Confidence", value: "99.4%" },
          ],
          bulletPoints: [
            "Softmax normalization scales as O(N) in SRAM, bypassing HBM writeback entirely.",
            "Boundary conditions hold for sequence lengths N up to 128k with zero NaN hazards.",
          ],
        },
      },
      {
        id: "step-2",
        number: "02",
        title: "Citation Lineage & Prior Art",
        subtitle: "Traces algorithmic delta against FlashAttention-2 and Milakov (2018)",
        tool: "citation_graph_spider",
        duration: "1.18s",
        evidence: {
          badge: "24 Citations Reconciled",
          badgeType: "accent",
          title: "Algorithmic Lineage & Dependency Graph",
          detail:
            "Reconciled 24 foundational papers. Isolated the exact architectural delta separating Hopper asynchronous pipelines from Ada Lovelace implementations.",
          metrics: [
            { label: "Root Lineage", value: "Dao et al. (2022)" },
            { label: "Prior Delta", value: "Hardware WGMMA" },
            { label: "Uncited Prior Art", value: "None Detected" },
          ],
          bulletPoints: [
            "Builds directly on Online Softmax (Milakov & Gimelshein, 2018) with FP8 precision scaling.",
            "Replaces synchronous barrier synchronization with ping-pong shared memory buffers.",
            "Subsequent follow-ups: 6 independent implementations confirmed in vLLM and TensorRT-LLM.",
          ],
        },
      },
      {
        id: "step-3",
        number: "03",
        title: "Kernel & Reproducibility Audit",
        subtitle: "Scans official CUDA repo for accumulator drift and compiler gotchas",
        tool: "repo_kernel_auditor",
        duration: "0.68s",
        evidence: {
          badge: "Reproducibility Validated",
          badgeType: "warning",
          title: "Kernel Implementation & Hardware Caveat",
          detail:
            "Audited official CUDA/CUTLASS kernel implementation. Detected FP8 mantissa truncation risk under non-standard learning rate warmups.",
          codeSnippet: `# Reproducibility Flag: sm_90a FP8 Accumulation
# Warning: Mantissa bits reduced to 3 in E5M2 format.
# Requires tensor-wise scaling factors to avoid gradient underflow.
CUDA_FLAGS += -arch=sm_90a --use_fast_math -DENABLE_FP8_FAST_ACCUM`,
          metrics: [
            { label: "Kernel Target", value: "NVIDIA Hopper sm_90a" },
            { label: "Max Speedup", value: "2.1x over FA2" },
            { label: "Gotcha Severity", value: "Medium (Config)" },
          ],
          bulletPoints: [
            "Peak theoretical TFLOPS requires explicit warp group synchronization (wgmma.async).",
            "Hardware requirement strictly requires compute capability >= 9.0; falls back to FA2 on older GPUs.",
          ],
        },
      },
    ],
  },
  {
    id: "flow-matching",
    tag: "Generative Models",
    paperTitle: "Flow Matching for Generative Modeling",
    arxivId: "arXiv:2210.02747",
    hypothesis:
      "Verify velocity field boundary consistency as t approaches 0 and quantify sample quality stability under classifier-free guidance.",
    steps: [
      {
        id: "step-1",
        number: "01",
        title: "Vector Field ODE Integration",
        subtitle: "Deconstructs probability paths and optimal transport vectors",
        tool: "ast_proof_engine",
        duration: "0.38s",
        evidence: {
          badge: "Boundary Condition Verified",
          badgeType: "success",
          title: "Conditional Vector Field Integration",
          detail:
            "Decomposed straight probability path equation: dX_t = (x_1 - (1 - (1 - sigma_min) * t) * x_0) dt. Verified velocity field Lipschitz continuity.",
          codeSnippet: `# Continuous Normalizing Flow Vector Field
def compute_velocity(x_t, t, x_0, x_1, sigma_min=1e-4):
    sigma_t = 1.0 - (1.0 - sigma_min) * t
    target_v = x_1 - (1.0 - sigma_min) * x_0
    return target_v / sigma_t`,
          metrics: [
            { label: "ODE Steps", value: "10-25 NFE" },
            { label: "OT Divergence", value: "0.0014" },
            { label: "Proof Certainty", value: "98.9%" },
          ],
          bulletPoints: [
            "Straight vector paths minimize kinetic energy compared to curved diffusion trajectories.",
            "Euler solvers achieve convergence in fewer than 20 function evaluations (NFEs).",
          ],
        },
      },
      {
        id: "step-2",
        number: "02",
        title: "Diffusion vs Flow Prior Art",
        subtitle: "Cross-checks mathematical equivalence with Score-Based SDEs (Song 2020)",
        tool: "citation_graph_spider",
        duration: "0.95s",
        evidence: {
          badge: "Theoretical Delta Isolated",
          badgeType: "accent",
          title: "Bridge to Score-Based Diffusion",
          detail:
            "Mapped theoretical relationship between Continuous Normalizing Flows and VP/VE SDEs. Proved that Flow Matching generalizes standard DDPM without stochastic drift.",
          metrics: [
            { label: "Parent Framework", value: "Lipman et al. (2022)" },
            { label: "Equivalence Found", value: "Score Matching Limit" },
            { label: "Citations Mapped", value: "31 Papers" },
          ],
          bulletPoints: [
            "Proves target regression is strictly regression on marginal vector field.",
            "Eliminates need for stochastic Brownian motion simulation during inference.",
          ],
        },
      },
      {
        id: "step-3",
        number: "03",
        title: "CFG Guidance Extrapolation Audit",
        subtitle: "Stress-tests extreme guidance scale extrapolation w > 7.5",
        tool: "repo_kernel_auditor",
        duration: "0.54s",
        evidence: {
          badge: "Empirical Bound Flagged",
          badgeType: "warning",
          title: "Guidance Manifold Overshoot Detected",
          detail:
            "Re-evaluated checkpoint evaluations across ImageNet-512. Identified high-frequency color clipping when guidance scale exceeds w = 6.0 without adaptive rescaling.",
          codeSnippet: `# CFG Velocity Rescaling Recommendation
v_uncond = model(x_t, t, cond=None)
v_cond = model(x_t, t, cond=context)
v_guided = v_uncond + guidance_scale * (v_cond - v_uncond)
# Caveat: apply norm rescaling to prevent saturation:
v_guided *= torch.norm(v_cond) / torch.norm(v_guided)`,
          metrics: [
            { label: "Optimal Guidance", value: "3.5 - 4.5" },
            { label: "Clipping Threshold", value: "w > 6.2" },
            { label: "Artifact Risk", value: "High Freq Burn" },
          ],
          bulletPoints: [
            "Standard CFG introduces off-manifold extrapolation on high-curvature trajectories.",
            "Adaptive magnitude normalization prevents over-saturation on extreme prompts.",
          ],
        },
      },
    ],
  },
  {
    id: "sparse-moe",
    tag: "Distributed Systems",
    paperTitle: "DeepSeek-V2 & Sparse MoE Load Balancing",
    arxivId: "arXiv:2405.04434",
    hypothesis:
      "Audit auxiliary-loss-free routing stability and communication overhead during 64-expert distributed token dispatch.",
    steps: [
      {
        id: "step-1",
        number: "01",
        title: "Router Gating Proof Analysis",
        subtitle: "Evaluates token drop rate without classical auxiliary load penalties",
        tool: "ast_proof_engine",
        duration: "0.45s",
        evidence: {
          badge: "Router Gating Validated",
          badgeType: "success",
          title: "Bias-Adjusted Routing Equilibrium",
          detail:
            "Analyzed auxiliary-loss-free gating formula: Score(x) = TopK(Softmax(W_g * x + b_bias), k=6). Verified self-correcting load balance mechanism.",
          codeSnippet: `# Bias-based Load Balancing without Auxiliary Loss
routing_logits = torch.matmul(hidden_states, router_weights)
# Dynamic per-expert bias adjustment:
routing_logits += expert_bias_tracker 
scores, top_indices = torch.topk(torch.softmax(routing_logits, dim=-1), k=6)`,
          metrics: [
            { label: "Active Experts", value: "6 / 64 per token" },
            { label: "Router Loss Overhead", value: "0.00% (Lossless)" },
            { label: "Token Droppage", value: "< 0.02%" },
          ],
          bulletPoints: [
            "Decouples representation learning from expert load balance constraints.",
            "Dynamic bias update ensures uniform token distribution across all 64 nodes.",
          ],
        },
      },
      {
        id: "step-2",
        number: "02",
        title: "Lineage vs Switch & Mixtral",
        subtitle: "Contrasts shared-expert architecture with standard top-2 routing",
        tool: "citation_graph_spider",
        duration: "1.04s",
        evidence: {
          badge: "Architectural Shift Mapped",
          badgeType: "accent",
          title: "Shared Expert Isolation Pattern",
          detail:
            "Compared architectural deltas against Shazeer (2017), Fedus (2021), and Jiang et al. (2024). Isolated the role of dedicated non-routed shared experts.",
          metrics: [
            { label: "Foundation Ref", value: "Shazeer et al. (2017)" },
            { label: "Key Deviation", value: "Dedicated Shared Expert" },
            { label: "Downstream Impact", value: "Zero KV Redundancy" },
          ],
          bulletPoints: [
            "Shared experts capture universal linguistic representations, freeing routed experts for specialized domains.",
            "Reduces activation memory footprint by 42% compared to standard Mixtral-style top-2 routing.",
          ],
        },
      },
      {
        id: "step-3",
        number: "03",
        title: "All-to-All Dispatch Latency Audit",
        subtitle: "Models InfiniBand cross-node communication bottleneck",
        tool: "repo_kernel_auditor",
        duration: "0.72s",
        evidence: {
          badge: "Hardware Bottleneck Quantified",
          badgeType: "warning",
          title: "Cross-Node Network Dispatch Bound",
          detail:
            "Modeled All-to-All collective latency across 8x H100 GPU nodes. Identified 14.2% stall time unless overlap communication is enabled via NVLink + InfiniBand.",
          codeSnippet: `# Distributed Communication Overlap
def dispatch_tokens_to_experts(tokens, expert_indices):
    # Asynchronous all-to-all communication
    handle = torch.distributed.all_to_all_single(
        output_buffer, input_buffer, async_op=True
    )
    compute_shared_expert_path(tokens) # Overlap compute with network
    handle.wait()`,
          metrics: [
            { label: "Network Stall", value: "14.2% of step" },
            { label: "NVLink Bandwidth", value: "900 GB/s" },
            { label: "Mitigation", value: "Async Overlap" },
          ],
          bulletPoints: [
            "Without async communication overlap, latency scales super-linearly past 32 nodes.",
            "Triton fused dispatch kernels reduce CPU kernel launch latency to under 12 microseconds.",
          ],
        },
      },
    ],
  },
];

export default function AgentShowcaseSection() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("flash-attention");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const activePreset =
    RESEARCH_PRESETS.find((p) => p.id === selectedPresetId) || RESEARCH_PRESETS[0];
  const activeStep = activePreset.steps[activeStepIndex] || activePreset.steps[0];

  // Auto-progress timer for active step
  const STEP_DURATION_MS = 6000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
    if (isPaused) return;

    const intervalTime = 50;
    const increment = (intervalTime / STEP_DURATION_MS) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStepIndex((curr) => (curr + 1) % activePreset.steps.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeStepIndex, isPaused, activePreset.steps.length]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setActiveStepIndex(0);
    setProgress(0);
  };

  const handleSelectStep = (index: number) => {
    setActiveStepIndex(index);
    setProgress(0);
  };

  const handleReset = () => {
    setActiveStepIndex(0);
    setProgress(0);
  };

  return (
    <section id="agent-mode" className="relative py-20 sm:py-28 lg:py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <SectionHeader
          badgeText="Autonomous Research Engine"
          badgeIcon={<Bot className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="cobalt"
          title="One Research Hypothesis."
          titleAccent="Autonomous Deep Verification."
          description="Go far beyond surface-level summaries. PaperLens Agent autonomously navigates dense mathematical proofs, traverses citation chains, and stress-tests empirical claims with verifiable evidence."
        />

        {/* ─── The Main Research Console ─── */}
        <motion.div
          className="rounded-2xl border border-border/80 dark:border-white/10 bg-card shadow-xl overflow-hidden transition-all"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Top Window Chrome Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-border/70 dark:border-white/10 bg-muted/40 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-border dark:bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-border dark:bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-border dark:bg-white/20" />
              </div>
              <span className="text-xs font-mono font-medium text-foreground/80 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                paperlens-agent-runtime
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-border/60 text-muted-foreground">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>

            {/* Play/Pause & Reset Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-background border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={isPaused ? "Resume Step Progression" : "Pause Step Progression"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 fill-current text-emerald-500" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-500" />
                    <span>Pause</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-md text-xs font-mono bg-background border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Preset Selector Banner */}
          <div className="p-4 sm:p-6 border-b border-border/70 dark:border-white/10 bg-muted/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Sample Investigations:
                </span>
                <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  {activePreset.arxivId}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                {activePreset.paperTitle}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                “{activePreset.hypothesis}”
              </p>
            </div>

            {/* Preset Selector Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
              {RESEARCH_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                        : "bg-background/90 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {preset.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Two-Column Interactive Workbench ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70 dark:divide-white/10">
            {/* Left Column: Autonomous Trace Ledger (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-muted/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    Autonomous Reasoning Trace
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Step {activeStepIndex + 1} of {activePreset.steps.length}
                  </span>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {activePreset.steps.map((step, idx) => {
                    const isActive = idx === activeStepIndex;
                    const isCompleted = idx < activeStepIndex;

                    return (
                      <div
                        key={step.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectStep(idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSelectStep(idx);
                          }
                        }}
                        className={`relative rounded-xl border p-3.5 sm:p-4 text-left transition-all cursor-pointer overflow-hidden ${
                          isActive
                            ? "bg-card border-accent/60 shadow-md ring-1 ring-accent/30"
                            : "bg-card/60 border-border/70 hover:bg-card hover:border-border"
                        }`}
                      >
                        {/* Progress bar inside active step */}
                        {isActive && !isPaused && (
                          <div
                            className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-75"
                            style={{ width: `${progress}%` }}
                          />
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-bold flex-shrink-0 transition-colors ${
                                isActive
                                  ? "bg-accent text-accent-foreground shadow-xs"
                                  : isCompleted
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {isCompleted ? "✓" : step.number}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                {step.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {step.subtitle}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded flex-shrink-0">
                            {step.duration}
                          </span>
                        </div>

                        {/* Tool Pill */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-md">
                            <Code2 className="w-3 h-3" />
                            {step.tool}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Inspect Payload
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick-Start Action */}
              <div className="mt-6 pt-4 border-t border-border/70 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Click any step to inspect verified evidence
                </span>
                <Link
                  to="/agent"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  <span>Launch Agent</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Verified Evidence Dossier (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 bg-card flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activePreset.id}-${activeStep.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Evidence Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${
                          activeStep.evidence.badgeType === "success"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : activeStep.evidence.badgeType === "warning"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-accent/10 text-accent border border-accent/20"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {activeStep.evidence.badge}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground">
                      Synthesized in {activeStep.duration}
                    </span>
                  </div>

                  {/* Evidence Title & Detail */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {activeStep.evidence.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {activeStep.evidence.detail}
                    </p>
                  </div>

                  {/* Code / Derivation Snippet (if available) */}
                  {activeStep.evidence.codeSnippet && (
                    <div className="rounded-xl border border-border/80 dark:border-white/10 bg-muted/40 p-3 sm:p-3.5 font-mono text-xs overflow-x-auto shadow-inner text-foreground">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 text-[10px] text-muted-foreground">
                        <span className="uppercase tracking-wider">Proof Verification Output</span>
                        <span>syntax: verified</span>
                      </div>
                      <pre className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground font-mono">
                        {activeStep.evidence.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Verified Metrics Grid */}
                  {activeStep.evidence.metrics && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      {activeStep.evidence.metrics.map((metric, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border/70 dark:border-white/10 bg-muted/20 p-2.5 text-center"
                        >
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                            {metric.label}
                          </div>
                          <div className="text-xs sm:text-sm font-mono font-bold text-foreground mt-0.5 truncate">
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet Points */}
                  <div className="space-y-1.5 pt-1">
                    {activeStep.evidence.bulletPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-border/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  Ready to test your own hypothesis on dual-column PDFs or arXiv IDs?
                </div>
                <Link to="/agent" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Launch Agent Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 3 Clean Capability Cards Below (Anti-AI Cliché) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <motion.div
            className="rounded-2xl border border-border/80 dark:border-white/10 bg-card p-5 sm:p-6 shadow-sm hover:border-accent/40 transition-all"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
              <Binary className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1.5">
              Mathematical Proof Deconstruction
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Step through equation derivations line-by-line. The agent verifies boundary conditions, identifies hidden assumptions, and flags potential dimension mismatches.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border/80 dark:border-white/10 bg-card p-5 sm:p-6 shadow-sm hover:border-accent/40 transition-all"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1.5">
              Recursive Citation Lineage
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Never read a paper in isolation. The agent automatically spiders forward and backward citations, distinguishing foundational breakthroughs from subsequent refutations.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border/80 dark:border-white/10 bg-card p-5 sm:p-6 shadow-sm hover:border-accent/40 transition-all"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1.5">
              Kernel & Benchmark Auditing
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Verify claims against reality. The agent inspects linked GitHub repositories, audits CUDA kernels and PyTorch implementations, and surfaces unstated hardware requirements.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
