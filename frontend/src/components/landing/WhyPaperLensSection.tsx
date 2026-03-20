import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, Quote, ArrowRight } from "lucide-react";
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
    <section className="py-16 sm:py-24 bg-secondary/20 border-y border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3">Why PaperLens AI?</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            Designed for real research decisions: configurable, auditable, and built to reduce manual verification overhead.
          </p>
        </motion.div>

        <div className="space-y-6 sm:space-y-8">
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] rounded-3xl overflow-hidden border border-border/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="bg-card p-6 sm:p-8 lg:p-10">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-foreground">{whyPanels[0].title}</h3>
              <div className="h-px w-full bg-border/70 mb-6" />
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

            <div className="bg-secondary/50 p-4 sm:p-6 lg:p-8">
              <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-sm font-semibold mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Include · 4.8/5
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
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              isActive
                                ? "border-accent/40 bg-accent/10 text-accent"
                                : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Criteria detail</p>
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {recommendationCriteria.find((item) => item.key === activeCriteriaKey)?.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] rounded-3xl overflow-hidden border border-border/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08, ease }}
          >
            <div className="bg-card p-6 sm:p-8 lg:p-10 xl:order-1">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-foreground">{whyPanels[1].title}</h3>
              <div className="h-px w-full bg-border/70 mb-6" />
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

            <div className="bg-secondary/50 p-4 sm:p-6 lg:p-8 xl:order-2">
              <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Supporting evidence panel</p>
                  <span className="text-xs px-2.5 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">Linked quotes</span>
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
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              isActive
                                ? "border-accent/40 bg-accent/10 text-accent"
                                : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {showEvidenceQuote && (
                      <div className="mt-3 rounded-xl border border-border/50 bg-card shadow-lg p-3 sm:p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                          Supporting note on {activeEvidenceTag}
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-2">
                          {evidenceDetails[activeEvidenceTag]}
                        </p>
                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                          “{evidenceQuoteMap[activeEvidenceTag]}”
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-accent" />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Cited rationale</p>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      “We report significant gains under controlled protocol settings, with explicit methodological constraints and reproducibility artifacts.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="pt-2 flex justify-center">
            <Link to="/signup">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                Start with PaperLens AI <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
