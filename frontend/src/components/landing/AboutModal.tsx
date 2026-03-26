import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="PaperLens Logo" className="w-8 h-8" />
            <h2 className="text-2xl font-semibold text-foreground">PaperLens AI</h2>
          </div>
          <button
            onClick={onClose}
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
          <Button
            onClick={onClose}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
