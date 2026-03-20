import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.2, 0, 0, 1] as const;

export default function HeroSection() {
  return (
    <section id="home" className="relative pt-32 pb-24 overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
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
          <span className="block text-foreground mt-0">in Minutes, Not Hours</span>
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
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
