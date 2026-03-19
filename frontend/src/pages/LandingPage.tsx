import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Lightbulb, FlaskConical, Search, ArrowRight, Upload, Sparkles, MessageSquare, Star, ChevronRight, Github, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ease = [0.2, 0, 0, 1] as const;

const features = [
  { icon: FileText, title: "Paper Analyzer", desc: "Upload papers and get structured insights — summary, methodology, results, and limitations." },
  { icon: Lightbulb, title: "Problem Statement Generator", desc: "Generate research ideas from your domain with AI-powered creativity." },
  { icon: FlaskConical, title: "Experiment Planner", desc: "Step-by-step research execution plan with datasets, models, and evaluation." },
  { icon: Search, title: "Gap Detection Engine", desc: "Identify research gaps and get actionable suggestions for improvement." },
];

const steps = [
  { num: "01", title: "Upload Paper", desc: "Drag & drop your research PDF into PaperLens.", icon: Upload },
  { num: "02", title: "AI Analyzes", desc: "Our engine extracts structure, methodology, and key findings.", icon: Sparkles },
  { num: "03", title: "Ask & Generate", desc: "Chat with your paper, generate ideas, and plan experiments.", icon: MessageSquare },
];

const testimonials = [
  { name: "Dr. Sarah Chen", role: "ML Researcher, Stanford", text: "Saved me hours of literature review. The gap detection is remarkably accurate.", rating: 5 },
  { name: "James Okonkwo", role: "PhD Candidate, MIT", text: "Best AI tool for academic work. The experiment planner changed how I approach research.", rating: 5 },
  { name: "Prof. Maria García", role: "Biomedical Engineering, ETH", text: "Finally, an AI tool that understands academic rigor. Highly recommended for any researcher.", rating: 5 },
];

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-surface border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PaperLens Logo" className="w-7 h-7" />
            <span className="font-semibold text-foreground">PaperLens AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/50 text-sm text-muted-foreground mb-8">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              AI-Powered Research Assistant
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <span className="text-shimmer">Understand Research Papers</span>
            <br />
            <span className="text-foreground">in Minutes, Not Hours</span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            AI-powered platform to analyze papers, generate ideas, detect research gaps, and plan experiments.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
          >
            <Link to="/signup">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                Try Demo <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
            Trusted by researchers at
          </p>
          <div className="flex items-center justify-center gap-12 opacity-40">
            {["Nature", "IEEE", "arXiv", "Springer", "ACM"].map((name) => (
              <span key={name} className="font-mono text-sm text-muted-foreground font-medium">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Everything you need for research</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Four powerful tools to accelerate every stage of your research workflow.</p>
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

      {/* How it Works */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to unlock insights from any paper.</p>
          </motion.div>

          <div className="space-y-0">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="relative flex gap-6 pb-12 last:pb-0"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15, ease }}
              >
                {i < steps.length - 1 && (
                  <div className="absolute left-[19px] top-10 w-[2px] h-[calc(100%-24px)] bg-border" />
                )}
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-xs font-mono font-medium text-accent">{s.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Loved by researchers</h2>
            <p className="text-muted-foreground">Join thousands of academics accelerating their work.</p>
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

      {/* CTA */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Ready to accelerate your research?</h2>
            <p className="text-muted-foreground mb-8">Start analyzing papers in minutes. No credit card required.</p>
            <Link to="/signup">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <Search className="w-3 h-3 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">PaperLens AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Contact
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 PaperLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
