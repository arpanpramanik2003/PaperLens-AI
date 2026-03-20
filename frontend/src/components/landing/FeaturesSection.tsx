import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Lightbulb, FlaskConical, Search } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const features = [
  { icon: FileText, title: "Paper Analyzer", desc: "Upload papers and get structured insights — summary, methodology, results, and limitations." },
  { icon: Lightbulb, title: "Problem Statement Generator", desc: "Generate research ideas from your domain with AI-powered creativity." },
  { icon: FlaskConical, title: "Experiment Planner", desc: "Step-by-step research execution plan with datasets, models, and evaluation." },
  { icon: Search, title: "Gap Detection Engine", desc: "Identify research gaps and get actionable suggestions for improvement." },
];

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

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
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Powerful features for researchers</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Everything you need to accelerate your research work.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative rounded-2xl p-[1px]"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className={`rounded-2xl p-6 h-full transition-all duration-200 border border-border/50 ${hoveredFeature === i ? 'border-accent/30 bg-accent/5' : 'bg-card'}`}>
                <f.icon className="w-5 h-5 text-accent mb-4" strokeWidth={1.5} />
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
