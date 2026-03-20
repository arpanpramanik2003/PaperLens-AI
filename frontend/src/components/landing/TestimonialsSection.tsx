import { motion } from "framer-motion";
import { Star } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const testimonials = [
  { name: "Dr. Sarah Chen", role: "ML Researcher, Stanford", text: "Saved me hours of literature review. The gap detection is remarkably accurate.", rating: 5 },
  { name: "James Okonkwo", role: "PhD Candidate, MIT", text: "Best AI tool for academic work. The experiment planner changed how I approach research.", rating: 5 },
  { name: "Prof. Maria García", role: "Biomedical Engineering, ETH", text: "Finally, an AI tool that understands academic rigor. Highly recommended for any researcher.", rating: 5 },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Loved by researchers</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Join thousands of academics accelerating their work.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl border border-border/50 bg-card p-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
