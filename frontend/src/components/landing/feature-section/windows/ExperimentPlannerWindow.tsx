import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { difficultyLevels, experimentSteps, researchTopics } from "../constants";
import { ease } from "../shared";

export default function ExperimentPlannerWindow() {
  const [steps, setSteps] = useState(experimentSteps.slice(0, 4));
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const topic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
  const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];

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
      onMouseEnter={handleGeneratePlan}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Experiment Planner</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          <div className="mb-5 pb-5 border-b border-border">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Research Topic</label>
                <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium">{topic}</div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Difficulty Level</label>
                <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors">
                  <span>{difficulty}</span>
                  <span className="text-muted-foreground text-[10px]">▼</span>
                </div>
              </div>

              <motion.button
                onClick={handleGeneratePlan}
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Plan
              </motion.button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {steps.map((step) => (
              <div
                key={step.num}
                className="border border-border rounded-lg overflow-hidden bg-card hover:border-accent/40 transition-colors shadow-xs"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
                  className="w-full flex items-start gap-3 p-2.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex-shrink-0 mt-0.5 text-[11px] font-bold text-accent">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground break-words">{step.title}</h4>
                  </div>
                  <span className="text-muted-foreground text-[10px] flex-shrink-0">
                    {expandedStep === step.num ? "▲" : "▼"}
                  </span>
                </button>

                {expandedStep === step.num && (
                  <div className="p-3 pt-0 space-y-2 bg-muted/20 border-t border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed pt-2">{step.desc}</p>

                    {step.code && <div className="bg-muted/60 border border-border rounded px-2.5 py-1.5 font-mono text-[11px] text-foreground/90">{step.code}</div>}

                    {step.risk && (
                      <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
                        <Zap className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-destructive font-medium">{step.risk}</span>
                      </div>
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
