import { motion } from "framer-motion";
import { Quote, Award, CheckCircle2 } from "lucide-react";
import SectionHeader from "../../ui/SectionHeader";
import { academicTestimonials } from "../../data/landingContent";

const ease = [0.16, 1, 0.3, 1] as const;

export default function TestimonialsSection() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20 border-t border-border/70 dark:border-white/10 bg-card/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          badgeText="Verified Scholarly Impact"
          badgeIcon={<Award className="w-3.5 h-3.5 text-accent" />}
          badgeVariant="emerald"
          title="Engineered for Academics."
          titleAccent="Validated in Research Labs."
          description="Hear from graduate scholars, postdoctoral fellows, and principal investigators accelerating literature triage and hypothesis generation across top institutions."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {academicTestimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              className="academic-card rounded-2xl p-6 sm:p-7 border border-border/70 dark:border-white/10 bg-card flex flex-col justify-between shadow-academic hover:shadow-academic-lg transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease }}
              whileHover={{ y: -3 }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold">
                    {t.paperDomain}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    {t.doiQuote}
                  </span>
                </div>

                <div className="relative mb-6">
                  <Quote className="w-7 h-7 text-accent/20 absolute -top-3 -left-2 -z-0" />
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed relative z-10">
                    "{t.quote}"
                  </p>
                </div>
              </div>

              <div>
                {/* Quantified Research Impact Pill */}
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="font-semibold">{t.statHighlight}</span>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    {t.author}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-accent font-medium mt-0.5">
                    {t.institution}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
