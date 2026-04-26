import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, FileSearch, Quote, Lightbulb, FlaskConical, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import ShaderBackground from "@/components/ui/shader-background";
import LightHeroBackground from "@/components/ui/light-hero-background";

const ease = [0.2, 0, 0, 1] as const;

const MOBILE_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  left: `${5 + ((i * 6.5) % 90)}%`,
  delay: `${((i * 0.7) % 5).toFixed(1)}s`,
  duration: `${4 + (i % 4) * 1.5}s`,
  size: `${1.5 + (i % 3)}px`,
}));

type HeroSectionProps = {
  isDark?: boolean;
};

export default function HeroSection({ isDark = true }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
      {/* ─── Desktop: Shader / Aurora background ─── */}
      {!isMobile && (
        <motion.div style={{ opacity: shaderOpacity }} className="absolute inset-0 z-0">
          {isDark ? (
            <ShaderBackground className="absolute inset-0 h-full w-full" />
          ) : (
            <LightHeroBackground />
          )}
        </motion.div>
      )}

      {/* ─── Mobile: Animated gradient mesh background ─── */}
      {isMobile && (
        <div className="hero-mobile-bg absolute inset-0 z-0" aria-hidden="true">
          <div className="hero-mobile-orb hero-mobile-orb--1" />
          <div className="hero-mobile-orb hero-mobile-orb--2" />
          <div className="hero-mobile-orb hero-mobile-orb--3" />
          <div className="hero-mobile-grid" />
          <div className="hero-mobile-ring hero-mobile-ring--1" />
          <div className="hero-mobile-ring hero-mobile-ring--2" />
          <div className="hero-mobile-ring hero-mobile-ring--3" />
          <div className="hero-mobile-glow" />
          {MOBILE_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="hero-mobile-particle"
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
          <div className="hero-mobile-scanline" />
          <div className="hero-mobile-vignette" />
        </div>
      )}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/6 via-white/2 to-white/30 dark:from-slate-950/10 dark:via-transparent dark:to-background" />
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full bg-transparent dark:bg-accent/5 blur-[140px]" />

      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* ─── Badge ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/50 text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            AI-Powered Research Assistant
          </div>
        </motion.div>

        {/* ─── Heading ─── */}
        <motion.h1
          className="text-[1.75rem] sm:text-4xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1] sm:leading-[1.0] mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
        >
          <span className="text-shimmer">Understand Research Papers</span>
          <span className="block text-slate-900 dark:text-foreground mt-0">in Minutes, Not Hours</span>
        </motion.h1>

        {/* ─── Description ─── */}
        <motion.p
          className="text-[0.82rem] sm:text-base lg:text-lg text-slate-700 dark:text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
        >
          AI-powered platform to analyze papers, generate ideas, detect research gaps, and plan experiments.
        </motion.p>

        {/* ─── Mobile: Feature Capability Chips ─── */}
        {isMobile && (
          <motion.div
            className="grid grid-cols-2 gap-2.5 mb-7 max-w-xs mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
          >
            {[
              { icon: FileSearch, label: "Smart Summaries", color: "text-cyan-400" },
              { icon: Quote, label: "Citation Intel", color: "text-purple-400" },
              { icon: Lightbulb, label: "Research Gaps", color: "text-amber-400" },
              { icon: FlaskConical, label: "Experiment Plans", color: "text-pink-400" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="hero-mobile-chip"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08, ease }}
              >
                <item.icon className={`w-3.5 h-3.5 ${item.color} flex-shrink-0`} />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── Buttons ─── */}
        <motion.div
          className="flex flex-row items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: isMobile ? 0.5 : 0.3, ease }}
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

        {/* ─── Mobile: Stats Row ─── */}
        {isMobile && (
          <motion.div
            className="hero-mobile-stats"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease }}
          >
            <div className="hero-mobile-stat">
              <span className="hero-mobile-stat-value">PDF</span>
              <span className="hero-mobile-stat-label">Upload & Analyze</span>
            </div>
            <div className="hero-mobile-stat-divider" />
            <div className="hero-mobile-stat">
              <span className="hero-mobile-stat-value">AI</span>
              <span className="hero-mobile-stat-label">Powered Insights</span>
            </div>
            <div className="hero-mobile-stat-divider" />
            <div className="hero-mobile-stat">
              <span className="hero-mobile-stat-value">Fast</span>
              <span className="hero-mobile-stat-label">Results in Seconds</span>
            </div>
          </motion.div>
        )}

        {/* ─── Mobile: Scroll Indicator ─── */}
        {isMobile && (
          <motion.div
            className="mt-8 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
