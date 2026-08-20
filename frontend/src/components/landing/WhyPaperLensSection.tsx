import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, Quote, ArrowRight, Zap, Shield, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ease = [0.2, 0, 0, 1] as const;

const whyPanels = [
  {
    title: "Evidence-Grounded Intelligence",
    description:
      "PaperLens AI eliminates LLM hallucinations by anchoring every generated hypothesis, experiment step, and summary to exact citations and claims from uploaded papers.",
    points: [
      "Provenance-linked hypothesis generation",
      "Confidence-scored methodology extraction",
      "Direct sentence-level citation verification",
    ],
  },
  {
    title: "Built-in Academic Rigor",
    description:
      "Unlike conversational bots that passively agree, PaperLens stress-tests ideas with adversarial critique, uncovering failure modes and confounding variables before peer reviewers do.",
    points: [
      "Automated peer-review stress testing",
      "Confounding variable & leakage detection",
      "Ablation & falsification suggestions",
    ],
  },
];

const analysisDimensions = [
  {
    key: "methodology",
    label: "Methodology Extraction",
    detail: "Deep architectural breakdown of mathematical formulations, loss functions, and network designs.",
  },
  {
    key: "novelty",
    label: "Novelty Validation",
    detail: "Cross-checks proposed ideas against published literature to prevent redundant effort and confirm technical originality.",
  },
  {
    key: "reproducibility",
    label: "Reproducibility Audit",
    detail: "Identifies missing hyperparameters, dataset splits, or unstated training assumptions that could derail experiments.",
  },
  {
    key: "transfer",
    label: "Cross-Domain Transfer",
    detail: "Evaluates whether extracted techniques translate across NLP, Vision, or Biomedical domains with consistent performance.",
  },
];

const evidenceDetails = {
  "Hypothesis Grounding": "Directly linked to Section 3.2: Early saliency routing reduces edge latency while bounding accuracy loss.",
  "Baseline Delta": "Evaluated against SOTA MobileNetV4 and FastViT under identical INT8 compute budgets.",
  "Ablation Guard": "Isolates token pruning effects from KV-cache compression to verify independent contribution.",
  "Reviewer Defense": "Flags potential hardware measurement jitter on tensor cores, mandating P99 latency percentiles.",
  "Failure Mode Check": "Documents non-deterministic tensor shape behavior on fixed-graph compilers (TensorRT/ONNX).",
} as const;

const evidenceQuoteMap = {
  "Hypothesis Grounding": "Early patch saliency gating achieves 32% FLOP reduction with under 0.4% Top-1 accuracy delta on ImageNet.",
  "Baseline Delta": "Outperforms FastViT-SA12 and EfficientFormer-L1 in throughput-per-watt on ARM Cortex-A76.",
  "Ablation Guard": "A 4-stage ablation independently verifies saliency threshold sensitivity against fixed token pruning.",
  "Reviewer Defense": "Multi-seed initialization (seeds 42, 1337, 2026) eliminates stochastic variance across all reported latency benchmarks.",
  "Failure Mode Check": "Dynamic graph execution incurs a 1.2ms initial compilation overhead before reaching steady-state throughput.",
} as const;

export default function WhyPaperLensSection() {
  const [activeDimensionKey, setActiveDimensionKey] = useState(analysisDimensions[0].key);
  const [activeEvidenceTag, setActiveEvidenceTag] = useState<keyof typeof evidenceDetails>("Hypothesis Grounding");
  const [showEvidenceQuote, setShowEvidenceQuote] = useState(false);

  return (
    <section id="about" className="relative pt-10 pb-20 sm:pt-14 sm:pb-28 scroll-mt-20">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
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
              Why Choose Us
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Why <span className="text-gradient-research">PaperLens AI?</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Designed for genuine scientific discovery: evidence-grounded, citation-anchored, and built to withstand academic scrutiny.
          </p>
        </motion.div>

        <div className="space-y-6 sm:space-y-8">
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] gap-0 rounded-2xl overflow-hidden border border-border bg-card shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            whileHover={{ y: -2 }}
          >
            <div className="relative bg-card p-6 sm:p-8 lg:p-10 border-b xl:border-b-0 xl:border-r border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">{whyPanels[0].title}</h3>
              </div>
              <div className="h-px w-16 bg-accent mb-6" />
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[0].description}</p>
              <div className="space-y-2.5">
                {whyPanels[0].points.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-4 sm:p-6 lg:p-8 bg-muted/40">
              <motion.div
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
                  <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Underlying Paper</p>
                    <h4 className="font-medium text-foreground leading-relaxed mb-3">
                      Adaptive Saliency Gating for Low-Power Edge Vision Transformers.
                    </h4>
                    <p className="text-xs text-muted-foreground">Roy, Banerjee, Kumar — arXiv:2502.04918</p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Synthesis & Audit</p>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-semibold mb-3">
                      <motion.span className="w-1.5 h-1.5 rounded-full bg-accent" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} /> Verified Claim · 98.4% Confidence
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                      Methodology rigorously validated against edge compute baselines. Contains verifiable mathematical formulations and reproducible artifact checkpoints.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {analysisDimensions.map((item) => {
                        const isActive = activeDimensionKey === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onMouseEnter={() => setActiveDimensionKey(item.key)}
                            onFocus={() => setActiveDimensionKey(item.key)}
                            onClick={() => setActiveDimensionKey(item.key)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              isActive
                                ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                                : "border-border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <motion.div
                      className="rounded-lg border border-border bg-muted/60 p-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Dimension detail</p>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {analysisDimensions.find((item) => item.key === activeDimensionKey)?.detail}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] gap-0 rounded-2xl overflow-hidden border border-border bg-card shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            whileHover={{ y: -2 }}
          >
            <div className="relative bg-card p-6 sm:p-8 lg:p-10 border-b xl:border-b-0 xl:border-r border-border xl:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">{whyPanels[1].title}</h3>
              </div>
              <div className="h-px w-16 bg-accent mb-6" />
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[1].description}</p>
              <div className="space-y-2.5">
                {whyPanels[1].points.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-4 sm:p-6 lg:p-8 bg-muted/40 xl:order-2">
              <motion.div
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/30">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Adversarial Stress Test & Provenance
                  </p>
                  <span className="badge-research">
                    Grounded Citations
                  </span>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="relative">
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(evidenceDetails) as Array<keyof typeof evidenceDetails>).map((tag) => {
                        const isActive = activeEvidenceTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onMouseEnter={() => {
                              setActiveEvidenceTag(tag);
                              setShowEvidenceQuote(true);
                            }}
                            onMouseLeave={() => setShowEvidenceQuote(false)}
                            onFocus={() => {
                              setActiveEvidenceTag(tag);
                              setShowEvidenceQuote(true);
                            }}
                            onBlur={() => setShowEvidenceQuote(false)}
                            onClick={() => {
                              setActiveEvidenceTag(tag);
                              setShowEvidenceQuote((prev) => !prev);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              isActive
                                ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm"
                                : "border-border bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {showEvidenceQuote && (
                      <motion.div
                        className="mt-3 rounded-xl border border-accent/30 bg-accent/5 shadow-sm p-3 sm:p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                          Verification Check for: {activeEvidenceTag}
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-2">
                          {evidenceDetails[activeEvidenceTag]}
                        </p>
                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                          “{evidenceQuoteMap[activeEvidenceTag]}”
                        </p>
                      </motion.div>
                    )}
                  </div>
                  <motion.div
                    className="rounded-xl border border-border bg-muted/40 p-4"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-accent" />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Audited Citation Excerpt</p>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      “We report significant throughput gains under controlled edge hardware protocols, with explicit hyperparameter constraints and reproducible PyTorch artifacts.”
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="pt-8 flex justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/signup">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shadow-lg shadow-accent/30">
                  Start with PaperLens AI <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
