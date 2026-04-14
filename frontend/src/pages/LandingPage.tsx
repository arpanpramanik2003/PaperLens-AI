import { useEffect, useState } from "react";
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

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("paperlens-theme");
    const initialDarkMode = savedTheme ? savedTheme === "dark" : true;
    setIsDark(initialDarkMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("paperlens-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />
      <div className="relative overflow-hidden bg-white dark:bg-black">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.12),transparent_70%)] dark:bg-[radial-gradient(78%_60%_at_50%_36%,rgba(114,66,195,0.25),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.08),transparent_76%)] dark:bg-[radial-gradient(46%_36%_at_20%_72%,rgba(0,186,255,0.12),transparent_76%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.08),transparent_80%)] dark:bg-[radial-gradient(44%_34%_at_82%_68%,rgba(231,78,255,0.1),transparent_80%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_34%,rgba(255,255,255,0.06))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.06)_34%,rgba(0,0,0,0.22))]" />
        </div>
        <div className="relative z-10">
          <HeroSection />
          <SocialProofSection />
        </div>
      </div>
      <FeaturesSection />
      <HowItWorksSection />
      <WhyPaperLensSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter onOpenAbout={() => setShowAbout(true)} />
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
