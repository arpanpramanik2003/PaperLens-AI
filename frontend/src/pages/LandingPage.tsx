import { useEffect, useRef, useState } from "react";
import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import SocialProofSection from "../components/landing/SocialProofSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import WhyPaperLensSection from "../components/landing/WhyPaperLensSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";
import AboutModal from "../components/landing/AboutModal";
import useSmoothScrollbar from "../hooks/useSmoothScrollbar";

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const scrollbarRef = useSmoothScrollbar(scrollContainerRef, { damping: 0.08 });
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("paperlens-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [showAbout, setShowAbout] = useState(false);
  // Initialize smooth-scrollbar on the landing page (desktop only)

  const handleNavigate = (href: string) => {
    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const scrollbar = scrollbarRef.current;
    if (scrollbar && typeof scrollbar.scrollTo === "function") {
      const topOffset = targetId === "home" ? 0 : 80;
      scrollbar.scrollTo(0, Math.max(target.offsetTop - topOffset, 0), 600);
      return;
    }

    target.style.scrollMarginTop = "80px";
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("paperlens-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="bg-background">
      <LandingNavbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onNavigate={handleNavigate}
      />
      <main
        id="main-content"
        ref={scrollContainerRef}
        className={isTouchDevice ? "min-h-screen overflow-x-hidden bg-background" : "h-screen overflow-hidden bg-background"}
      >
        <div className={isTouchDevice ? "min-h-screen bg-background" : "min-h-full bg-background"}>
          <div className="relative overflow-hidden bg-white dark:bg-black">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.12),transparent_70%)] dark:bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.25),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.08),transparent_76%)] dark:bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.12),transparent_76%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.08),transparent_80%)] dark:bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.1),transparent_80%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_34%,rgba(255,255,255,0.06))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.06)_34%,rgba(0,0,0,0.22))]" />
            </div>
            <div className="relative z-10">
              <HeroSection isDark={isDark} />
              <SocialProofSection />
            </div>
          </div>
          {/* Shared pure black (dark) / pure white (light) background from Explore to Loved by researchers */}
          <div className="bg-white dark:bg-black overflow-hidden">
            <FeaturesSection />
            <HowItWorksSection />
            <WhyPaperLensSection />
            <TestimonialsSection />
          </div>
          <CTASection />
          <LandingFooter onOpenAbout={() => setShowAbout(true)} />
          <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
        </div>
      </main>
    </div>
  );
}
