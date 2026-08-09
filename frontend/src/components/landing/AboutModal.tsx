import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ShinyButton } from "@/components/ui/shiny-button";

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

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close modal background"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 cursor-pointer"
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="PaperLens Logo" width="32" height="32" loading="lazy" decoding="async" className="w-8 h-8" />
            <h2 className="text-2xl font-semibold text-foreground">PaperLens AI</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            PaperLens AI is an intelligent research assistant designed to help students, engineers, and researchers accelerate their academic work.
          </p>
          <p>
            Our platform leverages advanced AI to analyze research papers, generate innovative ideas, detect research gaps, and plan experiments with precision.
          </p>
          <p>
            Whether you're a PhD candidate wrestling with literature reviews, a researcher exploring new directions, or an engineer studying state-of-the-art techniques, PaperLens AI transforms how you engage with academic content.
          </p>
          <p className="pt-4 font-medium text-foreground">
            Powered by cutting-edge AI to unlock insights from any paper in minutes.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <ShinyButton
            variant="inline"
            onClick={onClose}
            className="rounded-xl"
          >
            Close
          </ShinyButton>
        </div>
      </motion.div>
    </div>
  );
}
