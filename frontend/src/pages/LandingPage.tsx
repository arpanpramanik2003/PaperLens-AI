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
      <HeroSection />
      <SocialProofSection />
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
