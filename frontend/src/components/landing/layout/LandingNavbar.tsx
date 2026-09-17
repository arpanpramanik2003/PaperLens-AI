import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "../data/landingNavigation";

type LandingNavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate: (href: string) => void;
};

export default function LandingNavbar({
  isDark,
  onToggleTheme,
  onNavigate,
}: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHref, setActiveHref] = useState("#home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let sectionAnchors: { href: string; top: number }[] = [];

    const updateAnchors = () => {
      sectionAnchors = navLinks
        .map((link) => {
          const section = document.getElementById(link.href.replace("#", ""));
          return section ? { href: link.href, top: section.offsetTop } : null;
        })
        .filter((item): item is { href: string; top: number } => Boolean(item))
        .sort((a, b) => a.top - b.top);
    };

    updateAnchors();
    window.addEventListener("resize", updateAnchors, { passive: true });

    let rAFId: number | null = null;
    const handleScroll = () => {
      if (rAFId) return;
      rAFId = requestAnimationFrame(() => {
        rAFId = null;
        const y = window.scrollY;
        setIsScrolled(y > 10);
        setScrollProgress(Math.min(y / 160, 1));

        if (!sectionAnchors.length) return;

        const viewportProbe = y + window.innerHeight * 0.35;
        let currentHref = sectionAnchors[0].href;

        for (const anchor of sectionAnchors) {
          if (viewportProbe >= anchor.top) {
            currentHref = anchor.href;
          } else {
            break;
          }
        }

        setActiveHref((prev) => (prev === currentHref ? prev : currentHref));
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", updateAnchors);
      window.removeEventListener("scroll", handleScroll);
      if (rAFId) cancelAnimationFrame(rAFId);
    };
  }, []);

  useEffect(() => {
    if (isScrolled) {
      setIsMobileMenuOpen(false);
    }
  }, [isScrolled]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleNavClick =
    (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setActiveHref(href);
      onNavigate(href);
      closeMobileMenu();
    };

  const navOuterPadding = 10 * scrollProgress;
  const navHorizontalPadding = 16 * scrollProgress;
  const navWidthReduction = 32 * scrollProgress;
  const navRadius = 16 * scrollProgress;

  return (
    <nav
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        paddingTop: `${navOuterPadding}px`,
        paddingLeft: `${navHorizontalPadding}px`,
        paddingRight: `${navHorizontalPadding}px`,
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div
        className={`mx-auto transition-all duration-300 transform-gpu ${
          isScrolled
            ? "max-w-6xl rounded-2xl backdrop-blur-xl bg-background/80 border border-border/80 dark:border-white/10 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)]"
            : "max-w-none rounded-none bg-transparent border-transparent shadow-none"
        }`}
        style={{
          width: `calc(100% - ${navWidthReduction}px)`,
          borderRadius: `${navRadius}px`,
        }}
      >
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
            <img
              src="/favicon.svg"
              alt="PaperLens Logo"
              width="26"
              height="26"
              decoding="async"
              className="w-6.5 h-6.5 flex-shrink-0 transition-transform group-hover:scale-105"
            />
            <span className="font-semibold text-foreground/95 group-hover:text-foreground transition-colors tracking-tight text-sm sm:text-base">
              PaperLens<span className="text-accent ml-0.5">.ai</span>
            </span>
          </Link>

          <div
            ref={desktopNavRef}
            className="hidden md:flex relative items-center gap-1 rounded-full px-2 py-1 bg-muted/40 border border-border/60 dark:border-white/8 backdrop-blur-md"
          >
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                data-href={item.href}
                onClick={handleNavClick(item.href)}
                className={`relative z-10 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeHref === item.href
                    ? "text-foreground bg-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground/75 hover:text-foreground hover:bg-muted/60 rounded-full"
              onClick={onToggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-full"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            <Link to="/login" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/80 hover:text-foreground hover:bg-muted/60 text-xs font-medium px-3"
              >
                Sign in
              </Button>
            </Link>

            <Link to="/signup" className="hidden sm:inline-flex">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-lg px-3 py-1.5 h-8 gap-1 shadow-xs"
              >
                <span>Get started</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="rounded-xl border border-border/70 dark:border-white/10 bg-background/95 backdrop-blur-xl p-3 space-y-1 shadow-lg">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleNavClick(item.href)}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeHref === item.href
                      ? "text-foreground bg-secondary/80 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 border-t border-border/50 flex gap-2">
                <Link to="/login" className="flex-1" onClick={closeMobileMenu}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={closeMobileMenu}>
                  <Button size="sm" className="w-full text-xs">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
