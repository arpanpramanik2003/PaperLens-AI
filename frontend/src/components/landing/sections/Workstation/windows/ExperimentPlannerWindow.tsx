import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { difficultyLevels, experimentSteps, researchTopics, ease } from "../workstationData";

export default function ExperimentPlannerWindow() {
  const [steps, setSteps] = useState(experimentSteps.slice(0, 4));
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const topic = researchTopics[0];
  const difficulty = difficultyLevels[0];

  const handleGeneratePlan = () => {
    const shuffled = [...experimentSteps].sort(() => Math.random() - 0.5);
    setSteps(shuffled.slice(0, 4));
    setExpandedStep(0);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Experiment & Ablation Planner</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted/30 border border-border/70">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Target Domain</span>
              <span className="text-xs font-medium text-foreground">{topic}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/70">
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Rigor Level</span>
              <span className="text-xs font-medium text-foreground">{difficulty}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              Ablation Matrix & Execution Protocol
            </h4>
            <button
              type="button"
              onClick={handleGeneratePlan}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              Regenerate Protocol
            </button>
          </div>

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/80 bg-muted/20 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  className="w-full text-left p-2.5 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {step.num}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">{step.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {expandedStep === i ? "−" : "+"}
                  </span>
                </button>

                {expandedStep === i && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/50 text-[11px] text-muted-foreground space-y-1.5">
                    <p className="leading-relaxed">{step.desc}</p>
                    <div className="p-2 rounded bg-background/80 font-mono text-[10px] text-foreground border border-border/60">
                      {step.code}
                    </div>
                    {step.risk && (
                      <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {step.risk}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
