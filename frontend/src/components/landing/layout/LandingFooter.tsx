import { Link } from "react-router-dom";
import { Github, Mail, Linkedin, ExternalLink } from "lucide-react";
import { footerCapabilities } from "../data/landingNavigation";

type LandingFooterProps = {
  onOpenAbout: () => void;
};

export default function LandingFooter({ onOpenAbout }: LandingFooterProps) {
  return (
    <footer className="py-12 sm:py-16 border-t border-border/80 dark:border-white/10 bg-card/40 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3 group">
              <img
                src="/favicon.svg"
                alt="PaperLens Logo"
                width="24"
                height="24"
                loading="lazy"
                decoding="async"
                className="w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-105"
              />
              <span className="text-sm font-bold text-foreground tracking-tight">
                PaperLens<span className="text-accent ml-0.5">.ai</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-4">
              Evidence-anchored academic intelligence engine for researchers, PhD scholars, and ML engineers.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 dark:border-white/8 bg-muted/30 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>arXiv & Semantic Scholar Connected</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Research Capabilities
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {footerCapabilities.map((cap) => (
                <li key={cap.label}>
                  <Link
                    to={cap.href}
                    className={`hover:text-foreground transition-colors ${
                      cap.isAccent ? "font-semibold text-accent" : ""
                    }`}
                  >
                    {cap.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Platform & Verification
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <button
                  onClick={onOpenAbout}
                  className="hover:text-foreground transition-colors text-left"
                >
                  About PaperLens
                </button>
              </li>
              <li>
                <a
                  href="#evidence"
                  className="hover:text-foreground transition-colors"
                >
                  Provenance & Rigor Standard
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/arpanpramanik2003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" /> Source & Documentation
                </a>
              </li>
              <li>
                <a
                  href="mailto:pramanikarpan089@gmail.com"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" /> Academic Inquiries
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Connect & Research Community
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Built for researchers, by researchers.
            </p>
            <div className="flex gap-2">
              <a
                href="https://arpanpramanik.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-mono font-bold"
                title="Author Portfolio"
              >
                AP
              </a>
              <a
                href="https://www.linkedin.com/in/arpanpramanik2003/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://github.com/arpanpramanik2003"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="GitHub"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 dark:border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 PaperLens AI. Evidence-Anchored Scientific Research Platform.</p>
          <p className="flex items-center gap-1">
            Engineered by{" "}
            <a
              href="https://github.com/arpanpramanik2003"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              Arpan Pramanik <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
