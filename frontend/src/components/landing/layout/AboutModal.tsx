import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const timeout = setTimeout(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close modal backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              onClose();
            }
          }}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="About PaperLens AI"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="academic-card rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto cursor-default shadow-academic-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/70 dark:border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/favicon.svg"
                  alt="PaperLens Logo"
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8"
                />
                <div>
                  <h2 className="text-xl font-bold text-foreground">PaperLens AI</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    v2.4.0 • Evidence-Anchored Scientific Platform
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">PaperLens AI</strong> is an advanced research workspace built for graduate students, ML engineers, and academic researchers seeking rigorous, evidence-grounded paper synthesis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/70 dark:border-white/8 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Zero Hallucinations</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every generated hypothesis is anchored to exact paper citations and verified against Semantic Scholar metadata.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/70 dark:border-white/8 bg-muted/20 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span>Equation & AST Parsing</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deconstructs dual-column PDFs, LaTeX proofs, and figure lineages while preserving mathematical relationships.
                  </p>
                </div>
              </div>

              <p>
                Whether conducting large-scale literature triage, designing reproducible ablation matrices, or identifying unaddressed research avenues, PaperLens transforms weeks of manual paper triage into actionable discoveries.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/70 dark:border-white/10 flex justify-end">
              <Button onClick={onClose} size="sm" className="px-5 text-xs font-medium">
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
