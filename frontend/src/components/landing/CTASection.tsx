import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ShinyButton } from "@/components/ui/shiny-button";

const ease = [0.2, 0, 0, 1] as const;

export default function CTASection() {
  return (
    <section className="py-16 sm:py-24 bg-secondary/30">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Ready to accelerate your research?</h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">Start analyzing papers in minutes. No credit card required.</p>
          <Link to="/signup">
            <ShinyButton variant="hero" className="w-full sm:w-auto rounded-full px-7 py-3 text-base">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </ShinyButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
