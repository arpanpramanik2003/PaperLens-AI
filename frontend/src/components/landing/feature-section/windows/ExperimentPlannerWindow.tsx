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
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Experiment Planner</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          <motion.div
            className="mb-6 pb-6 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Research Topic</label>
                <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2.5 text-xs text-foreground">{topic}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Difficulty Level</label>
                <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2.5 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors">
                  <span>{difficulty}</span>
                  <span className="text-muted-foreground text-xs">▼</span>
                </div>
              </div>

              <motion.button
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Plan
              </motion.button>
            </div>
          </motion.div>

          <div className="space-y-2 flex-1">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                className="border border-border/20 rounded-lg overflow-hidden bg-secondary/20 hover:border-purple-500/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
              >
                <motion.button
                  onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-secondary/40 transition-colors text-left"
                  whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.08)" }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/30 border border-purple-500/50 flex-shrink-0 mt-0.5 text-xs font-semibold text-purple-300">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground break-words">{step.title}</h4>
                  </div>
                  <motion.span animate={{ rotate: expandedStep === step.num ? 180 : 0 }} className="text-muted-foreground flex-shrink-0">
                    ▼
                  </motion.span>
                </motion.button>

                <motion.div
                  initial={false}
                  animate={{ height: expandedStep === step.num ? "auto" : 0, opacity: expandedStep === step.num ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2 bg-secondary/10 border-t border-border/10">
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                    {step.code && <div className="bg-secondary/50 rounded px-2.5 py-1.5 font-mono text-xs text-purple-300">{step.code}</div>}

                    {step.risk && (
                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-300">{step.risk}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
