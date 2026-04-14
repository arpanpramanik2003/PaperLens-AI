import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, MessageSquare, ArrowRight, CheckCircle2, Zap } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const steps = [
  { num: "01", title: "Upload Paper", desc: "Drag & drop your research PDF into PaperLens.", icon: Upload, color: "from-cyan-500 to-violet-500" },
  { num: "02", title: "AI Analyzes", desc: "Our engine extracts structure, methodology, and key findings.", icon: Sparkles, color: "from-violet-500 to-pink-500" },
  { num: "03", title: "Ask & Generate", desc: "Chat with your paper, generate ideas, and plan experiments.", icon: MessageSquare, color: "from-pink-500 to-cyan-500" },
];

const pipeline = [
  {
    title: "Ingest & Parse",
    desc: "Upload PDF and instantly extract sections, references, and technical entities.",
    bullets: ["Auto section detection", "Key-term extraction", "Smart context chunking"],
    progress: 100,
    icon: Upload,
    color: "from-cyan-500/20 to-violet-500/20",
    borderColor: "border-cyan-500/30",
  },
  {
    title: "Deep Analysis",
    desc: "Structured AI reasoning across objectives, methods, results, and limitations.",
    bullets: ["Methodology breakdown", "Contribution mapping", "Result reliability checks"],
    progress: 100,
    icon: Sparkles,
    color: "from-violet-500/20 to-pink-500/20",
    borderColor: "border-violet-500/30",
  },
  {
    title: "Action Layer",
    desc: "Turn insights into experiments, novel ideas, and validated research gaps.",
    bullets: ["Experiment blueprint", "Problem expansion", "Gap-to-next-step guidance"],
    progress: 100,
    icon: MessageSquare,
    color: "from-pink-500/20 to-cyan-500/20",
    borderColor: "border-pink-500/30",
  },
];

export default function HowItWorksSection() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  return (
    <section id="how-it-works" className="relative py-20 sm:py-32 scroll-mt-20">

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
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-foreground">
              Complete Workflow
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            From Upload to <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">Publishable Direction</span>
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
                className="rounded-3xl backdrop-blur-xl border border-border/30 bg-card/40 p-8 overflow-hidden relative"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <h3 className="text-lg font-semibold mb-8 text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
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
                        <stop offset="0%" stopColor="rgb(6, 182, 212)" />
                        <stop offset="50%" stopColor="rgb(147, 51, 234)" />
                        <stop offset="100%" stopColor="rgb(236, 72, 153)" />
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
                      {/* Animated circle */}
                      <motion.div
                        className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          hoveredStep === s.num
                            ? "bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/50"
                            : "bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <s.icon className={`w-6 h-6 ${hoveredStep === s.num ? "text-white" : "text-accent"}`} />
                      </motion.div>

                      {/* Content */}
                      <motion.div
                        className="pt-2 flex-1"
                        animate={{
                          x: hoveredStep === s.num ? 4 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-xs font-semibold text-accent/60 mb-1 tracking-wider">STEP {s.num}</div>
                        <h4 className={`font-semibold text-foreground mb-2 transition-colors ${
                          hoveredStep === s.num ? "text-cyan-400" : ""
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
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  onMouseEnter={() => setHoveredPhase(item.title)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  whileHover={{ y: -4 }}
                >
                  {/* Background gradients */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="absolute inset-0 backdrop-blur-xl" />
                  
                  {/* Border */}
                  <div className={`absolute inset-0 rounded-2xl border ${item.borderColor} opacity-50 group-hover:opacity-100 transition-opacity`} />

                  {/* Content */}
                  <div className="relative p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <motion.div
                            className="p-2.5 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <item.icon className="w-5 h-5 text-accent" />
                          </motion.div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {item.desc}
                        </p>
                      </div>

                      <motion.div
                        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent whitespace-nowrap"
                        animate={{ scale: hoveredPhase === item.title ? 1.05 : 1 }}
                      >
                        Phase {i + 1}/3
                      </motion.div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {item.bullets.map((bullet, idx) => (
                        <motion.div
                          key={bullet}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/40 group-hover:border-accent/30 transition-all"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: i * 0.15 + idx * 0.05 }}
                          whileHover={{ x: 4, backgroundColor: "var(--secondary)" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-foreground/90 font-medium">{bullet}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Processing</span>
                        <span className="text-xs font-mono text-accent">{item.progress}%</span>
                      </div>
                      <motion.div
                        className="h-1.5 rounded-full bg-secondary/60 overflow-hidden"
                        initial={{ opacity: 0.5 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: i * 0.2 }}
                        />
                      </motion.div>
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
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-border/30 bg-card/30 backdrop-blur-sm hover:border-accent/50 transition-all cursor-pointer group">
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Ready to transform your research?
            </span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4 text-accent" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
