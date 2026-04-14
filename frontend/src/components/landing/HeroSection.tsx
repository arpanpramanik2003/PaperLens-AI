import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import ShaderBackground from "@/components/ui/shader-background";

const ease = [0.2, 0, 0, 1] as const;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const shaderOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [1, 0.94, 0.72, 0.38]);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-[100svh] bg-transparent pt-24 pb-16 sm:pt-28 sm:pb-20 overflow-hidden scroll-mt-20 flex items-center"
    >
      <motion.div style={{ opacity: shaderOpacity }} className="absolute inset-0 z-0">
        <ShaderBackground
          variant="line-only"
          className="absolute inset-0 h-full w-full opacity-100 contrast-[1.35] saturate-[1.35] brightness-[1.02] dark:hidden"
        />
        <ShaderBackground
          className="absolute inset-0 h-full w-full hidden dark:block"
        />
      </motion.div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/6 via-white/2 to-white/30 dark:from-slate-950/10 dark:via-transparent dark:to-background" />
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full bg-transparent dark:bg-accent/5 blur-[140px]" />

      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/50 text-xs sm:text-sm text-muted-foreground mb-8">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            AI-Powered Research Assistant
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.0] mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          <span className="text-shimmer">Understand Research Papers</span>
          <span className="block text-slate-900 dark:text-foreground mt-0">in Minutes, Not Hours</span>
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base lg:text-lg text-slate-700 dark:text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
        >
          AI-powered platform to analyze papers, generate ideas, detect research gaps, and plan experiments.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
        >
          <div className="flex-shrink-0">
            <Link to="/signup" className="inline-block">
              <button className="btn-get-started" type="button">
                Get started
                <div className="icon">
                  <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
                  </svg>
                </div>
              </button>
            </Link>
          </div>
          <div className="flex-shrink-0">
            <a href="#features" className="inline-block">
              <button className="btn-explore" type="button">
                <span className="btn-explore-layer"></span>
                <span className="btn-explore-layer"></span>
                <span className="btn-explore-layer"></span>
                <span className="btn-explore-text">Explore</span>
                <span className="btn-explore-text-hover">Go!</span>
              </button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
