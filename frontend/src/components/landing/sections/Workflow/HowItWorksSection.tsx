import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, BookOpen, Layers, Compass, CheckCircle2, ArrowRight } from "lucide-react";
import SectionHeader from "../../ui/SectionHeader";
import AcademicBadge from "../../ui/AcademicBadge";

const ease = [0.16, 1, 0.3, 1] as const;

const pipelineStages = [
  {
    num: "01",
    title: "Ingest & Dual-Column AST Extraction",
    badge: "Input Stream",
    subtitle: "2.4s Average Parse Latency",
    desc: "Extract clean structural syntax from complex dual-column PDFs or direct arXiv DOIs. Preserves mathematical proofs, LaTeX equations, theorem boundaries, and table references without flattening context.",
    bullets: [
      "Dual-column AST parsing with semantic block separation",
      "LaTeX proof & symbol dependency tree extraction",
      "Direct DOI extraction and reference graph linking",
    ],
    icon: Upload,
    stats: "100% Equation Lineage",
  },
  {
    num: "02",
    title: "Multi-Modal Reasoning & Claim Audit",
    badge: "Verification Engine",
    subtitle: "Semantic Scholar Graph Validation",
    desc: "Cross-checks empirical claims against reported benchmarks. The agent queries citation graphs to uncover baseline gaps, unstated training assumptions, and potential measurement confounders.",
    bullets: [
      "Cross-paper baseline & benchmark verification",
      "Confounding variable & data leakage detection",
      "Confidence-scored methodology extraction",
    ],
    icon: Layers,
    stats: "99.4% Provenance Rate",
  },
  {
    num: "03",
    title: "Generative Blueprint & Publication Dossier",
    badge: "Output Synthesis",
    subtitle: "Peer-Review Grade Deliverable",
    desc: "Translates verified findings into actionable scientific roadmaps: high-novelty research hypotheses, standardized ablation protocols, and executable PyTorch experiment blueprints.",
    bullets: [
      "Multi-stage ablation matrix isolating independent variables",
      "Novelty validation preventing redundant research effort",
      "Exportable publication dossier in LaTeX, Markdown & PDF",
    ],
    icon: Compass,
    stats: "Publication-Ready",
  },
];

export default function HowItWorksSection() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="how-it-works" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          badgeText="Verified Methodology"
          badgeIcon={<BookOpen className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="default"
          title="From Dual-Column PDF."
          titleAccent="To Publishable Direction."
          description="A continuous, evidence-anchored pipeline that deconstructs complex papers, verifies claims against literature graphs, and synthesizes actionable experimental roadmaps."
        />

        {/* 3-Stage Interactive Assembly Line Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pipelineStages.map((stage, idx) => (
            <motion.div
              key={stage.num}
              className={`academic-card rounded-2xl p-6 sm:p-7 border transition-all flex flex-col justify-between ${
                activeStage === idx
                  ? "border-accent/60 bg-card shadow-academic-lg ring-1 ring-accent/20"
                  : "border-border/70 dark:border-white/10 bg-card/60 hover:bg-card hover:border-border"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease }}
              onClick={() => setActiveStage(idx)}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-accent">
                    {stage.num}
                  </span>
                  <AcademicBadge variant="outline">
                    {stage.badge}
                  </AcademicBadge>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <stage.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                    {stage.title}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                  {stage.desc}
                </p>

                <div className="space-y-2 pt-3 border-t border-border/60">
                  {stage.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{stage.subtitle}</span>
                <span className="text-accent font-semibold">{stage.stats}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
