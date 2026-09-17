import { useEffect, useState } from "react";
import LandingNavbar from "../components/landing/layout/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import SocialProofSection from "../components/landing/SocialProofSection";
import AgentModeSection from "../components/landing/AgentModeSection";
import FeaturesSection from "../components/landing/feature-section/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import WhyPaperLensSection from "../components/landing/WhyPaperLensSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/layout/LandingFooter";
import AboutModal from "../components/landing/layout/AboutModal";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("paperlens-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });
  const [showAbout, setShowAbout] = useState(false);

  const handleNavigate = (href: string) => {
    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

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
        className="min-h-screen bg-background"
      >
        <div className="min-h-screen bg-background">
          <div className="relative overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {/* Subtle academic grid pattern */}
              <div className="absolute inset-0 academic-grid opacity-60" />
              {/* Refined cobalt focal glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.14),transparent_70%)]" />
              {/* Soft warm gold provenance ambient glow */}
              <div className="absolute top-[20%] right-[10%] w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.03),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05),transparent_70%)]" />
              {/* Smooth vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
            </div>
            <div className="relative z-10">
              <HeroSection isDark={isDark} />
              <SocialProofSection />
            </div>
          </div>
          {/* Shared background from Agent Mode to Loved by researchers */}
          <div className="bg-background overflow-hidden">
            <AgentModeSection />
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
