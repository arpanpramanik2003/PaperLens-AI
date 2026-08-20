import { motion } from "framer-motion";
import { Star } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "ML Researcher, Stanford AI Lab",
    text: "PaperLens eliminated days of manual literature triage. The hypothesis extraction and provenance verification are remarkably rigorous.",
    rating: 5,
    tag: "Computer Vision",
  },
  {
    name: "James Okonkwo",
    role: "PhD Candidate, MIT CSAIL",
    text: "Best research co-pilot available. The autonomous agent synthesized an ablation matrix that caught critical hardware edge cases before submission.",
    rating: 5,
    tag: "Systems & Architecture",
  },
  {
    name: "Prof. Maria García",
    role: "Biomedical Engineering, ETH Zürich",
    text: "Finally, an AI assistant built for genuine academic standards. Grounded citation tracking makes literature reviews fast and completely trustworthy.",
    rating: 5,
    tag: "Bioinformatics",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-28 scroll-mt-20 bg-muted/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16 sm:mb-20"
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
              Community & Trust
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Loved by <span className="text-gradient-research">Researchers</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of academics, engineers, and scientists accelerating their scientific discoveries.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm hover:border-accent/40 transition-all duration-200 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              whileHover={{ y: -3 }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex gap-0.5" aria-label={`Rating: ${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-warning text-warning" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                    {t.tag}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mb-6 leading-relaxed">"{t.text}"</p>
              </div>

              <div className="pt-4 border-t border-border/60">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
