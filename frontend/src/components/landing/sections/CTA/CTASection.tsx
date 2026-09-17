import { motion } from "framer-motion";
import { ArrowRight, Terminal, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AcademicBadge from "../../ui/AcademicBadge";
import KeyCap from "../../ui/KeyCap";
import { ctaContent } from "../../data/landingContent";

const ease = [0.16, 1, 0.3, 1] as const;

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-28 bg-card border-y border-border/70 dark:border-white/10 overflow-hidden">
      {/* Subtle radial ambient spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="inline-block mb-4">
            <AcademicBadge
              variant="default"
              pulseDot
              icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
            >
              {ctaContent.badge}
            </AcademicBadge>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-4 text-balance">
            {ctaContent.title}{" "}
            <span className="text-gradient-research block mt-1">
              {ctaContent.titleAccent}
            </span>
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 text-balance">
            {ctaContent.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
            <Link to="/signup" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-academic hover:bg-primary/90 hover:shadow-academic-lg active:scale-[0.98] transition-all"
              >
                <span>{ctaContent.buttonPrimary}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link to="/agent" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border/80 dark:border-white/12 bg-card/80 hover:bg-muted/60 text-foreground font-medium text-sm transition-all shadow-xs"
              >
                <Terminal className="w-4 h-4 text-accent" />
                <span>{ctaContent.buttonSecondary}</span>
                <KeyCap className="ml-1 hidden sm:inline-flex">⌘K</KeyCap>
              </button>
            </Link>
          </div>

          {/* Quick Assurance Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Provenance Anchored
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              Sub-second AST Parsing
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Free Academic Tier
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
