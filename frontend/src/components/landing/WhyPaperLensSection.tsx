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
            Designed for real research decisions: configurable, auditable, and built to reduce manual verification overhead.
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm font-semibold mb-3">
                      <motion.span className="w-1.5 h-1.5 rounded-full bg-accent" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} /> Include · 4.8/5
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
                    Supporting evidence panel
                  </p>
                  <span className="badge-research">
                    Linked quotes
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
                    className="rounded-xl border border-border bg-muted/40 p-4"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-accent" />
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
