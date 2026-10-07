import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ArrowRight,
  Code2,
  BookOpen,
  Lightbulb,
  FlaskConical,
  Scale,
  Terminal,
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Copy,
  Check,
  Sliders,
  Sparkles,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import ReasoningFlowCircuit from "./ReasoningFlowCircuit";
import SectionHeader from "../../ui/SectionHeader";
import {
  DOMAIN_PRESETS,
  DomainPreset,
} from "../../data/agentShowcasePresets";

export default function AgentShowcaseSection() {
  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>("edge-vit");
  const [customObjective, setCustomObjective] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Active preset object
  const activePreset: DomainPreset =
    DOMAIN_PRESETS.find((p) => p.id === selectedPresetId) || DOMAIN_PRESETS[0];

  // Simulation playback state machine
  const [activeStepId, setActiveStepId] = useState<string>("step-3");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x or 2x
  const [inspectedStepId, setInspectedStepId] = useState<string | null>(null);

  // Dossier active tab
  const [activeDossierTab, setActiveDossierTab] = useState<
    "literature" | "novelty" | "ablation" | "critique" | "benchmarks"
  >("novelty");

  // Interactive Reviewer 2 toggle & copy feedback
  const [reviewerTwoMode, setReviewerTwoMode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);

  // Interactive parameter state for ablation matrix
  const [selectedGatingRatio, setSelectedGatingRatio] = useState<string>("25%");
  const [selectedPadding, setSelectedPadding] = useState<string>("Power-of-Two (128/256)");

  // Autonomous Simulation Loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = (1800 / playbackSpeed);
    const stepOrder = ["step-1", "step-2", "step-3", "step-4", "step-5"];

    timerRef.current = setInterval(() => {
      setActiveStepId((prev) => {
        const currIdx = stepOrder.indexOf(prev);
        if (currIdx === -1 || currIdx >= stepOrder.length - 1) {
          setIsPlaying(false);
          return "step-5";
        }
        const nextStep = stepOrder[currIdx + 1];

        // Automatically switch dossier tab to match stage
        if (nextStep === "step-2") setActiveDossierTab("literature");
        if (nextStep === "step-3") setActiveDossierTab("novelty");
        if (nextStep === "step-4") setActiveDossierTab("critique");
        if (nextStep === "step-5") setActiveDossierTab("ablation");

        return nextStep;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Handle Preset Switch
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setIsCustomMode(false);
    setIsPlaying(false);
    setActiveStepId("step-3");
    setActiveDossierTab("novelty");
  };

  // Copy code handler
  const handleCopyCode = () => {
    navigator.clipboard.writeText(activePreset.ablationProtocol.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy bibtex handler
  const handleCopyBibtex = () => {
    const bibtexSnippet = `@article{paperlens_${activePreset.id}_2026,
  title={${activePreset.novelty.heading}},
  author={PaperLens Autonomous Agent v2.4},
  journal={Evidence-Grounded Discovery Dossier},
  year={2026},
  doi={10.48550/arXiv.paperlens.${activePreset.id}}
}`;
    navigator.clipboard.writeText(bibtexSnippet);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const currentObjectiveText = isCustomMode
    ? customObjective || "Enter your custom research hypothesis..."
    : activePreset.objective;

  return (
    <section id="agent-mode" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <SectionHeader
          badgeText="Flagship Autonomous Engine"
          badgeIcon={<Bot className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="cobalt"
          title="One Research Objective."
          titleAccent="Autonomous Multi-Step Discovery."
          description="Define an open-ended research hypothesis. The PaperLens Autonomous Agent plans, traverses citation graphs, synthesizes prior literature, stress-tests ideas, and outputs publication-grade discovery dossiers with zero manual friction."
        />

        {/* The Discovery Workstation Window */}
        <motion.div
          className="academic-card rounded-2xl overflow-hidden border border-border/80 dark:border-white/12 bg-card shadow-academic-lg"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* ─── 1. Header Toolbar (OS Window Style) ─── */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border/70 dark:border-white/10 bg-muted/40 gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
              </div>
              <span className="text-xs font-mono text-muted-foreground ml-2">
                paperlens-agent-orchestrator :: v2.4.0
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-background/80 border border-border/60 text-muted-foreground">
                ReAct Loop • Fast-Path Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Session Active • Zero Hallucinations
              </span>
            </div>
          </div>

          {/* ─── 2. Interactive Objective Console & Presets ─── */}
          <div className="p-4 sm:p-5 border-b border-border/70 dark:border-white/10 bg-muted/20">
            {/* Domain Switcher Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold mr-1">
                  Domain Presets:
                </span>
                {DOMAIN_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id && !isCustomMode;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                          : "bg-background/80 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      }`}
                    >
                      {preset.shortLabel}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    isCustomMode
                      ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                      : "bg-background/80 border border-dashed border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Custom Objective</span>
                  <span className="text-[10px]">✏️</span>
                </button>
              </div>

              {/* Simulation Controls: Run / Pause / Speed */}
              <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isPlaying
                      ? "bg-amber-500 text-white"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                  title={isPlaying ? "Pause Discovery Loop" : "Play Autonomous Discovery Loop"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Discovery</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
                  className="px-2 py-1 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  title="Toggle Simulation Speed"
                >
                  <span className="flex items-center gap-0.5">
                    <FastForward className="w-3 h-3" />
                    {playbackSpeed}x
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepId("step-1");
                    setActiveDossierTab("literature");
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target Objective Input / Display */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between bg-card p-3.5 sm:p-4 rounded-xl border border-border/80 shadow-2xs">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 flex-shrink-0 mt-0.5">
                  <Terminal className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      Target Research Objective
                    </span>
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.2 rounded">
                      {activePreset.domainBadge}
                    </span>
                  </div>

                  {isCustomMode ? (
                    <input
                      type="text"
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      placeholder="e.g. Design an asynchronous MoE router for 8-bit sparse inference on edge devices..."
                      className="w-full text-xs sm:text-sm font-medium bg-muted/40 border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                      “{currentObjectiveText}”
                    </p>
                  )}
                </div>
              </div>

              <Link to="/agent" className="flex-shrink-0 self-end md:self-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all active:scale-95"
                >
                  <span>Launch Agent Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          {/* ─── 3. Interactive SVG Flow Circuit ─── */}
          <ReasoningFlowCircuit
            activeStepId={activeStepId}
            onSelectStep={(stepId) => {
              setActiveStepId(stepId);
              if (stepId === "step-1" || stepId === "step-2") setActiveDossierTab("literature");
              if (stepId === "step-3") setActiveDossierTab("novelty");
              if (stepId === "step-4") setActiveDossierTab("critique");
              if (stepId === "step-5") setActiveDossierTab("ablation");
            }}
            isRunning={isPlaying}
          />

          {/* ─── 4. Split Cockpit: Left Execution Trace & Right Dossier ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70 dark:divide-white/10">
            {/* Left Column: Interactive Execution Trace (5 Columns) */}
            <div className="lg:col-span-5 p-4 sm:p-6 bg-muted/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    Autonomous Trace Ledger
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {activeStepId === "step-5" ? "4/4 Complete" : "Interactive Stream"}
                  </span>
                </div>

                {/* Step List */}
                <div className="space-y-2.5">
                  {activePreset.traceSteps.map((step) => {
                    const isSelected = activeStepId === step.id;
                    const isInspected = inspectedStepId === step.id;

                    return (
                      <div
                        key={step.id}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? "bg-card border-accent/60 shadow-xs ring-1 ring-accent/30"
                            : "bg-card/70 border-border/70 hover:bg-card"
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveStepId(step.id);
                            if (step.id === "step-1" || step.id === "step-2") setActiveDossierTab("literature");
                            if (step.id === "step-3") setActiveDossierTab("novelty");
                            if (step.id === "step-4") setActiveDossierTab("critique");
                          }}
                          className="p-3 cursor-pointer select-none"
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
                              {step.durationMs}ms
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-md">
                              <Code2 className="w-3 h-3" />
                              {step.tool}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedStepId(isInspected ? null : step.id);
                              }}
                              className="text-[10px] font-mono text-muted-foreground hover:text-accent underline cursor-pointer"
                            >
                              {isInspected ? "Hide JSON" : "Inspect Payload"}
                            </button>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {step.summary}
                          </p>
                        </div>

                        {/* Expandable Live Tool Telemetry Inspector */}
                        <AnimatePresence>
                          {isInspected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-border/70 bg-muted/30 p-3 text-[11px] font-mono space-y-2 overflow-hidden"
                            >
                              <div className="flex items-center justify-between text-muted-foreground">
                                <span>Router: {step.telemetryPayload.routerType}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Saved ~{step.telemetryPayload.tokensSaved} tokens
                                </span>
                              </div>
                              <div className="p-2 rounded bg-background/90 border border-border/70 text-[10px] text-foreground/90 overflow-x-auto max-h-32">
                                <pre>{JSON.stringify(step.telemetryPayload.invokedWith, null, 2)}</pre>
                              </div>
                              <div className="text-[9px] text-muted-foreground space-y-0.5">
                                {step.telemetryPayload.executionLog.map((log, i) => (
                                  <div key={i} className="truncate">{log}</div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Hallucination Guard Proof */}
              <div className="mt-4 pt-4 border-t border-border/70 dark:border-white/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Hallucination Guard: Active
                </span>
                <span className="text-accent font-semibold">Provenance: 100% Grounded</span>
              </div>
            </div>

            {/* Right Column: Verified Research Dossier (7 Columns) */}
            <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-card">
              <div>
                {/* Dossier Tabs */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/70 dark:border-white/10 overflow-x-auto gap-2">
                  <div className="flex items-center gap-1.5 flex-nowrap" role="tablist">
                    {[
                      { id: "novelty", label: "Novel Directions", icon: Lightbulb },
                      { id: "literature", label: "Prior Art & Literature", icon: BookOpen },
                      { id: "ablation", label: "PyTorch Ablation Protocol", icon: FlaskConical },
                      { id: "critique", label: "Reviewer #2 Duel", icon: Scale },
                    ].map((tab) => {
                      const isActive = activeDossierTab === tab.id;
                      const Icon = tab.icon;

                      return (
                        <button
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() =>
                            setActiveDossierTab(
                              tab.id as "literature" | "novelty" | "ablation" | "critique"
                            )
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            isActive
                              ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                              : "bg-muted/40 border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="min-h-[380px]">
                  <AnimatePresence mode="wait">
                    {/* TAB 1: NOVEL DIRECTIONS */}
                    {activeDossierTab === "novelty" && (
                      <motion.div
                        key="novelty"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div>
                          <div className="text-[10px] font-mono text-accent uppercase tracking-wider font-bold mb-1">
                            Core Synthesized Novelty
                          </div>
                          <h4 className="text-base font-bold text-foreground">
                            {activePreset.novelty.heading}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {activePreset.novelty.coreHypothesis}
                          </p>
                        </div>

                        {/* Gap Analysis Matrix Table */}
                        <div className="rounded-xl border border-border/70 overflow-hidden text-xs">
                          <div className="grid grid-cols-12 bg-muted/60 p-2.5 font-mono text-[11px] text-muted-foreground font-bold border-b border-border/70">
                            <div className="col-span-4">Evaluation Dimension</div>
                            <div className="col-span-3">Published Baseline</div>
                            <div className="col-span-5">PaperLens Protocol Delta</div>
                          </div>
                          <div className="divide-y divide-border/60">
                            {activePreset.novelty.gapMatrix.map((row, i) => (
                              <div key={i} className="grid grid-cols-12 p-2.5 items-center gap-1">
                                <div className="col-span-4 font-medium text-foreground">
                                  {row.dimension}
                                </div>
                                <div className="col-span-3 font-mono text-muted-foreground">
                                  {row.priorSota}
                                </div>
                                <div className="col-span-5 flex items-center justify-between">
                                  <span className="font-mono font-bold text-accent">
                                    {row.paperlensDelta}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                    {row.advantage}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Provenance Verification Tag */}
                        <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                            Patent & Preprint Novelty Matrix: 100% Uniqueness Validated
                          </span>
                          <span className="font-semibold text-accent flex items-center gap-0.5">
                            Verified <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: PRIOR ART & LITERATURE REVIEW */}
                    {activeDossierTab === "literature" && (
                      <motion.div
                        key="literature"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3.5"
                      >
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">
                            {activePreset.literature.heading}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {activePreset.literature.summary}
                          </p>
                        </div>

                        {/* Interactive Citation Cards */}
                        <div className="space-y-2.5">
                          {activePreset.literature.citations.map((paper) => (
                            <div
                              key={paper.id}
                              className="p-3 rounded-xl border border-border/80 bg-card hover:border-accent/40 transition-all text-xs"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="font-semibold text-foreground leading-snug">
                                  {paper.title}
                                </div>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 whitespace-nowrap">
                                  {paper.venue}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono mb-2">
                                <span>{paper.authors}</span>
                                <span>•</span>
                                <span>{paper.citationCount} Citations</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Influence: {paper.influenceScore}/100
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/60">
                                <span className="font-semibold text-foreground">Key Bottleneck:</span>{" "}
                                {paper.highlight}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 3: PYTORCH ABLATION PROTOCOL */}
                    {activeDossierTab === "ablation" && (
                      <motion.div
                        key="ablation"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-foreground">
                              {activePreset.ablationProtocol.heading}
                            </h4>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {activePreset.ablationProtocol.framework} • Seed: {activePreset.ablationProtocol.seed}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-all"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                          </button>
                        </div>

                        {/* PyTorch Code Display */}
                        <div className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-52 border border-slate-800">
                          <pre>{activePreset.ablationProtocol.codeSnippet}</pre>
                        </div>

                        {/* Interactive Parameter Tuning Sliders/Pills */}
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Sliders className="w-3.5 h-3.5 text-accent" />
                            <span>Interactive Ablation Parameter Matrix</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {activePreset.ablationProtocol.parameters.map((param) => (
                              <div
                                key={param.name}
                                className="p-2 rounded-lg bg-card border border-border/60"
                              >
                                <div className="text-[11px] font-semibold text-foreground mb-1">
                                  {param.name}
                                </div>
                                <div className="flex gap-1 flex-wrap mb-1">
                                  {param.options.map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setSelectedGatingRatio(String(opt))}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                                        selectedGatingRatio === String(opt)
                                          ? "bg-accent text-accent-foreground font-bold"
                                          : "bg-muted text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                  {param.impactMetric}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 4: REVIEWER 2 DUEL (ACADEMIC WHIMSY) */}
                    {activeDossierTab === "critique" && (
                      <motion.div
                        key="critique"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3.5"
                      >
                        {/* Whimsical Persona Toggle Switch */}
                        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <div>
                              <span className="font-semibold text-foreground">Peer Review Adversarial Duel:</span>{" "}
                              <span className="text-muted-foreground text-[11px]">
                                Toggle between Constructive Co-Pilot and Brutal Reviewer #2
                              </span>
                            </div>
                          </div>

                          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setReviewerTwoMode(false)}
                              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
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
                              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
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

                        {/* Duel Cards: Reviewer Objection vs Agent Rebuttal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Left: Objection */}
                          <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-[10px] font-bold text-destructive flex items-center gap-1 uppercase">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {activePreset.reviewerTwo.reviewerBadge}
                              </span>
                              <span className="text-[10px] text-destructive/80">
                                {activePreset.reviewerTwo.brutalityScore}
                              </span>
                            </div>
                            <h5 className="font-bold text-foreground">
                              {activePreset.reviewerTwo.objectionHeadline}
                            </h5>
                            <p className="text-muted-foreground leading-relaxed">
                              "{activePreset.reviewerTwo.objectionBody}"
                            </p>
                          </div>

                          {/* Right: Automated Rebuttal Defense */}
                          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Agent Rebuttal Protocol
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                100% Invariant
                              </span>
                            </div>
                            <h5 className="font-bold text-foreground">
                              {activePreset.reviewerTwo.agentRebuttalHeadline}
                            </h5>
                            <p className="text-muted-foreground leading-relaxed">
                              {activePreset.reviewerTwo.agentRebuttalBody}
                            </p>
                            <div className="text-[10px] font-mono text-accent pt-1 border-t border-emerald-500/15">
                              {activePreset.reviewerTwo.invarianceProof}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ─── 5. Bottom Provenance Cryptographic Seal & Export ─── */}
              <div className="mt-6 pt-4 border-t border-border/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 text-accent" />
                  <span>SHA-256 Provenance Proof:</span>
                  <code className="text-[11px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    sha256:9f1c...88a2
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBibtex}
                    className="px-2.5 py-1 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70 text-[11px] transition-all"
                  >
                    {copiedBibtex ? "Copied BibTeX ✓" : "Copy BibTeX"}
                  </button>
                  <Link
                    to="/agent"
                    className="px-3 py-1 rounded bg-accent text-accent-foreground font-semibold text-[11px] hover:bg-accent/90 transition-all flex items-center gap-1"
                  >
                    <span>Deploy Agent</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
