import { motion } from "framer-motion";
import { ShieldCheck, Database, CheckCircle2, Zap } from "lucide-react";
import { trustMetrics, researcherAffiliations } from "../../data/landingContent";

const ease = [0.16, 1, 0.3, 1] as const;

export default function SocialProofSection() {
  return (
    <section className="relative py-12 sm:py-16 border-y border-border/70 dark:border-white/8 bg-card/30 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {trustMetrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="academic-card rounded-xl p-4 sm:p-5 border border-border/70 dark:border-white/8 bg-card text-center"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08, ease }}
              whileHover={{ y: -2 }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-foreground tracking-tight">
                {metric.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-foreground/90 mt-1">
                {metric.label}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                {metric.sublabel}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Community & Lab Affiliations Banner */}
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
            Designed for researchers & scholars affiliated with
          </p>

          <div className="flex items-center justify-center flex-wrap gap-x-6 sm:gap-x-10 gap-y-3">
            {researcherAffiliations.map((affil, i) => (
              <motion.span
                key={affil}
                className="font-mono text-xs sm:text-sm font-medium text-muted-foreground/75 hover:text-foreground cursor-default select-none transition-colors duration-200"
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                {affil}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
