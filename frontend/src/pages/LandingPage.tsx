import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";
import LandingNavbar from "../components/landing/layout/LandingNavbar";
import HeroSection from "../components/landing/sections/Hero/HeroSection";
import SocialProofSection from "../components/landing/sections/SocialProof/SocialProofSection";
import AgentShowcaseSection from "../components/landing/sections/AgentShowcase/AgentShowcaseSection";
import WorkstationSection from "../components/landing/sections/Workstation/WorkstationSection";
import HowItWorksSection from "../components/landing/sections/Workflow/HowItWorksSection";
import EvidenceRigorSection from "../components/landing/sections/EvidenceRigor/EvidenceRigorSection";
import TestimonialsSection from "../components/landing/sections/Testimonials/TestimonialsSection";
import CTASection from "../components/landing/sections/CTA/CTASection";
import LandingFooter from "../components/landing/layout/LandingFooter";
import AboutModal from "../components/landing/layout/AboutModal";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("paperlens-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [showAbout, setShowAbout] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis with smooth momentum settings
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease-out
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handleNavigate = (href: string) => {
    if (href === "#about") {
      setShowAbout(true);
      return;
    }

    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: -76,
        duration: 1.2,
      });
    } else {
      const navOffset = 76;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = target.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = Math.max(0, elementPosition - navOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
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
        onOpenAbout={() => setShowAbout(true)}
      />
      <main
        id="main-content"
        className="min-h-screen bg-background"
      >
        <div className="min-h-screen bg-background">
          <div className="relative overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(78%_60%_at_50%_36%,rgba(59,130,246,0.10),transparent_70%)] dark:bg-[radial-gradient(78%_60%_at_50%_36%,rgba(59,130,246,0.20),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(46%_36%_at_20%_72%,rgba(56,189,248,0.06),transparent_76%)] dark:bg-[radial-gradient(46%_36%_at_20%_72%,rgba(56,189,248,0.12),transparent_76%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(44%_34%_at_82%_68%,rgba(99,102,241,0.05),transparent_80%)] dark:bg-[radial-gradient(44%_34%_at_82%_68%,rgba(99,102,241,0.10),transparent_80%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.01)_34%,rgba(255,255,255,0.03))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.06)_34%,rgba(0,0,0,0.22))]" />
            </div>
            <div className="relative z-10">
              <HeroSection isDark={isDark} />
              <SocialProofSection />
            </div>
          </div>
          {/* Shared background from Agent Mode to Loved by researchers */}
          <div className="bg-background overflow-hidden">
            <AgentShowcaseSection />
            <WorkstationSection />
            <HowItWorksSection />
            <EvidenceRigorSection />
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
