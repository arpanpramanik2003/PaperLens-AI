import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import AcademicBadge from "../../ui/AcademicBadge";
import KeyCap from "../../ui/KeyCap";
import HeroInteractiveLens from "./HeroInteractiveLens";
import { heroContent } from "../../data/landingContent";

const ease = [0.16, 1, 0.3, 1] as const;

type HeroSectionProps = {
  isDark?: boolean;
};

export default function HeroSection({ isDark = true }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative min-h-[92svh] pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden flex flex-col items-center justify-center scroll-mt-20"
    >
      <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Authoritative Academic Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-block mb-5 sm:mb-7"
        >
          <AcademicBadge
            variant="default"
            pulseDot
            icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          >
            {heroContent.badge}
          </AcademicBadge>
        </motion.div>

        {/* Editorial Headline */}
        <motion.h1
          className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground text-balance leading-[1.08] sm:leading-[1.05] mb-5 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
        >
          {heroContent.titleLine1}{" "}
          <span className="text-gradient-research block mt-1">
            {heroContent.titleLine2}
          </span>
        </motion.h1>

        {/* Narrative Subtitle */}
        <motion.p
          className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed text-balance"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease }}
        >
          {heroContent.description}
        </motion.p>

        {/* Cohesive Action Console */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease }}
        >
          <Link to="/signup" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-academic hover:bg-primary/90 hover:shadow-academic-lg active:scale-[0.98] transition-all duration-150"
            >
              <span>{heroContent.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          <a href="#agent-mode" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/80 dark:border-white/12 bg-card/70 hover:bg-muted/60 text-foreground font-medium text-sm transition-all duration-150 shadow-xs"
            >
              <Terminal className="w-4 h-4 text-accent" />
              <span>Explore Agent Mode</span>
              <KeyCap className="ml-1 hidden sm:inline-flex">⌘K</KeyCap>
            </button>
          </a>
        </motion.div>

        {/* Interactive Academic Lens Viewer Demo */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease }}
        >
          <HeroInteractiveLens />
        </motion.div>
      </div>
    </section>
  );
}
