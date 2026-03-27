import { Link } from "react-router-dom";
import { Github, Mail, Linkedin } from "lucide-react";

type LandingFooterProps = {
  onOpenAbout: () => void;
};

export default function LandingFooter({ onOpenAbout }: LandingFooterProps) {
  return (
    <footer className="py-8 sm:py-12 border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/favicon.svg" alt="PaperLens Logo" className="w-6 h-6" />
              <span className="text-sm font-semibold text-foreground">PaperLens AI</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">AI-powered research assistant for students, engineers, and researchers.</p>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/dashboard/analyzer" className="hover:text-foreground transition-colors">Paper Analyzer</Link></li>
              <li><Link to="/dashboard/planner" className="hover:text-foreground transition-colors">Experiment Planner</Link></li>
              <li><Link to="/dashboard/generator" className="hover:text-foreground transition-colors">Problem Generator</Link></li>
              <li><Link to="/dashboard/gaps" className="hover:text-foreground transition-colors">Gap Detection</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><button onClick={onOpenAbout} className="text-muted-foreground hover:text-foreground transition-colors">About</button></li>
              <li><a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a></li>
              <li><a href="mailto:pramanikarpan089@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Contact
              </a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Connect</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Email: <a href="mailto:pramanikarpan089@gmail.com" className="hover:text-foreground transition-colors">pramanikarpan089@gmail.com</a></p>
            <div className="flex gap-2 sm:gap-3">
              <a href="https://arpanpramanik.dev" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold" title="Portfolio">
                PF
              </a>
              <a href="https://www.linkedin.com/in/arpanpramanik2003/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 PaperLens AI. All rights reserved.</p>
          <p>Built with ❤️ by <a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Arpan Pramanik</a></p>
        </div>
      </div>
    </footer>
  );
}
