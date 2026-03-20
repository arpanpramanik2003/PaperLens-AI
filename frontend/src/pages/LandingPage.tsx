import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Lightbulb, FlaskConical, Search, ArrowRight, Upload, Sparkles, MessageSquare, Star, ChevronRight, Github, Mail, X, Linkedin, CheckCircle2, Info, Quote } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
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

const whyPanels = [
  {
    title: "Precisely configurable",
    description:
      "Define your own screening criteria and evaluation priorities. PaperLens adapts to your research objective instead of forcing generic summaries.",
    points: [
      "Custom inclusion/exclusion logic",
      "Criteria-level confidence signals",
      "One-click recommendation override",
    ],
  },
  {
    title: "Evidence-linked reasoning",
    description:
      "Every decision can be traced to explicit rationale and supporting cues, so you can validate outputs faster and write with confidence.",
    points: [
      "Transparent ‘why included’ explanation",
      "Criteria-level detail tags",
      "Quote-first interpretation workflow",
    ],
  },
];

const recommendationCriteria = [
  {
    key: "methodology",
    label: "Methodology fit",
    tone: "good",
    detail: "Directly evaluates structured paper understanding with clearly defined methodology blocks.",
  },
  {
    key: "evaluation",
    label: "Quantitative evaluation",
    tone: "good",
    detail: "Reports measurable performance metrics across multiple benchmark datasets.",
  },
  {
    key: "reproducibility",
    label: "Reproducibility",
    tone: "good",
    detail: "Includes ablation settings and implementation notes that support reruns.",
  },
  {
    key: "alignment",
    label: "Cross-domain evidence",
    tone: "neutral",
    detail: "Shows transfer across NLP and biomedical contexts with consistent behavior.",
  },
];

const evidenceDetails = {
  "Study design": "Controlled evaluation setup with explicit assumptions and bounded scope.",
  Population: "Tested on representative datasets with clear sampling criteria.",
  Intervention: "Compares baseline vs. adapted model behavior under same constraints.",
  "Outcome metrics": "Precision, recall, and faithfulness-oriented checks are all reported.",
  "Limitation clarity": "Failure modes and blind spots are documented for downstream judgment.",
} as const;

const evidenceQuoteMap = {
  "Study design": "A controlled protocol isolates model adaptation effects from prompt-only variance.",
  Population: "Datasets span scientific domains to assess stability of reasoning quality.",
  Intervention: "Model adaptation is tested against equivalent baseline inference budgets.",
  "Outcome metrics": "Improvements are significant on structure extraction and grounded QA tasks.",
  "Limitation clarity": "Edge cases remain in long-tail notation and highly sparse methodology sections.",
} as const;

const testimonials = [
  { name: "Dr. Sarah Chen", role: "ML Researcher, Stanford", text: "Saved me hours of literature review. The gap detection is remarkably accurate.", rating: 5 },
  { name: "James Okonkwo", role: "PhD Candidate, MIT", text: "Best AI tool for academic work. The experiment planner changed how I approach research.", rating: 5 },
  { name: "Prof. Maria García", role: "Biomedical Engineering, ETH", text: "Finally, an AI tool that understands academic rigor. Highly recommended for any researcher.", rating: 5 },
];

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [activeCriteriaKey, setActiveCriteriaKey] = useState(recommendationCriteria[0].key);
  const [activeEvidenceTag, setActiveEvidenceTag] = useState<keyof typeof evidenceDetails>("Study design");
  const [showEvidenceQuote, setShowEvidenceQuote] = useState(false);
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (isLoaded && userId) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoaded, userId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-surface border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src="/favicon.svg" alt="PaperLens Logo" className="w-7 h-7 flex-shrink-0" />
            <span className="font-semibold text-foreground hidden sm:inline">PaperLens AI</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs sm:text-sm">
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

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-secondary/50 text-xs sm:text-sm text-muted-foreground mb-8">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              AI-Powered Research Assistant
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <span className="text-shimmer">Understand Research Papers</span>
            <br />
            <span className="text-foreground">in Minutes, Not Hours</span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
          >
            AI-powered platform to analyze papers, generate ideas, detect research gaps, and plan experiments.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 w-full">
                Try Demo <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 sm:py-12 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-6">
            Trusted by researchers at
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 opacity-40">
            {["Nature", "IEEE", "arXiv", "Springer", "ACM"].map((name) => (
              <span key={name} className="font-mono text-sm text-muted-foreground font-medium">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
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

      {/* How it Works */}
      <section className="py-16 sm:py-24 bg-secondary/30 border-y border-border/30">
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

      {/* Why PaperLens AI */}
      <section className="py-16 sm:py-24 bg-secondary/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3">Why PaperLens AI?</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
              Designed for real research decisions: configurable, auditable, and built to reduce manual verification overhead.
            </p>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            <motion.div
              className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] rounded-3xl overflow-hidden border border-border/40"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease }}
            >
              <div className="bg-card p-6 sm:p-8 lg:p-10">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-foreground">{whyPanels[0].title}</h3>
                <div className="h-px w-full bg-border/70 mb-6" />
                <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[0].description}</p>
                <div className="space-y-2.5">
                  {whyPanels[0].points.map((point) => (
                    <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/50 p-4 sm:p-6 lg:p-8">
                <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border/50">
                    <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-border/50">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Paper</p>
                      <h4 className="font-medium text-foreground leading-relaxed mb-3">
                        Foundation model adaptation for robust research-paper understanding across domains.
                      </h4>
                      <p className="text-xs text-muted-foreground">A. Roy, P. Banerjee, L. Kumar — 2025</p>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Screening recommendation</p>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-sm font-semibold mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Include · 4.8/5
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                        Strong alignment with paper-structure parsing and domain transfer. Contains clear methodology and reproducible benchmarks.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {recommendationCriteria.map((item) => {
                          const isActive = activeCriteriaKey === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onMouseEnter={() => setActiveCriteriaKey(item.key)}
                              onFocus={() => setActiveCriteriaKey(item.key)}
                              onClick={() => setActiveCriteriaKey(item.key)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                isActive
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary"
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Criteria detail</p>
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                          {recommendationCriteria.find((item) => item.key === activeCriteriaKey)?.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.45fr] rounded-3xl overflow-hidden border border-border/40"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08, ease }}
            >
              <div className="bg-card p-6 sm:p-8 lg:p-10 xl:order-1">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-foreground">{whyPanels[1].title}</h3>
                <div className="h-px w-full bg-border/70 mb-6" />
                <p className="text-base sm:text-lg text-foreground/90 leading-relaxed mb-6">{whyPanels[1].description}</p>
                <div className="space-y-2.5">
                  {whyPanels[1].points.map((point) => (
                    <div key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/50 p-4 sm:p-6 lg:p-8 xl:order-2">
                <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">Supporting evidence panel</p>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">Linked quotes</span>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(evidenceDetails) as Array<keyof typeof evidenceDetails>).map((tag) => {
                          const isActive = activeEvidenceTag === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onMouseEnter={() => {
                                setActiveEvidenceTag(tag);
                                setShowEvidenceQuote(true);
                              }}
                              onMouseLeave={() => setShowEvidenceQuote(false)}
                              onFocus={() => {
                                setActiveEvidenceTag(tag);
                                setShowEvidenceQuote(true);
                              }}
                              onBlur={() => setShowEvidenceQuote(false)}
                              onClick={() => {
                                setActiveEvidenceTag(tag);
                                setShowEvidenceQuote((prev) => !prev);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                isActive
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : "border-border/50 bg-secondary/50 text-foreground/80 hover:bg-secondary"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>

                      {showEvidenceQuote && (
                        <div className="mt-3 rounded-xl border border-border/50 bg-card shadow-lg p-3 sm:p-4">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                            Supporting note on {activeEvidenceTag}
                          </p>
                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-2">
                            {evidenceDetails[activeEvidenceTag]}
                          </p>
                          <p className="text-xs italic text-muted-foreground leading-relaxed">
                            “{evidenceQuoteMap[activeEvidenceTag]}”
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Quote className="w-4 h-4 text-accent" />
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Cited rationale</p>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        “We report significant gains under controlled protocol settings, with explicit methodological constraints and reproducibility artifacts.”
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="pt-2 flex justify-center">
              <Link to="/signup">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Start with PaperLens AI <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
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

      {/* CTA */}
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
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full sm:w-auto">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="PaperLens Logo" className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-foreground">PaperLens AI</h2>
              </div>
              <button 
                onClick={() => setShowAbout(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-muted-foreground">
              <p>
                PaperLens AI is an intelligent research assistant designed to help students, engineers, and researchers accelerate their academic work.
              </p>
              <p>
                Our platform leverages advanced AI to analyze research papers, generate innovative ideas, detect research gaps, and plan experiments with precision.
              </p>
              <p>
                Whether you're a PhD candidate wrestling with literature reviews, a researcher exploring new directions, or an engineer studying state-of-the-art techniques, PaperLens AI transforms how you engage with academic content.
              </p>
              <p className="pt-4 font-medium text-foreground">
                Powered by cutting-edge AI to unlock insights from any paper in minutes.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <Button 
                onClick={() => setShowAbout(false)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Logo & Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src="/favicon.svg" alt="PaperLens Logo" className="w-6 h-6" />
                <span className="text-sm font-semibold text-foreground">PaperLens AI</span>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground">AI-powered research assistant for students, engineers, and researchers.</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link to="/dashboard/analyzer" className="hover:text-foreground transition-colors">Paper Analyzer</Link></li>
                <li><Link to="/dashboard/planner" className="hover:text-foreground transition-colors">Experiment Planner</Link></li>
                <li><Link to="/dashboard/generator" className="hover:text-foreground transition-colors">Problem Generator</Link></li>
                <li><Link to="/dashboard/gaps" className="hover:text-foreground transition-colors">Gap Detection</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><button onClick={() => setShowAbout(true)} className="text-muted-foreground hover:text-foreground transition-colors">About</button></li>
                <li><a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a></li>
                <li><a href="mailto:pramanikarpan089@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Contact
                </a></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Connect</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Email: <a href="mailto:pramanikarpan089@gmail.com" className="hover:text-foreground transition-colors">pramanikarpan089@gmail.com</a></p>
              <div className="flex gap-2 sm:gap-3">
                <a href="https://arpanpramanik.dev" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold" title="Portfolio">
                  PF
                </a>
                <a href="https://www.linkedin.com/in/arpanpramanik2003/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 PaperLens AI. All rights reserved.</p>
            <p>Built with ❤️ by <a href="https://github.com/arpanpramanik2003" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Arpan Pramanik</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
