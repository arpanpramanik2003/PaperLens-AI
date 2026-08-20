import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ShinyButton } from "@/components/ui/shiny-button";

const ease = [0.2, 0, 0, 1] as const;

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-28 bg-card border-y border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-research">
              Get Started
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Ready to accelerate your <span className="text-gradient-research">Research?</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Start synthesizing literature, planning experiments, and detecting research gaps in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <ShinyButton variant="hero" className="w-full sm:w-auto rounded-full px-8 py-3 text-sm sm:text-base font-semibold shadow-lg shadow-accent/25">
                Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
              </ShinyButton>
            </Link>
            <Link to="/agent" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold border border-border bg-secondary/80 text-foreground hover:bg-secondary transition-all">
                Try Agent Mode
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
