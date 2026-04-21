import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { FlaskConical, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";
import { showSaveErrorToast, showSaveSignInToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

const plannerGuide = [
  {
    title: "Define Scope",
    detail: "Clarify hypothesis, constraints, and expected outcome.",
    icon: Icons.Target,
  },
  {
    title: "Design Pipeline",
    detail: "Select data, model stack, and evaluation strategy.",
    icon: Icons.Workflow,
  },
  {
    title: "Mitigate Risk",
    detail: "Identify failure modes and add validation checkpoints.",
    icon: Icons.ShieldAlert,
  },
  {
    title: "Execute",
    detail: "Run staged experiments and compare ablation outcomes.",
    icon: Icons.Rocket,
  },
];

type PlanStep = {
  num: number;
  title: string;
  iconName: string;
  details: string;
  params: string;
  risks: string;
};

type StructuredDetailSections = {
  objective: string;
  execution: string;
  validation: string;
  deliverable: string;
};

const STEP_ICON_MAP = {
  Database: Icons.Database,
  Cog: Icons.Cog,
  Cpu: Icons.Cpu,
  Play: Icons.Play,
  BarChart3: Icons.BarChart3,
  FlaskConical: Icons.FlaskConical,
  List: Icons.List,
  Eye: Icons.Eye,
  Cloud: Icons.Cloud,
  PenTool: Icons.PenTool,
  Shield: Icons.Shield,
  CheckCircle: Icons.CheckCircle,
  Activity: Icons.Activity,
  Globe: Icons.Globe,
  Zap: Icons.Zap,
} as const;

const fallbackRiskByTitle = (title: string) => {
  const t = (title || "").toLowerCase();
  if (t.includes("dataset") || t.includes("curation")) return "Data leakage, annotation inconsistency, or class imbalance may reduce generalization.";
  if (t.includes("preprocess") || t.includes("feature")) return "Preprocessing artifacts or feature distortion can silently degrade model quality.";
  if (t.includes("model") || t.includes("architecture")) return "Model-design mismatch may overfit small patterns and underperform on out-of-distribution data.";
  if (t.includes("train") || t.includes("optimization")) return "Instability in optimization or poor hyperparameter ranges may prevent convergence.";
  if (t.includes("evaluation") || t.includes("ablation")) return "Weak baselines or metric mismatch can lead to misleading conclusions.";
  if (t.includes("deploy") || t.includes("monitor")) return "Runtime drift and infrastructure constraints can break production reliability.";
  return "Integration and reproducibility issues may appear if assumptions are not validated at this stage.";
};

const sanitizePlanSteps = (rawSteps: unknown[]): PlanStep[] => {
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps
    .filter((step): step is Record<string, unknown> => Boolean(step) && typeof step === "object")
    .map((step, index) => {
      const title = (step.title || "").toString().trim() || `Stage ${index + 1}`;
      const details = (step.details || "").toString().trim();
      const params = (step.params || "").toString().trim();
      const risks = (step.risks || "").toString().trim();

      return {
        num: Number(step.num) > 0 ? Number(step.num) : index + 1,
        title,
        iconName: (step.iconName || "Cog").toString().trim() || "Cog",
        details: details.length >= 20 ? details : `Define and execute ${title.toLowerCase()} with concrete validation checkpoints and measurable outcomes.`,
        params: params.length >= 10 ? params : "Specify measurable metrics, key hyperparameters, and acceptance thresholds.",
        risks: risks.length >= 10 ? risks : fallbackRiskByTitle(title),
      };
    });
};

const parseStructuredDetails = (details: string): StructuredDetailSections | null => {
  const text = (details || "").trim();
  if (!text) return null;

  const patterns = {
    objective: /objective\s*:\s*([\s\S]*?)(?=\bexecution\s*:|\bvalidation\s*:|\bdeliverable\s*:|$)/i,
    execution: /execution\s*:\s*([\s\S]*?)(?=\bobjective\s*:|\bvalidation\s*:|\bdeliverable\s*:|$)/i,
    validation: /validation\s*:\s*([\s\S]*?)(?=\bobjective\s*:|\bexecution\s*:|\bdeliverable\s*:|$)/i,
    deliverable: /deliverable\s*:\s*([\s\S]*?)(?=\bobjective\s*:|\bexecution\s*:|\bvalidation\s*:|$)/i,
  };

  const objective = (text.match(patterns.objective)?.[1] || "").trim();
  const execution = (text.match(patterns.execution)?.[1] || "").trim();
  const validation = (text.match(patterns.validation)?.[1] || "").trim();
  const deliverable = (text.match(patterns.deliverable)?.[1] || "").trim();

  if (!objective && !execution && !validation && !deliverable) {
    return null;
  }

  return {
    objective,
    execution,
    validation,
    deliverable,
  };
};

export default function ExperimentPlanner() {
  const { getToken, userId } = useAuth();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSavePlan = async () => {
    if (!generated || steps.length === 0) return;
    if (!userId) {
      showSaveSignInToast("Experiment plan");
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
            section: "experiment_planner",
            title: topic.trim() || "Experiment Plan",
            summary: `Difficulty: ${difficulty} • ${steps.length} steps`,
            payload: {
              topic,
              difficulty,
              steps,
            },
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to save experiment plan.");
      showSaveSuccessToast("Experiment plan");
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Experiment plan");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setGenerated(false);
    setVisibleSteps(0);
    setExpandedStep(0);
    setSteps([]);
    
    if (!userId) {
      setLoading(true);
      setTimeout(() => {
        setSteps([
          { num: 1, title: "Dataset Selection", iconName: "Database", details: "Demo Data: Use the GLUE benchmark dataset.", params: "Size: ~393K", risks: "Class imbalance" },
          { num: 2, title: "Preprocessing Pipeline", iconName: "Cog", details: "Demo Data: Tokenize with BPE.", params: "Max length: 512", risks: "Data loss" },
          { num: 3, title: "Model Architecture", iconName: "Cpu", details: "Demo Data: Fine-tune BERT.", params: "Params: 110M", risks: "Overfitting" },
          { num: 4, title: "Training Configuration", iconName: "Play", details: "Demo Data: AdamW optimizer.", params: "LR: 2e-5", risks: "Sensitivity" },
          { num: 5, title: "Explainable AI (XAI)", iconName: "Eye", details: "Demo Data: Apply Grad-CAM and SHAP to interpret weights.", params: "Method: SHAP", risks: "Compute overhead" },
          { num: 6, title: "Deployment & Scaling", iconName: "Cloud", details: "Demo Data: Quantize model to INT8 and deploy to AWS Lambda.", params: "Platform: AWS", risks: "Latency jitter" },
        ]);
        setLoading(false);
        setGenerated(true);
        [0,1,2,3,4,5].forEach((i) => {
          setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 300);
        });
      }, 1500);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await apiClient.fetch("/api/plan-experiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic, difficulty })
      }, getToken);
      
      if (!res.ok) throw new Error("Failed to generate plan");
      const data = await res.json();

      const normalizedSteps = sanitizePlanSteps(data.steps || []);
      setSteps(normalizedSteps);
      setGenerated(true);

      normalizedSteps.forEach((_: PlanStep, i: number) => {
        setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 300);
      });
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Experiment planning results");
    } finally {
      setLoading(false);
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
              <Icons.Compass className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Research Workflow</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight">Experiment Planner</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Generate a stage-wise execution roadmap with parameters, risks, and practical implementation checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex min-w-[7.5rem] items-center justify-center text-center whitespace-nowrap text-xs font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1.5 rounded-full border border-border/60 bg-background/40">
              {generated ? "Plan Ready" : loading ? "Planning" : "Awaiting Input"}
            </span>
            {generated && (
              <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={handleSavePlan} disabled={saving}>
                <BookmarkPlus className="w-4 h-4" />
                {saving ? "Saving..." : "Save Plan"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Research Topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Fine-tuning BERT for sentiment analysis"
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty Level</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2 rounded-xl">
                <FlaskConical className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Planning..." : "Generate Plan"}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="lg:col-span-4 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide">Guide Menu</h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">4 Stages</span>
          </div>

          <div className="space-y-2.5">
            {plannerGuide.map((item, index) => (
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

      {/* Steps */}
      <AnimatePresence>
        {generated && (
          <section className="rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-sm font-semibold tracking-wide text-foreground">Execution Timeline</h3>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{steps.length} Steps</span>
            </div>

            <div className="space-y-0">
              {steps.slice(0, visibleSteps).map((step, i) => {
                const IconComponent = STEP_ICON_MAP[step.iconName as keyof typeof STEP_ICON_MAP] ?? STEP_ICON_MAP.Cog;
                const structuredDetails = parseStructuredDetails(step.details);
                return (
                  <motion.div
                    key={step.num || i}
                    className="relative pl-11"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease }}
                  >
                    {i < steps.length - 1 && (
                      <div className="absolute left-[17px] top-10 w-[2px] h-[calc(100%-8px)] bg-border" />
                    )}

                    <div className="absolute left-0 top-0 w-[36px] h-[36px] rounded-full border-2 border-border/70 bg-card flex items-center justify-center z-10">
                      <span className="text-xs font-mono font-medium text-foreground tabular-nums">{step.num}</span>
                    </div>

                    <div
                      className={`mb-6 rounded-2xl border bg-card transition-all duration-200 premium-shadow ${
                        expandedStep === i ? "border-accent/30" : "border-border/50"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        className="w-full flex items-center gap-3 p-4 text-left"
                      >
                        <div className="w-8 h-8 rounded-lg border border-border/60 bg-background/50 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-accent" strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-semibold text-foreground flex-1">{step.title}</span>
                        {expandedStep === i ? (
                          <Icons.ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Icons.ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedStep === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {structuredDetails ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  <div className="rounded-lg border border-border/50 bg-secondary/35 px-3 py-2.5">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Objective</p>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{structuredDetails.objective || "Not specified."}</p>
                                  </div>
                                  <div className="rounded-lg border border-border/50 bg-secondary/35 px-3 py-2.5">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Execution</p>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{structuredDetails.execution || "Not specified."}</p>
                                  </div>
                                  <div className="rounded-lg border border-border/50 bg-secondary/35 px-3 py-2.5">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Validation</p>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{structuredDetails.validation || "Not specified."}</p>
                                  </div>
                                  <div className="rounded-lg border border-border/50 bg-secondary/35 px-3 py-2.5">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Deliverable</p>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{structuredDetails.deliverable || "Not specified."}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground leading-relaxed text-justify sm:text-left">{step.details}</p>
                              )}

                              <div className="rounded-lg bg-secondary/50 px-3 py-2 border border-border/50">
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Parameters</p>
                                <p className="text-xs font-mono text-muted-foreground break-words">{step.params}</p>
                              </div>

                              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="text-destructive font-medium">Risk:</span>
                                <span className="leading-relaxed">{step.risks || fallbackRiskByTitle(step.title)}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </AnimatePresence>

      {!generated && (
        <div className="text-center py-12 sm:py-16">
          <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Enter a topic and generate your experiment plan.</p>
        </div>
      )}
    </div>
  );
}
