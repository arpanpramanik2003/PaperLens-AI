import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, CheckCircle2, ArrowRight, BookOpen, Layers, MessageSquare, Zap, Cpu, Compass } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.2, 0, 0, 1] as const;

const steps = [
  {
    num: "01",
    title: "Upload & Ingest",
    desc: "Drag and drop any PDF paper or paste an arXiv link for instant structural extraction.",
    icon: Upload,
    color: "from-blue-500/20 to-cyan-500/20",
    stage: "Ingestion Stage",
  },
  {
    num: "02",
    title: "Analyze & Synthesize",
    desc: "AI extracts methodology, parses mathematical proofs, and verifies citation networks.",
    icon: Sparkles,
    color: "from-indigo-500/20 to-purple-500/20",
    stage: "Reasoning Stage",
  },
  {
    num: "03",
    title: "Plan & Discover",
    desc: "Generate novel hypotheses, design ablation experiments, and uncover unaddressed research gaps.",
    icon: MessageSquare,
    color: "from-emerald-500/20 to-teal-500/20",
    stage: "Execution Stage",
  },
];

const pipeline = [
  {
    phase: 1,
    title: "Intelligent PDF & Citation Ingestion",
    desc: "Extract clean structural representations from dual-column academic PDFs, preserving equation semantics, figure captions, and reference tables.",
    bullets: ["Dual-column AST parsing", "Mathematical LaTeX extraction", "Reference graph linking"],
    progress: 100,
    icon: BookOpen,
    badge: "Input Stream",
    stats: "2.4s Average Parse Time",
  },
  {
    phase: 2,
    title: "Multi-Modal Reasoning & Claim Audit",
    desc: "Deep semantic analysis maps core architectural claims to reported benchmarks, testing methodology bounds and identifying baseline discrepancies.",
    bullets: ["Architecture validation", "Benchmark split cross-checking", "Confounding variable detection"],
    progress: 100,
    icon: Layers,
    badge: "Core Analysis",
    stats: "98.4% Claim Verification",
  },
  {
    phase: 3,
    title: "Generative Blueprint & Publication Guidance",
    desc: "Turn extracted insights into publication-ready experimental blueprints, reproducible ablation matrices, and unexplored high-novelty hypotheses.",
    bullets: ["Ablation matrix design", "Problem space expansion", "Falsification protocols"],
    progress: 100,
    icon: Compass,
    badge: "Output Delivery",
    stats: "Publication-Grade Dossier",
  },
];

export default function HowItWorksSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  return (
    <section id="how-it-works" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-research">
              Complete Workflow
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            From Upload to <span className="text-gradient-research">Publishable Direction</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A continuous, evidence-anchored pipeline that deconstructs complex papers, verifies claims against literature graphs, and synthesizes actionable research roadmaps.
          </p>
        </motion.div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left: Step Stepper Column (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm sticky top-28">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent" />
                  Execution Pipeline
                </h3>
                <span className="text-xs font-mono text-muted-foreground">3 Discrete Stages</span>
              </div>

              <div className="relative space-y-3">
                {/* Custom SVG Connecting Flow Conduit */}
                <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-border pointer-events-none" aria-hidden="true">
                  <motion.div
                    className="w-full bg-accent"
                    style={{
                      height: `${(activeStepIndex / (steps.length - 1)) * 100}%`,
                      transition: "height 0.3s ease",
                    }}
                  />
                </div>

                {steps.map((s, i) => {
                  const isSelected = activeStepIndex === i;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.num}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveStepIndex(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setActiveStepIndex(i);
                        }
                      }}
                      className={`relative z-10 flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? "bg-accent/10 border-accent/50 shadow-xs ring-1 ring-accent/20"
                          : "bg-card/70 border-border/70 hover:bg-card hover:border-border"
                      }`}
                    >
                      {/* Step Circle */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {s.num}
                      </div>

                      {/* Step Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className={`text-xs sm:text-sm font-semibold transition-colors ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {s.title}
                          </h4>
                          <span className="text-[10px] font-mono text-muted-foreground">{s.stage}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Detailed Stage Showcase (7 cols) */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {pipeline.map((item, i) => {
                const isSelected = activeStepIndex === i;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveStepIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setActiveStepIndex(i);
                      }
                    }}
                    className={`rounded-2xl border bg-card p-6 sm:p-7 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-accent shadow-md ring-1 ring-accent/30"
                        : "border-border/80 opacity-85 hover:opacity-100 hover:border-border"
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isSelected ? "bg-accent/15 border-accent/40 text-accent" : "bg-muted border-border text-muted-foreground"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-0.5">
                            Stage 0{item.phase} · {item.badge}
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-foreground">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground whitespace-nowrap">
                        {item.stats}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
                      {item.desc}
                    </p>

                    {/* Feature Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                      {item.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs text-foreground/90 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                          <span className="truncate">{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                      <span className="text-muted-foreground">Pipeline State: Operational</span>
                      <span className="font-mono text-accent font-semibold flex items-center gap-1">
                        Active Stage 0{item.phase} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/signup" className="inline-block">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border bg-card shadow-sm hover:border-accent transition-all cursor-pointer group">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Ready to transform your research workflow?
              </span>
              <ArrowRight className="w-4 h-4 text-accent transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
