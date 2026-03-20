import { motion } from "framer-motion";
import { Upload, Sparkles, MessageSquare } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const steps = [
  { num: "01", title: "Upload Paper", desc: "Drag & drop your research PDF into PaperLens.", icon: Upload },
  { num: "02", title: "AI Analyzes", desc: "Our engine extracts structure, methodology, and key findings.", icon: Sparkles },
  { num: "03", title: "Ask & Generate", desc: "Chat with your paper, generate ideas, and plan experiments.", icon: MessageSquare },
];

const pipeline = [
  {
    title: "Ingest & Parse",
    desc: "Upload PDF and instantly extract sections, references, and technical entities.",
    bullets: ["Auto section detection", "Key-term extraction", "Smart context chunking"],
  },
  {
    title: "Deep Analysis",
    desc: "Structured AI reasoning across objectives, methods, results, and limitations.",
    bullets: ["Methodology breakdown", "Contribution mapping", "Result reliability checks"],
  },
  {
    title: "Action Layer",
    desc: "Turn insights into experiments, novel ideas, and validated research gaps.",
    bullets: ["Experiment blueprint", "Problem expansion", "Gap-to-next-step guidance"],
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-secondary/30 border-y border-border/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-4">How it works</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            From upload to publishable direction — a complete AI workflow for modern research.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6">
            <div className="space-y-0">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  className="relative flex gap-4 sm:gap-6 pb-10 last:pb-0"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12, ease }}
                >
                  {i < steps.length - 1 && (
                    <div className="absolute left-[19px] top-10 w-[2px] h-[calc(100%-20px)] bg-gradient-to-b from-accent/50 to-border" />
                  )}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <span className="text-xs font-mono font-medium text-accent">{s.num}</span>
                  </div>
                  <div className="pt-0.5 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-3.5 h-3.5 text-accent" />
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">{s.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {pipeline.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-border/50 bg-card/80 p-4 sm:p-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">{item.title}</h3>
                  <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full border border-accent/20 text-accent bg-accent/10">Phase {i + 1}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {item.bullets.map((bullet) => (
                    <div key={bullet} className="text-[11px] sm:text-xs rounded-lg border border-border/40 bg-secondary/40 px-2.5 py-2 text-foreground/90">
                      {bullet}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
