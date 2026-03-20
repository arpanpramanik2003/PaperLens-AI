import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Trophy, Wrench, Sparkles, ArrowRight, X, Info } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

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

export default function DatasetBenchmarkFinder() {
  const { userId, getToken } = useAuth();

  const [projectTitle, setProjectTitle] = useState("");
  const [projectPlan, setProjectPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [domainSummary, setDomainSummary] = useState("");
  const [datasets, setDatasets] = useState<FinderItem[]>([]);
  const [benchmarks, setBenchmarks] = useState<FinderItem[]>([]);
  const [technologies, setTechnologies] = useState<FinderItem[]>([]);

  const [activeType, setActiveType] = useState<"dataset" | "benchmark" | null>(null);
  const [activeItem, setActiveItem] = useState<FinderItem | null>(null);

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
    } catch (error) {
      console.error(error);
      alert("Failed to load dataset and benchmark recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Dataset & Benchmark Finder</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Paste a project title or full project plan to discover suitable datasets, benchmarks, and common technology stack.
        </p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-6 mb-8"
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
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Project Plan (Optional)</label>
            <Textarea
              value={projectPlan}
              onChange={(e) => setProjectPlan(e.target.value)}
              placeholder="Paste your full project plan, methodology, objectives, and expected outcomes..."
              className="bg-secondary/50 border-border/50 min-h-[130px]"
            />
          </div>

          <Button onClick={handleFind} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Finding recommendations..." : "Find Datasets & Benchmarks"}
          </Button>
        </div>
      </motion.div>

      {generated && (
        <div className="space-y-8">
          {domainSummary && (
            <motion.div
              className="rounded-xl border border-border/50 bg-secondary/30 p-4 sm:p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1.5">Domain Understanding</p>
              <p className="text-sm text-foreground/90 leading-relaxed">{domainSummary}</p>
            </motion.div>
          )}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-accent" />
              <h2 className="text-base sm:text-lg font-semibold">Recommended Datasets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {datasets.map((dataset, idx) => (
                <motion.div
                  key={`${dataset.name}-${idx}`}
                  className="rounded-xl border border-border/50 bg-card p-4 hover:border-accent/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{dataset.name}</h3>
                    {typeof dataset.fit_score === "number" && (
                      <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {dataset.fit_score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{dataset.short_description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(dataset.best_for || []).slice(0, 3).map((item) => (
                      <span key={item} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{item}</span>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openDetails("dataset", dataset)}>
                    View details <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-accent" />
              <h2 className="text-base sm:text-lg font-semibold">Relevant Benchmarks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {benchmarks.map((benchmark, idx) => (
                <motion.div
                  key={`${benchmark.name}-${idx}`}
                  className="rounded-xl border border-border/50 bg-card p-4 hover:border-accent/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06, ease }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{benchmark.name}</h3>
                    {typeof benchmark.fit_score === "number" && (
                      <span className="text-[11px] px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {benchmark.fit_score.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{benchmark.short_description}</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openDetails("benchmark", benchmark)}>
                    View benchmark details <ArrowRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-accent" />
              <h2 className="text-base sm:text-lg font-semibold">Most Used Technologies in this Domain</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {technologies.map((tech, idx) => (
                <motion.div
                  key={`${tech.name}-${idx}`}
                  className="rounded-xl border border-border/50 bg-card p-4"
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
        <div className="text-center py-16">
          <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Enter your project information to discover datasets and benchmarks.</p>
        </div>
      )}

      <AnimatePresence>
        {activeItem && activeType && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl"
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
