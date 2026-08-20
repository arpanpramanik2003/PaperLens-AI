import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, MessageSquare, ArrowRight, CheckCircle2, Zap } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const steps = [
  { num: "01", title: "Upload Paper", desc: "Drag & drop your research PDF into PaperLens.", icon: Upload, color: "from-blue-600 to-indigo-600" },
  { num: "02", title: "AI Analyzes", desc: "Our engine extracts structure, methodology, and key findings.", icon: Sparkles, color: "from-indigo-600 to-violet-600" },
  { num: "03", title: "Ask & Generate", desc: "Chat with your paper, generate ideas, and plan experiments.", icon: MessageSquare, color: "from-violet-600 to-blue-600" },
];

const pipeline = [
  {
    title: "Ingest & Parse",
    desc: "Upload PDF and instantly extract sections, references, and technical entities.",
    bullets: ["Auto section detection", "Key-term extraction", "Smart context chunking"],
    progress: 100,
    icon: Upload,
  },
  {
    title: "Deep Analysis",
    desc: "Structured AI reasoning across objectives, methods, results, and limitations.",
    bullets: ["Methodology breakdown", "Contribution mapping", "Result reliability checks"],
    progress: 100,
    icon: Sparkles,
  },
  {
    title: "Action Layer",
    desc: "Turn insights into experiments, novel ideas, and validated research gaps.",
    bullets: ["Experiment blueprint", "Problem expansion", "Gap-to-next-step guidance"],
    progress: 100,
    icon: MessageSquare,
  },
];

export default function HowItWorksSection() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  return (
    <section id="how-it-works" className="relative pt-10 pb-20 sm:pt-14 sm:pb-32 scroll-mt-20">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
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
              Complete Workflow
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            From Upload to <span className="text-gradient-research">Publishable Direction</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Streamlined AI workflow that transforms your research paper into actionable insights, experiments, and publication-ready directions in just three powerful steps.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 mb-20">
          {/* Steps Timeline */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <motion.div
                className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm overflow-hidden relative"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-lg font-semibold mb-8 text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Process Steps
                </h3>

                <div className="space-y-0 relative">
                  {/* Animated connecting line */}
                  <svg className="absolute left-6 top-12 w-1 h-[calc(100%-48px)]" viewBox="0 0 1 100" preserveAspectRatio="none">
                    <motion.line
                      x1="0.5"
                      y1="0"
                      x2="0.5"
                      y2="100"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--accent))" />
                        <stop offset="100%" stopColor="hsl(262, 70%, 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {steps.map((s, i) => (
                    <motion.div
                      key={s.num}
                      className="relative flex gap-5 pb-12 last:pb-0"
                      onMouseEnter={() => setHoveredStep(s.num)}
                      onMouseLeave={() => setHoveredStep(null)}
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.15 }}
                    >
                      {/* Circle */}
                      <motion.div
                        className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-gradient-to-br ${s.color} text-white shadow-sm`}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <s.icon className="w-5 h-5" />
                      </motion.div>

                      {/* Content */}
                      <motion.div
                        className="pt-1 flex-1"
                        animate={{
                          x: hoveredStep === s.num ? 4 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-xs font-semibold text-accent mb-1 tracking-wider">STEP {s.num}</div>
                        <h4 className={`font-semibold text-foreground mb-1.5 transition-colors ${
                          hoveredStep === s.num ? "text-accent" : ""
                        }`}>
                          {s.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {s.desc}
                        </p>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Pipeline Phases */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {pipeline.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="group relative rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-sm overflow-hidden cursor-pointer hover:border-accent/40 transition-colors"
                  onMouseEnter={() => setHoveredPhase(item.title)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
                            <item.icon className="w-5 h-5 text-accent" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {item.desc}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent whitespace-nowrap">
                        Phase {i + 1}/3
                      </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {item.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/60 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-foreground/90 font-medium">{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Pipeline State</span>
                        <span className="text-xs font-mono font-semibold text-accent">{item.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-accent rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border bg-card shadow-sm hover:border-accent transition-all cursor-pointer group">
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Ready to transform your research?
            </span>
            <ArrowRight className="w-4 h-4 text-accent transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
