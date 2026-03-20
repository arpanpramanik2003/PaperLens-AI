import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
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
  return (
    <nav className="fixed top-0 w-full z-50 glass-surface border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="PaperLens Logo" className="w-7 h-7 flex-shrink-0" />
          <span className="font-semibold text-foreground hidden sm:inline">PaperLens AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onToggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
