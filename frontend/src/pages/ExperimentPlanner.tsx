import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";

const ease = [0.2, 0, 0, 1] as const;

export default function ExperimentPlanner() {
  const { getToken, userId } = useAuth();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [visibleSteps, setVisibleSteps] = useState(0);

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
      
      setSteps(data.steps || []);
      setGenerated(true);
      
      data.steps?.forEach((_: any, i: number) => {
        setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 300);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to plan experiment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Experiment Planner</h1>
        <p className="text-sm text-muted-foreground mb-6">Generate a step-by-step research execution plan.</p>
      </motion.div>

      {/* Input */}
      <motion.div
        className="rounded-xl border border-border/50 bg-card p-6 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Research Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Fine-tuning BERT for sentiment analysis"
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty Level</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            <FlaskConical className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} /> 
            {loading ? "Planning..." : "Generate Plan"}
          </Button>
        </div>
      </motion.div>

      {/* Steps */}
      <AnimatePresence>
        {generated && (
          <div className="space-y-0">
            {steps.slice(0, visibleSteps).map((step, i) => {
              const IconComponent = (Icons as any)[step.iconName] || Icons.Cog;
              return (
              <motion.div
                key={step.num || i}
                className="relative pl-10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease }}
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[15px] top-10 w-[2px] h-[calc(100%-8px)] bg-border" />
                )}

                {/* Step number */}
                <div className="absolute left-0 top-0 w-[32px] h-[32px] rounded-full border-2 border-border bg-card flex items-center justify-center z-10">
                  <span className="text-xs font-mono font-medium text-foreground tabular-nums">{step.num}</span>
                </div>

                {/* Step content */}
                <div
                  className={`mb-6 rounded-xl border bg-card transition-all duration-200 ${
                    expandedStep === i ? "border-accent/30" : "border-border/50"
                  }`}
                >
                  <button
                    onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <IconComponent className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={1.5} />
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
                          <p className="text-sm text-muted-foreground leading-relaxed">{step.details}</p>
                          <div className="rounded-lg bg-secondary/50 px-3 py-2">
                            <p className="text-xs font-mono text-muted-foreground">{step.params}</p>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-destructive font-medium">Risk:</span>
                            <span>{step.risks}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </AnimatePresence>

      {!generated && (
        <div className="text-center py-16">
          <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Enter a topic and generate your experiment plan.</p>
        </div>
      )}
    </div>
  );
}
