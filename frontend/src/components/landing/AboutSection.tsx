import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const points = [
  "Built for researchers, students, and engineers",
  "Grounded reasoning over black-box output",
  "From paper analysis to benchmark-driven execution",
  "Modern UI with focused academic workflow design",
];

const ease = [0.2, 0, 0, 1] as const;

export default function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="rounded-3xl border border-border/50 bg-card p-6 sm:p-10"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">About PaperLens AI</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl mb-6">
            PaperLens AI is a full-stack research co-pilot that helps you analyze academic papers, generate high-quality research directions, and transform ideas into measurable implementation plans.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {points.map((item) => (
              <div key={item} className="rounded-xl border border-border/40 bg-secondary/30 p-3.5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                <span className="text-sm text-foreground/90">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
