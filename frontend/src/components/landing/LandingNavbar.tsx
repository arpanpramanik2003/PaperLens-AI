import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LandingNavbarProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Explore", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export default function LandingNavbar({ isDark, onToggleTheme }: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHref, setActiveHref] = useState("#home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [desktopIndicatorStyle, setDesktopIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 10);
      setScrollProgress(Math.min(y / 160, 1));

      const sectionAnchors = navLinks
        .map((link) => {
          const section = document.getElementById(link.href.replace("#", ""));
          return section ? { href: link.href, top: section.offsetTop } : null;
        })
        .filter((item): item is { href: string; top: number } => Boolean(item))
        .sort((a, b) => a.top - b.top);

      if (!sectionAnchors.length) {
        return;
      }

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
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (isScrolled) {
      setIsMobileMenuOpen(false);
    }
  }, [isScrolled]);

  useEffect(() => {
    const updateDesktopIndicator = () => {
      const navEl = desktopNavRef.current;
      if (!navEl) {
        return;
      }

      const activeEl = navEl.querySelector<HTMLAnchorElement>(`a[data-href="${activeHref}"]`);
      if (!activeEl) {
        setDesktopIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      setDesktopIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    };

    updateDesktopIndicator();
    window.addEventListener("resize", updateDesktopIndicator);

    return () => {
      window.removeEventListener("resize", updateDesktopIndicator);
    };
  }, [activeHref, scrollProgress]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleNavClick = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(href.replace("#", ""));
    if (!target) {
      return;
    }
    setActiveHref(href);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    closeMobileMenu();
  };

  const navOuterPadding = 12 * scrollProgress;
  const navHorizontalPadding = 20 * scrollProgress;
  const navWidthReduction = 40 * scrollProgress;
  const navRadius = 16 * scrollProgress;

  return (
    <nav
      className="fixed top-0 w-full z-50 transition-[backdrop-filter] duration-500"
      style={{
        paddingTop: `${navOuterPadding}px`,
        paddingLeft: `${navHorizontalPadding}px`,
        paddingRight: `${navHorizontalPadding}px`,
      }}
    >
      <div
        className={`mx-auto transition-all duration-500 ${
          isScrolled
            ? "max-w-6xl rounded-2xl backdrop-blur-xl bg-background/72 border border-border/65 shadow-[0_10px_40px_-22px_rgba(0,0,0,0.45)]"
            : "max-w-none rounded-none bg-transparent border-transparent shadow-none"
        }`}
        style={{
          width: `calc(100% - ${navWidthReduction}px)`,
          borderRadius: `${navRadius}px`,
        }}
      >
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0 group">
          <img src="/favicon.svg" alt="PaperLens Logo" className="w-7 h-7 flex-shrink-0" />
          <span className="font-semibold text-foreground/95 group-hover:text-foreground transition-colors hidden sm:inline">PaperLens AI</span>
        </Link>

        <div
          ref={desktopNavRef}
          className="hidden md:flex relative items-center gap-2 rounded-full px-2 py-1 bg-background/70 border border-border/55 shadow-sm"
        >
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-background shadow-sm border border-border/60 transition-all duration-300 ease-out"
            style={{
              left: `${desktopIndicatorStyle.left}px`,
              width: `${desktopIndicatorStyle.width}px`,
              opacity: desktopIndicatorStyle.opacity,
            }}
          />
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              data-href={item.href}
              onClick={handleNavClick(item.href)}
              className={`relative z-10 px-3 py-1.5 rounded-full text-sm transition-all duration-300 after:absolute after:left-3 after:right-3 after:bottom-1 after:h-[2px] after:origin-left after:bg-gradient-to-r after:from-cyan-500 after:to-blue-500 after:transition-transform after:duration-300 ${
                activeHref === item.href
                  ? "text-foreground after:scale-x-100"
                  : "text-foreground/80 hover:text-foreground after:scale-x-0 hover:after:scale-x-100"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/80 hover:text-foreground hover:bg-background/80"
            onClick={onToggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-foreground/80 hover:text-foreground hover:bg-background/80"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-foreground/85 hover:text-foreground hover:bg-background/80 text-xs sm:text-sm">
              Log in
            </Button>
          </Link>
        </div>
      </div>

        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl p-3 space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleNavClick(item.href)}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeHref === item.href
                      ? "text-foreground bg-secondary/75"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2">
                <Link to="/login" className="block" onClick={closeMobileMenu}>
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Log in
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
