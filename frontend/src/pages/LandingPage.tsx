import { useEffect, useState } from "react";
import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import SocialProofSection from "../components/landing/SocialProofSection";
import AgentModeSection from "../components/landing/AgentModeSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import WhyPaperLensSection from "../components/landing/WhyPaperLensSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";
import AboutModal from "../components/landing/AboutModal";

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
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.08),transparent_70%)] dark:bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.25),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.05),transparent_76%)] dark:bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.12),transparent_76%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.05),transparent_80%)] dark:bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.1),transparent_80%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0.01)_34%,rgba(255,255,255,0.03))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.06)_34%,rgba(0,0,0,0.22))]" />
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
