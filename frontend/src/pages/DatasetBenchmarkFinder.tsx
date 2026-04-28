import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Trophy, Wrench, Sparkles, ArrowRight, X, Info, BookmarkPlus, Compass, SearchCheck, ListChecks, BadgeCheck } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { scrollToResult } from "@/lib/scroll-to-result";
import { showSaveErrorToast, showSaveSignInToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

type FinderItem = {
  name: string;
  fit_score?: number;
  short_description?: string;
  best_for?: string[];
  category?: string;
  reason?: string;
  used_for?: string[];
  details?: Record<string, any>;
};

const workflowGuide = [
  {
    title: "Describe Project",
    detail: "Provide title and optional implementation plan.",
    icon: Compass,
  },
  {
    title: "Match Assets",
    detail: "Find high-fit datasets and benchmark suites.",
    icon: SearchCheck,
  },
  {
    title: "Compare Options",
    detail: "Review fit score, use cases, and constraints.",
    icon: ListChecks,
  },
  {
    title: "Finalize Stack",
    detail: "Choose tools and save recommendations.",
    icon: BadgeCheck,
  },
];

export default function DatasetBenchmarkFinder() {
  const { userId, getToken } = useAuth();

  const [projectTitle, setProjectTitle] = useState("");
  const [projectPlan, setProjectPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [domainSummary, setDomainSummary] = useState("");
  const [datasets, setDatasets] = useState<FinderItem[]>([]);
  const [benchmarks, setBenchmarks] = useState<FinderItem[]>([]);
  const [technologies, setTechnologies] = useState<FinderItem[]>([]);

  const [activeType, setActiveType] = useState<"dataset" | "benchmark" | null>(null);
  const [activeItem, setActiveItem] = useState<FinderItem | null>(null);

  const scrollToResults = () => {
    setTimeout(() => {
      const el = document.getElementById("finder-results");
      if (el) scrollToResult(el, { retries: 3, retryDelay: 250 });
    }, 250);
  };

  const openDetails = (type: "dataset" | "benchmark", item: FinderItem) => {
    setActiveType(type);
    setActiveItem(item);
  };

  const closeDetails = () => {
    setActiveType(null);
    setActiveItem(null);
  };

  const mockData = () => ({
    domain_summary: "This project appears to focus on multimodal clinical intelligence for automated diagnosis and robust model evaluation.",
    datasets: [
      {
        name: "MIMIC-CXR",
        fit_score: 4.8,
        short_description: "Large chest X-ray dataset suitable for clinical vision-language tasks.",
        best_for: ["Radiology report grounding", "Disease classification"],
        details: {
          modality: "Image + Text",
          size: "370k+ images",
          license: "Credentialed access",
          tasks: ["Classification", "Report generation"],
          pros: ["Large scale", "Clinical relevance"],
          limitations: ["Access restrictions", "Demographic skew"],
          source_hint: "PhysioNet"
        }
      },
      {
        name: "CheXpert",
        fit_score: 4.6,
        short_description: "Strong benchmark-style chest X-ray dataset with uncertainty labels.",
        best_for: ["Robust supervision", "Label uncertainty modeling"],
        details: {
          modality: "Image",
          size: "220k+ images",
          license: "Research use",
          tasks: ["Multi-label classification"],
          pros: ["Widely cited", "Reliable baseline comparisons"],
          limitations: ["Single modality", "Clinical context limitations"],
          source_hint: "Stanford ML Group"
        }
      }
    ],
    benchmarks: [
      {
        name: "CheXbench",
        fit_score: 4.5,
        short_description: "Evaluation benchmark for chest X-ray reasoning quality.",
        details: {
          primary_metrics: ["AUROC", "F1"],
          evaluation_protocol: "Patient-wise split and external validation",
          baselines: ["DenseNet", "ViT"],
          what_good_looks_like: "Consistent AUROC gains across labels",
          pitfalls: ["Label leakage", "Center-specific bias"]
        }
      },
      {
        name: "MedVQA Eval",
        fit_score: 4.3,
        short_description: "Assesses clinically grounded VQA capabilities in medical imaging.",
        details: {
          primary_metrics: ["Exact Match", "Clinical relevance score"],
          evaluation_protocol: "Blind QA set with clinician review",
          baselines: ["BLIP-2", "LLaVA-Med"],
          what_good_looks_like: "High factuality and low hallucination",
          pitfalls: ["Prompt sensitivity", "Shallow lexical matching"]
        }
      }
    ],
    technologies: [
      { name: "PyTorch", category: "Framework", reason: "Flexible research prototyping", used_for: ["Training", "Ablations"] },
      { name: "Hugging Face Transformers", category: "Library", reason: "Fast model experimentation", used_for: ["Fine-tuning", "Inference"] },
      { name: "Weights & Biases", category: "MLOps", reason: "Track experiments at scale", used_for: ["Logging", "Comparison dashboards"] },
      { name: "FAISS", category: "Tool", reason: "Efficient vector retrieval", used_for: ["Semantic search", "RAG pipelines"] },
      { name: "OpenCV", category: "Library", reason: "Image pipeline utilities", used_for: ["Preprocessing", "Augmentation"] }
    ]
  });

  const handleFind = async () => {
    if (!projectTitle.trim() && !projectPlan.trim()) return;

    setLoading(true);
    setGenerated(false);
    setDomainSummary("");
    setDatasets([]);
    setBenchmarks([]);
    setTechnologies([]);

    if (!userId) {
      setTimeout(() => {
        const data = mockData();
        setDomainSummary(data.domain_summary || "");
        setDatasets(data.datasets || []);
        setBenchmarks(data.benchmarks || []);
        setTechnologies(data.technologies || []);
        setGenerated(true);
        scrollToResults();
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const res = await apiClient.fetch(
        "/api/find-datasets-benchmarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_title: projectTitle,
            project_plan: projectPlan,
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to find datasets and benchmarks");

      const data = await res.json();
      setDomainSummary(data.domain_summary || "");
      setDatasets(data.datasets || []);
      setBenchmarks(data.benchmarks || []);
      setTechnologies(data.technologies || []);
      setGenerated(true);
      scrollToResults();
    } catch (error) {
      console.error(error);
      showSaveErrorToast("Dataset and benchmark recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecommendations = async () => {
    if (!generated) return;
    if (!userId) {
      showSaveSignInToast("Dataset and benchmark recommendations");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.fetch(
        "/api/saved-items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "dataset_benchmark_finder",
            title: projectTitle.trim() || "Dataset and Benchmark Recommendations",
            summary: `${datasets.length} datasets • ${benchmarks.length} benchmarks • ${technologies.length} technologies`,
            payload: {
              projectTitle,
              projectPlan,
              domainSummary,
              datasets,
              benchmarks,
              technologies,
            },
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to save recommendations.");
      showSaveSuccessToast("Dataset and benchmark recommendations");
    } catch (error) {
      console.error(error);
      showSaveErrorToast("Dataset and benchmark recommendations");
    } finally {
      setSaving(false);
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
              <Compass className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Resource Matching</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight">Dataset & Benchmark Finder</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Discover high-fit datasets, benchmark suites, and common technology stacks for your project scope.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex min-w-[8.5rem] items-center justify-center text-center whitespace-nowrap text-xs font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1.5 rounded-full border border-border/60 bg-background/40">
              {generated ? "Ready" : loading ? "Matching" : "Awaiting Input"}
            </span>
            {generated && (
              <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={handleSaveRecommendations} disabled={saving}>
                <BookmarkPlus className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          className="lg:col-span-8 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Project Title</label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g., Multimodal Brain Tumor Classification with Explainable AI"
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Project Plan (Optional)</label>
              <Textarea
                value={projectPlan}
                onChange={(e) => setProjectPlan(e.target.value)}
                placeholder="Paste your full project plan, methodology, objectives, and expected outcomes..."
                className="bg-secondary/50 border-border/50 min-h-[140px] rounded-2xl"
              />
            </div>

            <ShinyButton onClick={handleFind} disabled={loading} className="w-full sm:w-auto rounded-xl">
              <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Finding recommendations..." : "Find Datasets & Benchmarks"}
            </ShinyButton>
          </div>
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
        <div id="finder-results" className="space-y-8" style={{ scrollMarginTop: "5rem" }}>
          {domainSummary && (
            <motion.div
              className="rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5 premium-shadow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1.5">Domain Understanding</p>
              <p className="text-sm text-foreground/90 leading-relaxed text-justify sm:text-left">{domainSummary}</p>
            </motion.div>
          )}

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <h2 className="text-base sm:text-lg font-semibold">Recommended Datasets</h2>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{datasets.length} Items</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {datasets.map((dataset, idx) => (
                <motion.div
                  key={`${dataset.name}-${idx}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-4 hover:border-accent/35 transition-all duration-250 hover:-translate-y-0.5 premium-shadow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/10 via-transparent to-accent/5" />

                  <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{dataset.name}</h3>
                    {typeof dataset.fit_score === "number" && (
                      <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {dataset.fit_score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="relative z-10 text-xs text-muted-foreground leading-relaxed mb-3">{dataset.short_description}</p>
                  <div className="relative z-10 flex flex-wrap gap-1.5 mb-3">
                    {(dataset.best_for || []).slice(0, 3).map((item) => (
                      <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">{item}</span>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="relative z-10 gap-1.5 text-xs rounded-xl" onClick={() => openDetails("dataset", dataset)}>
                    View details <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                <h2 className="text-base sm:text-lg font-semibold">Relevant Benchmarks</h2>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{benchmarks.length} Items</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {benchmarks.map((benchmark, idx) => (
                <motion.div
                  key={`${benchmark.name}-${idx}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-4 hover:border-accent/35 transition-all duration-250 hover:-translate-y-0.5 premium-shadow"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/10 via-transparent to-accent/5" />

                  <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{benchmark.name}</h3>
                    {typeof benchmark.fit_score === "number" && (
                      <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {benchmark.fit_score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="relative z-10 text-xs text-muted-foreground leading-relaxed mb-3">{benchmark.short_description}</p>
                  <Button size="sm" variant="outline" className="relative z-10 gap-1.5 text-xs rounded-xl" onClick={() => openDetails("benchmark", benchmark)}>
                    View benchmark details <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent" />
                <h2 className="text-base sm:text-lg font-semibold">Most Used Technologies in this Domain</h2>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{technologies.length} Items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {technologies.map((tech, idx) => (
                <motion.div
                  key={`${tech.name}-${idx}`}
                  className="rounded-2xl border border-border/60 bg-card/90 p-4 premium-shadow"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04, ease }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{tech.name}</h3>
                    {tech.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tech.category}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{tech.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(tech.used_for || []).map((use) => (
                      <span key={use} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">{use}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      )}

      {!generated && !loading && (
        <div className="text-center py-12 sm:py-16">
          <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Enter your project information to discover datasets and benchmarks.</p>
        </div>
      )}

      <AnimatePresence>
        {activeItem && activeType && (
          <motion.div
            className="fixed inset-y-0 right-0 lg:[left:var(--dashboard-sidebar-offset,0px)] z-50 bg-black/50 backdrop-blur-sm p-4 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl premium-shadow"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.22, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
                    {activeType === "dataset" ? "Dataset Details" : "Benchmark Details"}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground leading-tight">{activeItem.name}</h3>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={closeDetails}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="px-6 py-6 space-y-5">
                {activeItem.short_description && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Summary</p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{activeItem.short_description}</p>
                  </div>
                )}

                {activeItem.fit_score !== undefined && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium">
                    <Info className="w-3.5 h-3.5" /> Fit score: {activeItem.fit_score}/5
                  </div>
                )}

                {activeItem.best_for && activeItem.best_for.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Best For</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeItem.best_for.map((item) => (
                        <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground/80">{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {activeItem.details && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(activeItem.details).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{key.replace(/_/g, " ")}</p>
                        {Array.isArray(value) ? (
                          <ul className="space-y-1">
                            {value.map((entry, idx) => (
                              <li key={`${key}-${idx}`} className="text-xs text-foreground/90">• {String(entry)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-foreground/90 leading-relaxed">{String(value)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
