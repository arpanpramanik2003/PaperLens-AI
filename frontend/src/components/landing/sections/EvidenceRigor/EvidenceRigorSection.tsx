import { motion } from "framer-motion";
import { Check, X, Shield, BookOpen, Layers, Award, Sparkles, Scale } from "lucide-react";
import SectionHeader from "../../ui/SectionHeader";
import AcademicBadge from "../../ui/AcademicBadge";
import { evidenceComparisonTable } from "../../data/landingContent";

const ease = [0.16, 1, 0.3, 1] as const;

export default function EvidenceRigorSection() {
  return (
    <section id="evidence" className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20 border-t border-border/70 dark:border-white/10 bg-card/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          badgeText="Academic Integrity Standard"
          badgeIcon={<Scale className="w-3.5 h-3.5 text-amber-500" />}
          badgeVariant="gold"
          title="The Standard of Rigor."
          titleAccent="Generic LLMs vs. PaperLens AI."
          description="General-purpose conversational AI was designed for plausible conversational prose. PaperLens AI was engineered for verified mathematical proofs, zero-hallucination citations, and peer-reviewed rigor."
        />

        {/* Comparison Table Container */}
        <motion.div
          className="academic-card rounded-2xl overflow-hidden border border-border/80 dark:border-white/12 bg-card shadow-academic-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border/70 dark:border-white/10 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono divide-y md:divide-y-0 md:divide-x divide-border/70 dark:divide-white/10">
            <div className="md:col-span-4 p-3.5 sm:p-4 flex items-center">
              <span>Evaluation Dimension</span>
            </div>
            <div className="md:col-span-4 p-3.5 sm:p-4 flex items-center gap-2 text-muted-foreground/80">
              <span className="w-2 h-2 rounded-full bg-destructive/80" />
              <span>Generic LLM Chatbots</span>
            </div>
            <div className="md:col-span-4 p-3.5 sm:p-4 flex items-center gap-2 text-foreground font-bold bg-accent/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>PaperLens Evidence Engine</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/70 dark:divide-white/10">
            {evidenceComparisonTable.map((row, idx) => (
              <div
                key={row.dimension}
                className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/70 dark:divide-white/10 hover:bg-muted/20 transition-colors"
              >
                {/* Dimension Column */}
                <div className="md:col-span-4 p-4 sm:p-5 flex flex-col justify-center">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {row.dimension}
                  </span>
                </div>

                {/* Generic AI Column */}
                <div className="md:col-span-4 p-4 sm:p-5 flex items-start gap-3 bg-muted/10">
                  <div className="p-1 rounded-full bg-destructive/10 text-destructive flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {row.genericAi}
                  </p>
                </div>

                {/* PaperLens Column */}
                <div className="md:col-span-4 p-4 sm:p-5 flex items-start gap-3 bg-accent/[0.02]">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    {row.paperlens}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer Telemetry Note */}
          <div className="p-4 bg-muted/30 border-t border-border/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              100% Deterministic Citation Linking Guarantee
            </span>
            <span className="text-accent font-semibold">Semantic Scholar Verified</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
