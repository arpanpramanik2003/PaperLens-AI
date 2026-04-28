import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Star, ArrowRight, Sparkles, X, ChevronDown, BookmarkPlus, Compass, FileText, Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";
import { scrollToResult } from "@/lib/scroll-to-result";
import { showSaveErrorToast, showSaveSignInToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

type BriefStep = {
  step?: number;
  title?: string;
  details?: string;
};

type ProblemBrief = {
  title: string;
  problem_statement: string;
  objective: string;
  step_by_step: BriefStep[];
  datasets: string[];
  evaluation_metrics: string[];
  expected_outcomes: string[];
};

type IdeaCard = {
  title: string;
  desc: string;
  tags: string[];
  rating: number;
};

const toArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const safeFileName = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return normalized || "research-brief";
};

const workflowGuide = [
  {
    title: "Define Domain",
    detail: "Set problem space and practical constraints.",
    icon: Compass,
  },
  {
    title: "Generate Candidates",
    detail: "Get ranked research ideas with complexity control.",
    icon: Sparkles,
  },
  {
    title: "Expand to Brief",
    detail: "Convert one idea into a complete execution roadmap.",
    icon: FileText,
  },
  {
    title: "Export & Execute",
    detail: "Save and export the brief to run experiments faster.",
    icon: Download,
  },
];

export default function ProblemGenerator() {
  const { getToken, userId } = useAuth();
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [complexity, setComplexity] = useState("medium");
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [ideaDetails, setIdeaDetails] = useState<Record<number, ProblemBrief>>({});
  const [expandedIdeaIndex, setExpandedIdeaIndex] = useState<number | null>(null);
  const [expandingIdeaIndex, setExpandingIdeaIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const selectedIdea = expandedIdeaIndex !== null ? ideas[expandedIdeaIndex] : null;
  const selectedIdeaDetails = expandedIdeaIndex !== null ? ideaDetails[expandedIdeaIndex] : null;

  // Scroll to the generated ideas section after results appear.
  const scrollToResults = () => {
    setTimeout(() => {
      const el = document.getElementById("generated-ideas");
      if (el) scrollToResult(el, { retries: 3, retryDelay: 250 });
    }, 250);
  };

  useEffect(() => {
    if (!exportMenuOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [exportMenuOpen]);

  const buildBrief = (): ProblemBrief | null => {
    if (!selectedIdea || !selectedIdeaDetails) return null;

    const rawSteps = Array.isArray(selectedIdeaDetails.step_by_step)
      ? (selectedIdeaDetails.step_by_step as BriefStep[])
      : [];

    const steps = rawSteps.map((step, idx) => ({
      step: typeof step?.step === "number" ? step.step : idx + 1,
      title: (step?.title || `Step ${idx + 1}`).toString(),
      details: (step?.details || "Details not provided.").toString(),
    }));

    return {
      title: (selectedIdeaDetails.title || selectedIdea.title || "Research Brief").toString(),
      problem_statement: (selectedIdeaDetails.problem_statement || selectedIdea.desc || "Not provided").toString(),
      objective: (selectedIdeaDetails.objective || "Not provided").toString(),
      step_by_step: steps,
      datasets: toArray(selectedIdeaDetails.datasets),
      evaluation_metrics: toArray(selectedIdeaDetails.evaluation_metrics),
      expected_outcomes: toArray(selectedIdeaDetails.expected_outcomes),
    };
  };

  const handleDownloadWord = async () => {
    const brief = buildBrief();
    if (!brief) return;

    const children: Paragraph[] = [
      new Paragraph({ text: brief.title, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: "Problem Statement", heading: HeadingLevel.HEADING_2 }),
      new Paragraph(brief.problem_statement),
      new Paragraph({ text: "Primary Objective", heading: HeadingLevel.HEADING_2 }),
      new Paragraph(brief.objective),
      new Paragraph({ text: "Execution Roadmap", heading: HeadingLevel.HEADING_2 }),
    ];

    brief.step_by_step.forEach((step) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${step.step}. ${step.title}`, bold: true })],
        })
      );
      children.push(new Paragraph(step.details || "Details not provided."));
    });

    children.push(new Paragraph({ text: "Datasets & Tools", heading: HeadingLevel.HEADING_2 }));
    (brief.datasets.length ? brief.datasets : ["Not provided"]).forEach((item) => {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    });

    children.push(new Paragraph({ text: "Evaluation Metrics", heading: HeadingLevel.HEADING_2 }));
    (brief.evaluation_metrics.length ? brief.evaluation_metrics : ["Not provided"]).forEach((item) => {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    });

    children.push(new Paragraph({ text: "Expected Outcomes", heading: HeadingLevel.HEADING_2 }));
    (brief.expected_outcomes.length ? brief.expected_outcomes : ["Not provided"]).forEach((item) => {
      children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    });

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${safeFileName(brief.title)}-brief.docx`);
    setExportMenuOpen(false);
  };

  const handleDownloadPdf = () => {
    const brief = buildBrief();
    if (!brief) return;

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const writeHeading = (text: string) => {
      ensureSpace(26);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(text, margin, y);
      y += 20;
    };

    const writeParagraph = (text: string, indent = 0) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(text || "Not provided", maxWidth - indent);
      lines.forEach((line: string) => {
        ensureSpace(16);
        pdf.text(line, margin + indent, y);
        y += 14;
      });
      y += 4;
    };

    writeHeading(brief.title);
    writeHeading("Problem Statement");
    writeParagraph(brief.problem_statement);

    writeHeading("Primary Objective");
    writeParagraph(brief.objective);

    writeHeading("Execution Roadmap");
    brief.step_by_step.forEach((step) => {
      writeParagraph(`${step.step}. ${step.title}`, 0);
      writeParagraph(step.details || "Details not provided.", 14);
    });

    writeHeading("Datasets & Tools");
    (brief.datasets.length ? brief.datasets : ["Not provided"]).forEach((item) => {
      writeParagraph(`- ${item}`);
    });

    writeHeading("Evaluation Metrics");
    (brief.evaluation_metrics.length ? brief.evaluation_metrics : ["Not provided"]).forEach((item) => {
      writeParagraph(`- ${item}`);
    });

    writeHeading("Expected Outcomes");
    (brief.expected_outcomes.length ? brief.expected_outcomes : ["Not provided"]).forEach((item) => {
      writeParagraph(`- ${item}`);
    });

    pdf.save(`${safeFileName(brief.title)}-brief.pdf`);
    setExportMenuOpen(false);
  };

  const handleSaveBrief = async () => {
    if (!selectedIdea || !selectedIdeaDetails) return;
    if (!userId) {
      showSaveSignInToast("Problem brief");
      return;
    }

    try {
      setSaving(true);
      const brief = buildBrief();
      if (!brief) throw new Error("No brief available to save.");

      const res = await apiClient.fetch(
        "/api/saved-items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "problem_generator",
            title: brief.title,
            summary: brief.problem_statement,
            payload: {
              domain,
              subdomain,
              complexity,
              idea: selectedIdea,
              brief,
            },
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to save brief.");
      showSaveSuccessToast("Problem brief");
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Problem brief");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!domain.trim()) return;

    setGenerated(false);
    setIdeas([]);
    setIdeaDetails({});
    setExpandedIdeaIndex(null);

    if (!userId) {
      setLoading(true);
      setTimeout(() => {
        setIdeas([
          { title: "Demo: Cross-Domain Sentiment Transfer", desc: "Develop a model that transfers sentiment capabilites using few-shot adaptation.", tags: ["NLP", "Transfer"], rating: 4 },
          { title: "Demo: Multimodal Paper Understanding", desc: "Build a system that processes text, figures, and tables for deep summaries.", tags: ["Vision", "NLP"], rating: 5 },
          { title: "Demo: Literature Gap Detection", desc: "Use topological graph analysis to spot unexplored zones in citation networks.", tags: ["Graph ML", "Automation"], rating: 4 },
        ]);
        setLoading(false);
        setGenerated(true);
        scrollToResults();
      }, 1500);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await apiClient.fetch("/api/generate-problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain, subdomain, complexity })
      }, getToken);

      if (!res.ok) throw new Error("Failed to generate ideas");
      const data = await res.json();
      const parsedIdeas: IdeaCard[] = Array.isArray(data.ideas)
        ? data.ideas
            .filter((idea: unknown): idea is Record<string, unknown> => Boolean(idea) && typeof idea === "object")
            .map((idea) => ({
              title: String(idea.title || "Untitled idea"),
              desc: String(idea.desc || "Description not provided."),
              tags: Array.isArray(idea.tags)
                ? idea.tags.map((tag) => String(tag)).filter((tag) => tag.trim().length > 0)
                : [],
              rating: Math.max(1, Math.min(5, Number(idea.rating) || 3)),
            }))
        : [];

      setIdeas(parsedIdeas);
      setGenerated(true);
      scrollToResults();
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Research problem ideas");
    } finally {
      setLoading(false);
    }
  };

  const buildDemoDetails = (idea: IdeaCard): ProblemBrief => ({
    title: idea.title,
    problem_statement: idea.desc,
    objective: "Build and validate a reproducible solution pipeline for this exact problem statement.",
    step_by_step: [
      { step: 1, title: "Scope the exact research gap", details: "Define baseline limitations and specify what improvement is expected." },
      { step: 2, title: "Prepare dataset and inputs", details: "Select benchmark datasets and create train/validation/test splits." },
      { step: 3, title: "Design model pipeline", details: "Implement a baseline and a proposed improved architecture." },
      { step: 4, title: "Train and tune", details: "Run controlled experiments with tracked hyperparameters and ablations." },
      { step: 5, title: "Evaluate with metrics", details: "Compare against baselines using domain-appropriate metrics." },
      { step: 6, title: "Document outcomes", details: "Summarize gains, failures, and next iteration targets." }
    ],
    datasets: ["Domain benchmark dataset", "Validation split"],
    evaluation_metrics: ["Primary task metric", "Inference efficiency"],
    expected_outcomes: ["Validated improvement over baseline", "Clear roadmap for next iteration"]
  });

  const handleUseIdea = async (idea: IdeaCard, index: number) => {
    if (expandedIdeaIndex === index) {
      setExpandedIdeaIndex(null);
      setExportMenuOpen(false);
      return;
    }

    if (ideaDetails[index]) {
      setExpandedIdeaIndex(index);
      return;
    }

    if (!domain.trim()) return;

    if (!userId) {
      const demoDetails = buildDemoDetails(idea);
      setIdeaDetails((prev) => ({ ...prev, [index]: demoDetails }));
      setExpandedIdeaIndex(index);
      setExportMenuOpen(false);
      return;
    }

    try {
      setExpandingIdeaIndex(index);
      const res = await apiClient.fetch("/api/expand-problem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          domain,
          subdomain,
          complexity,
          idea
        })
      }, getToken);

      if (!res.ok) throw new Error("Failed to expand problem details");

      const data = await res.json();
      const parsed: ProblemBrief = {
        title: String(data.title || idea.title),
        problem_statement: String(data.problem_statement || idea.desc || "Not provided"),
        objective: String(data.objective || "Not provided"),
        step_by_step: Array.isArray(data.step_by_step)
          ? data.step_by_step
              .filter((step: unknown): step is Record<string, unknown> => Boolean(step) && typeof step === "object")
              .map((step, stepIndex) => ({
                step: Number(step.step) || stepIndex + 1,
                title: String(step.title || `Step ${stepIndex + 1}`),
                details: String(step.details || "Details not provided."),
              }))
          : [],
        datasets: toArray(data.datasets),
        evaluation_metrics: toArray(data.evaluation_metrics),
        expected_outcomes: toArray(data.expected_outcomes),
      };

      setIdeaDetails((prev) => ({ ...prev, [index]: parsed }));
      setExpandedIdeaIndex(index);
      setExportMenuOpen(false);
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Detailed brief");
    } finally {
      setExpandingIdeaIndex(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(140deg,hsl(var(--card))_0%,hsl(var(--card)/0.9)_62%,hsl(var(--accent)/0.08)_100%)] px-6 py-6 sm:px-8 sm:py-7"
      >
        <div className="pointer-events-none absolute -top-20 left-6 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Idea Engine</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight">Problem Statement Generator</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Discover high-potential research problems and expand any candidate into a structured execution brief.
            </p>
          </div>

          <span className="inline-flex min-w-[8.5rem] items-center justify-center text-center whitespace-nowrap text-xs font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1.5 rounded-full border border-border/60 bg-background/40">
            {generated ? "Ideas Ready" : loading ? "Ideating" : "Awaiting Input"}
          </span>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          className="lg:col-span-8 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Domain</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., Natural Language Processing"
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subdomain</label>
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g., Sentiment Analysis"
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Complexity</label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ShinyButton onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto rounded-xl">
            <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Ideating..." : "Generate Ideas"}
          </ShinyButton>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="lg:col-span-4 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide">Workflow Example</h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">4 Stages</span>
          </div>

          <div className="space-y-2.5">
            {workflowGuide.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: 0.2 + index * 0.07, ease }}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-3.5"
              >
                <div className="w-9 h-9 rounded-xl border border-border/60 bg-card flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-accent" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{index + 1}. {item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </section>

      {generated && (
          <section id="generated-ideas" className="space-y-4" style={{ scrollMarginTop: "5rem" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">Generated Idea Cards</h2>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{ideas.length} Candidates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ideas.map((idea, i) => (
                <motion.div
                  key={idea.title + i}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-5 hover:border-accent/35 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-32px_hsl(var(--accent))] flex flex-col h-full"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/10 via-transparent to-accent/5" />

                  <div className="relative z-10 flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-3.5 h-3.5 ${j < idea.rating ? "fill-accent text-accent" : "text-border"}`} />
                    ))}
                  </div>

                  <h3 className="relative z-10 text-sm font-semibold text-foreground mb-2 leading-snug">{idea.title}</h3>
                  <p className="relative z-10 text-xs text-muted-foreground leading-relaxed text-justify mb-3">{idea.desc}</p>

                  <div className="relative z-10 flex flex-wrap gap-1.5 mb-4">
                    {(idea.tags || []).map((tag: string) => (
                      <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">{tag}</span>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="relative z-10 w-full gap-1.5 text-xs border-border/60 bg-secondary/40 text-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-colors rounded-xl mt-auto"
                    onClick={() => handleUseIdea(idea, i)}
                    disabled={expandingIdeaIndex === i}
                  >
                    {expandingIdeaIndex === i ? "Loading details..." : expandedIdeaIndex === i ? "Hide details" : "Use this idea"}
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      <AnimatePresence>
        {selectedIdea && selectedIdeaDetails && (
          <motion.div
            className="fixed inset-0 lg:left-[var(--dashboard-sidebar-offset,0px)] z-50 bg-black/50 backdrop-blur-sm p-2 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedIdeaIndex(null)}
          >
            <motion.div
              className="w-full max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/95 shadow-2xl premium-shadow"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.25, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-card via-card to-accent/5 px-4 sm:px-8 py-4 sm:py-5 border-b border-border/30 flex items-start justify-between gap-3 sm:gap-4 backdrop-blur-sm">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
                    {selectedIdeaDetails.title || selectedIdea.title}
                  </h2>
                  <p className="text-xs text-accent mt-1.5 font-medium uppercase tracking-wide">Detailed Execution Brief</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setExpandedIdeaIndex(null)} 
                  className="h-9 w-9 flex-shrink-0 hover:bg-secondary/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-8 py-5 sm:py-7 space-y-6 sm:space-y-7">
                {/* Problem Statement Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-accent rounded-full" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-accent">Problem Statement</p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 text-justify pl-2 border-l-2 border-accent/20 py-2">
                    {selectedIdeaDetails.problem_statement || selectedIdea.desc}
                  </p>
                </div>

                {/* Objective Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-accent rounded-full" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-accent">Primary Objective</p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 pl-2 border-l-2 border-accent/20 py-2 font-medium">
                    {selectedIdeaDetails.objective || "Not provided"}
                  </p>
                </div>

                {/* Step-by-Step Plan Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-6 bg-accent rounded-full" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-accent">Execution Roadmap</p>
                  </div>
                  
                  <div className="space-y-2.5 pl-2">
                    {(selectedIdeaDetails.step_by_step || []).map((step: BriefStep, stepIndex: number) => {
                      const isLast = stepIndex === (selectedIdeaDetails.step_by_step || []).length - 1;
                      return (
                        <div key={`${step.title || "step"}-${stepIndex}`} className="relative">
                          {/* Connector line */}
                          {!isLast && (
                            <div className="absolute left-6 top-12 h-4 w-0.5 bg-gradient-to-b from-accent/40 to-accent/10" />
                          )}
                          
                          {/* Step card */}
                          <div className="rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary/60 hover:border-accent/40 transition-all p-3.5 pl-12">
                            {/* Step number circle */}
                            <div className="absolute left-2.5 top-3.5 w-7 h-7 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-accent">
                                {step.step || stepIndex + 1}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold text-sm text-foreground mb-1">
                              {step.title || `Step ${step.step || stepIndex + 1}`}
                            </h4>
                            <p className="text-xs leading-relaxed text-foreground/80">
                              {step.details || "Details not provided."}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resources Grid Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Datasets */}
                  <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-4 bg-accent rounded" />
                      <p className="text-xs uppercase tracking-widest font-semibold text-accent">Datasets & Tools</p>
                    </div>
                    <ul className="space-y-1.5">
                      {(selectedIdeaDetails.datasets || []).map((item: string, idx: number) => (
                        <li key={`${item}-${idx}`} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Metrics */}
                  <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-4 bg-accent rounded" />
                      <p className="text-xs uppercase tracking-widest font-semibold text-accent">Evaluation Metrics</p>
                    </div>
                    <ul className="space-y-1.5">
                      {(selectedIdeaDetails.evaluation_metrics || []).map((item: string, idx: number) => (
                        <li key={`${item}-${idx}`} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Outcomes */}
                  <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-4 bg-accent rounded" />
                      <p className="text-xs uppercase tracking-widest font-semibold text-accent">Expected Outcomes</p>
                    </div>
                    <ul className="space-y-1.5">
                      {(selectedIdeaDetails.expected_outcomes || []).map((item: string, idx: number) => (
                        <li key={`${item}-${idx}`} className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-border/20 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="gap-2 w-full sm:flex-1"
                    onClick={handleSaveBrief}
                    disabled={saving}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>

                  <Button 
                    variant="outline"
                    className="gap-2 w-full sm:flex-1"
                    onClick={() => {
                      setExportMenuOpen(false);
                      setExpandedIdeaIndex(null);
                    }}
                  >
                    Close
                  </Button>

                  <div className="w-full sm:flex-1 relative" ref={exportMenuRef}>
                    <ShinyButton
                      className="w-full rounded-xl flex items-center justify-center gap-2"
                      onClick={() => setExportMenuOpen((prev) => !prev)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Export Brief
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} />
                    </ShinyButton>

                    <AnimatePresence>
                      {exportMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
                          className="absolute bottom-full right-0 mb-2 w-full sm:w-[220px] rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-2 flex flex-col gap-1.5 shadow-2xl z-50 premium-shadow"
                          style={{ transformOrigin: "bottom center" }}
                        >
                          <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Select Format</p>
                          <Button
                            variant="secondary"
                            className="w-full justify-start text-xs h-9 bg-background/50 hover:bg-accent/10 hover:text-accent border border-border/40"
                            onClick={handleDownloadWord}
                          >
                            Download Word (.docx)
                          </Button>
                          <Button
                            variant="secondary"
                            className="w-full justify-start text-xs h-9 bg-background/50 hover:bg-accent/10 hover:text-accent border border-border/40"
                            onClick={handleDownloadPdf}
                          >
                            Download PDF (.pdf)
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <div className="text-center py-12 sm:py-16">
          <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Fill in your research domain and generate ideas.</p>
        </div>
      )}
    </div>
  );
}
