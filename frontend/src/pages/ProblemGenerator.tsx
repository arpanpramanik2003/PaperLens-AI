import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Star, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";

const ease = [0.2, 0, 0, 1] as const;

export default function ProblemGenerator() {
  const { getToken, userId } = useAuth();
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [complexity, setComplexity] = useState("medium");
  const [ideas, setIdeas] = useState<any[]>([]);
  const [ideaDetails, setIdeaDetails] = useState<Record<number, any>>({});
  const [expandedIdeaIndex, setExpandedIdeaIndex] = useState<number | null>(null);
  const [expandingIdeaIndex, setExpandingIdeaIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const selectedIdea = expandedIdeaIndex !== null ? ideas[expandedIdeaIndex] : null;
  const selectedIdeaDetails = expandedIdeaIndex !== null ? ideaDetails[expandedIdeaIndex] : null;

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
      setIdeas(data.ideas || []);
      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate research problems.");
    } finally {
      setLoading(false);
    }
  };

  const buildDemoDetails = (idea: any) => ({
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

  const handleUseIdea = async (idea: any, index: number) => {
    if (expandedIdeaIndex === index) {
      setExpandedIdeaIndex(null);
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
      setIdeaDetails((prev) => ({ ...prev, [index]: data }));
      setExpandedIdeaIndex(index);
    } catch (err) {
      console.error(err);
      alert("Failed to load detailed problem statement.");
    } finally {
      setExpandingIdeaIndex(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Problem Statement Generator</h1>
        <p className="text-sm text-muted-foreground mb-6">Generate research ideas from your domain.</p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-6 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Domain</label>
            <Input 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., Natural Language Processing" 
              className="bg-secondary/50 border-border/50" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subdomain</label>
            <Input 
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="e.g., Sentiment Analysis" 
              className="bg-secondary/50 border-border/50" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Complexity</label>
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
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
        <Button onClick={handleGenerate} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} /> 
          {loading ? "Ideating..." : "Generate Ideas"}
        </Button>
      </motion.div>

      <AnimatePresence>
        {generated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea, i) => (
              <motion.div
                key={idea.title + i}
                className="rounded-xl border border-border/50 bg-card p-5 hover:border-accent/30 transition-colors group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < idea.rating ? "fill-accent text-accent" : "text-border"}`} />
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug">{idea.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{idea.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(idea.tags || []).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-border/60 bg-secondary/40 text-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-colors"
                  onClick={() => handleUseIdea(idea, i)}
                  disabled={expandingIdeaIndex === i}
                >
                  {expandingIdeaIndex === i ? "Loading details..." : expandedIdeaIndex === i ? "Hide details" : "Use this idea"}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIdea && selectedIdeaDetails && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 p-4 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedIdeaIndex(null)}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-border/50 bg-card p-5 sm:p-6"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug">{selectedIdeaDetails.title || selectedIdea.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Detailed problem brief</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setExpandedIdeaIndex(null)} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Problem Statement</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{selectedIdeaDetails.problem_statement || selectedIdea.desc}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Objective</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{selectedIdeaDetails.objective || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Step-by-step Plan</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground/90">
                    {(selectedIdeaDetails.step_by_step || []).map((step: any, stepIndex: number) => (
                      <li key={`${step.title || "step"}-${stepIndex}`}>
                        <span className="font-medium text-foreground">{step.title || `Step ${step.step || stepIndex + 1}`}: </span>
                        <span>{step.details || "Details not provided."}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Datasets/Tools</p>
                    <ul className="list-disc pl-4 text-xs text-foreground/80 space-y-0.5">
                      {(selectedIdeaDetails.datasets || []).map((item: string, idx: number) => <li key={`${item}-${idx}`}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Metrics</p>
                    <ul className="list-disc pl-4 text-xs text-foreground/80 space-y-0.5">
                      {(selectedIdeaDetails.evaluation_metrics || []).map((item: string, idx: number) => <li key={`${item}-${idx}`}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Expected Outcomes</p>
                    <ul className="list-disc pl-4 text-xs text-foreground/80 space-y-0.5">
                      {(selectedIdeaDetails.expected_outcomes || []).map((item: string, idx: number) => <li key={`${item}-${idx}`}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <div className="text-center py-16">
          <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Fill in your research domain and generate ideas.</p>
        </div>
      )}
    </div>
  );
}
