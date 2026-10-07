import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  Bot,
  Layers,
  Workflow,
  ShieldCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type LandingNavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate?: (href: string) => void;
  onOpenAbout?: () => void;
};

interface NavItem {
  label: string;
  href: string;
  icon: typeof Sparkles;
  description: string;
  isSpecial?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "#home",
    icon: Sparkles,
    description: "Hero & Executive Overview",
  },
  {
    label: "Agent Mode",
    href: "#agent-mode",
    icon: Bot,
    description: "Autonomous Multi-Step Reasoning",
  },
  {
    label: "Workstation",
    href: "#features",
    icon: Layers,
    description: "Unified Research Workbench",
  },
  {
    label: "Pipeline",
    href: "#how-it-works",
    icon: Workflow,
    description: "Ingestion to Verification Protocol",
  },
  {
    label: "Academic Rigor",
    href: "#evidence",
    icon: ShieldCheck,
    description: "100% Provenance vs Hallucinations",
  },
  {
    label: "About",
    href: "#about",
    icon: Info,
    description: "Platform Architecture & Mission",
    isSpecial: true,
  },
];

export default function LandingNavbar({
  isDark,
  onToggleTheme,
  onNavigate,
  onOpenAbout,
}: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Robust document-relative section tracker
  useEffect(() => {
    let rAFId: number | null = null;

    const handleScroll = () => {
      if (rAFId) return;
      rAFId = requestAnimationFrame(() => {
        rAFId = null;
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 20);

        // Calculate active section based on true viewport position
        const navOffset = 90;
        const probeY = scrollY + navOffset + 80;

        const targetItems = NAV_ITEMS.filter((item) => !item.isSpecial);
        let currentSection = targetItems[0]?.href || "#home";

        for (const item of targetItems) {
          const element = document.getElementById(item.href.replace("#", ""));
          if (element) {
            const elementTop =
              element.getBoundingClientRect().top + window.pageYOffset;
            if (probeY >= elementTop) {
              currentSection = item.href;
            } else {
              break;
            }
          }
        }

        setActiveHref(currentSection);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rAFId) cancelAnimationFrame(rAFId);
    };
  }, []);

  // Smooth scroll handler with reliable offset
  const scrollToTarget = (href: string) => {
    if (href === "#about") {
      onOpenAbout?.();
      return;
    }

    if (onNavigate) {
      onNavigate(href);
      return;
    }

    const targetId = href.replace("#", "");
    const target = document.getElementById(targetId);
    if (!target) return;

    const navOffset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = target.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - navOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  const handleNavClick = (
    href: string,
    event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    if (event) event.preventDefault();
    setActiveHref(href);
    scrollToTarget(href);
    setIsMobileMenuOpen(false);
  };

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring pointer-events-auto"
      >
        Skip to main content
      </a>

      {/* Responsive Floating Container */}
      <div
        className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 transition-all duration-300 ${
          isScrolled ? "pt-2.5 sm:pt-3" : "pt-3 sm:pt-4"
        }`}
      >
        <nav
          aria-label="Main Navigation"
          className={`pointer-events-auto relative flex items-center justify-between rounded-2xl sm:rounded-full transition-all duration-300 ${
            isScrolled
              ? "px-3.5 sm:px-5 py-2 backdrop-blur-xl bg-background/88 dark:bg-card/85 border border-border/80 dark:border-white/12 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]"
              : "px-3.5 sm:px-5 py-2.5 backdrop-blur-md bg-background/60 dark:bg-background/40 border border-border/40 dark:border-white/8 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.15)]"
          }`}
        >
          {/* ─── 1. Brand Logo & Name (Google SEO & Core Web Vitals Optimized) ─── */}
          <Link
            to="/"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                setActiveHref("#home");
              }
            }}
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
            aria-label="PaperLens AI - Home"
          >
            <picture className="flex-shrink-0 flex items-center justify-center">
              <source srcSet="/paperlens-logo.webp" type="image/webp" />
              <img
                src="/paperlens-logo.png"
                alt="PaperLens AI - Research Paper Intelligence"
                width="34"
                height="34"
                loading="eager"
                decoding="async"
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
              />
            </picture>

            <div className="flex flex-col text-left">
              <span className="font-bold tracking-tight text-foreground text-sm sm:text-base flex items-center leading-tight">
                PaperLens
                <span className="text-accent font-extrabold ml-0.5">.ai</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-muted-foreground hidden sm:block leading-none mt-0.5">
                Scientific Engine
              </span>
            </div>
          </Link>

          {/* ─── 2. Desktop Navigation Pills (Centered) ─── */}
          <div className="hidden lg:flex items-center gap-1 rounded-full px-2 py-1 bg-muted/45 dark:bg-card/50 border border-border/60 dark:border-white/8 shadow-inner">
            {NAV_ITEMS.map((item) => {
              const isActive = activeHref === item.href && !item.isSpecial;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(item.href, e)}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? "text-accent font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      className="absolute inset-0 rounded-full bg-background dark:bg-card border border-border/80 dark:border-white/10 shadow-xs -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          {/* ─── 3. Right Action Controls ─── */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8.5 w-8.5 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-colors"
              onClick={onToggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Moon className="w-4 h-4 text-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* Desktop Sign In Link */}
            <Link to="/login" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/85 hover:text-foreground hover:bg-muted/70 text-xs font-semibold px-3 h-8.5 rounded-lg"
              >
                Sign In
              </Button>
            </Link>

            {/* Desktop Get Started CTA */}
            <Link to="/signup" className="hidden sm:inline-flex">
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold rounded-lg px-3.5 h-8.5 gap-1.5 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8.5 w-8.5 rounded-lg text-foreground hover:bg-muted/80"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </nav>
      </div>

      {/* ─── 4. Responsive Mobile Drawer (All Screens 320px - 1024px) ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="pointer-events-auto fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Floating Dropdown Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto fixed top-[72px] left-3 right-3 sm:left-6 sm:right-6 z-50 max-w-lg mx-auto rounded-2xl bg-background/98 dark:bg-card/95 border border-border/80 dark:border-white/15 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-4 overflow-hidden lg:hidden"
            >
              {/* Drawer Header Badge */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Navigation Index
                  </span>
                </div>
                <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  v2.4.0
                </span>
              </div>

              {/* Navigation Items List */}
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeHref === item.href && !item.isSpecial;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={(e) => handleNavClick(item.href, e)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isActive
                          ? "bg-accent/12 text-accent font-semibold dark:text-blue-300"
                          : "text-foreground/85 hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium leading-none mb-1 truncate">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Actions at Bottom */}
              <div className="mt-4 pt-3.5 border-t border-border/60 grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl text-xs font-semibold border-border/80"
                  >
                    Sign In
                  </Button>
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button className="w-full h-10 rounded-xl text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm gap-1">
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
