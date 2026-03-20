import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, Quote, ArrowRight, Zap, Shield, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ease = [0.2, 0, 0, 1] as const;

const whyPanels = [
  {
    title: "Precisely configurable",
    description:
      "Define your own screening criteria and evaluation priorities. PaperLens adapts to your research objective instead of forcing generic summaries.",
    points: [
      "Custom inclusion/exclusion logic",
      "Criteria-level confidence signals",
      "One-click recommendation override",
    ],
  },
  {
    title: "Evidence-linked reasoning",
    description:
      "Every decision can be traced to explicit rationale and supporting cues, so you can validate outputs faster and write with confidence.",
    points: [
      "Transparent ‘why included’ explanation",
      "Criteria-level detail tags",
      "Quote-first interpretation workflow",
    ],
  },
];

const recommendationCriteria = [
  {
    key: "methodology",
    label: "Methodology fit",
    detail: "Directly evaluates structured paper understanding with clearly defined methodology blocks.",
  },
  {
    key: "evaluation",
    label: "Quantitative evaluation",
    detail: "Reports measurable performance metrics across multiple benchmark datasets.",
  },
  {
    key: "reproducibility",
    label: "Reproducibility",
    detail: "Includes ablation settings and implementation notes that support reruns.",
  },
  {
    key: "alignment",
    label: "Cross-domain evidence",
    detail: "Shows transfer across NLP and biomedical contexts with consistent behavior.",
  },
];

const evidenceDetails = {
  "Study design": "Controlled evaluation setup with explicit assumptions and bounded scope.",
  Population: "Tested on representative datasets with clear sampling criteria.",
  Intervention: "Compares baseline vs. adapted model behavior under same constraints.",
  "Outcome metrics": "Precision, recall, and faithfulness-oriented checks are all reported.",
  "Limitation clarity": "Failure modes and blind spots are documented for downstream judgment.",
} as const;

const evidenceQuoteMap = {
  "Study design": "A controlled protocol isolates model adaptation effects from prompt-only variance.",
  Population: "Datasets span scientific domains to assess stability of reasoning quality.",
  Intervention: "Model adaptation is tested against equivalent baseline inference budgets.",
  "Outcome metrics": "Improvements are significant on structure extraction and grounded QA tasks.",
  "Limitation clarity": "Edge cases remain in long-tail notation and highly sparse methodology sections.",
} as const;

export default function WhyPaperLensSection() {
  const [activeCriteriaKey, setActiveCriteriaKey] = useState(recommendationCriteria[0].key);
  const [activeEvidenceTag, setActiveEvidenceTag] = useState<keyof typeof evidenceDetails>("Study design");
  const [showEvidenceQuote, setShowEvidenceQuote] = useState(false);

  return (
    <section id="about" className="relative py-20 sm:py-32 overflow-hidden scroll-mt-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />
      </div>

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
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 text-foreground">
              Why Choose Us
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Why <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">PaperLens AI?</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Designed for real research decisions: configurable, auditable, and built to reduce manual verification overhead.
          </p>
        </motion.div>

        <div className="space-y-6 sm:space-y-8">
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] gap-0 rounded-3xl overflow-hidden backdrop-blur-xl border border-border/30 bg-card/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            whileHover={{ y: -4 }}
          >
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative bg-card/50 p-6 sm:p-8 lg:p-10 border-b xl:border-b-0 xl:border-r border-border/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">{whyPanels[0].title}</h3>
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-cyan-500 to-transparent mb-6" />
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[0].description}</p>
              <div className="space-y-2.5">
                {whyPanels[0].points.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-cyan-500/5 to-violet-500/5">
              <motion.div
                className="rounded-2xl backdrop-blur-sm border border-border/30 bg-card/60 overflow-hidden shadow-xl"
                whileHover={{ borderColor: "rgba(6, 182, 212, 0.5)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border/50">
                  <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-border/50">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Paper</p>
                    <h4 className="font-medium text-foreground leading-relaxed mb-3">
                      Foundation model adaptation for robust research-paper understanding across domains.
                    </h4>
                    <p className="text-xs text-muted-foreground">A. Roy, P. Banerjee, L. Kumar — 2025</p>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Screening recommendation</p>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold mb-3">
                      <motion.span className="w-1.5 h-1.5 rounded-full bg-cyan-400" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} /> Include · 4.8/5
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                      Strong alignment with paper-structure parsing and domain transfer. Contains clear methodology and reproducible benchmarks.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recommendationCriteria.map((item) => {
                        const isActive = activeCriteriaKey === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onMouseEnter={() => setActiveCriteriaKey(item.key)}
                            onFocus={() => setActiveCriteriaKey(item.key)}
                            onClick={() => setActiveCriteriaKey(item.key)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                              isActive
                                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/20"
                                : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary hover:border-cyan-500/30"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <motion.div
                      className="rounded-lg border border-border/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 backdrop-blur-sm p-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Criteria detail</p>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {recommendationCriteria.find((item) => item.key === activeCriteriaKey)?.detail}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] gap-0 rounded-3xl overflow-hidden backdrop-blur-xl border border-border/30 bg-card/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            whileHover={{ y: -4 }}
          >
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative bg-card/50 p-6 sm:p-8 lg:p-10 border-b xl:border-b-0 xl:border-r border-border/20 xl:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/10">
                  <Lightbulb className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">{whyPanels[1].title}</h3>
              </div>
              <div className="h-px w-16 bg-gradient-to-r from-violet-500 to-transparent mb-6" />
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[1].description}</p>
              <div className="space-y-2.5">
                {whyPanels[1].points.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-violet-500/5 to-pink-500/5 xl:order-2">
              <motion.div
                className="rounded-2xl backdrop-blur-sm border border-border/30 bg-card/60 overflow-hidden shadow-xl"
                whileHover={{ borderColor: "rgba(147, 51, 234, 0.5)" }}
              >
                <div className="p-4 sm:p-5 border-b border-border/30 flex items-center justify-between gap-3 bg-gradient-to-r from-violet-500/5 to-transparent">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    Supporting evidence panel
                  </p>
                  <motion.span
                    className="text-xs px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Linked quotes
                  </motion.span>
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
                                ? "border-violet-500/40 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/20"
                                : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary hover:border-violet-500/30"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {showEvidenceQuote && (
                      <motion.div
                        className="mt-3 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-pink-500/10 backdrop-blur-sm shadow-lg p-3 sm:p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                          Supporting note on {activeEvidenceTag}
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
                    className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-pink-500/10 backdrop-blur-sm p-4"
                    whileHover={{ borderColor: "rgba(147, 51, 234, 0.6)", scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-violet-400" />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Cited rationale</p>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      “We report significant gains under controlled protocol settings, with explicit methodological constraints and reproducibility artifacts.”
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
                <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 gap-2 shadow-lg shadow-cyan-500/30">
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
