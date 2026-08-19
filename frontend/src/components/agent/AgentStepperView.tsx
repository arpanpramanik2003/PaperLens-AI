import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Loader2, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StepItem {
  id: number;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AgentStepperViewProps {
  steps: StepItem[];
  currentStepIndex: number;
  progressPercent: number;
  isRunning: boolean;
  finalAnswer: string | null;
  latestThought?: string | null;
  memorySummary?: string | null;
}

export const AgentStepperView: React.FC<AgentStepperViewProps> = ({
  steps,
  currentStepIndex,
  progressPercent,
  isRunning,
  finalAnswer,
  latestThought,
  memorySummary,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-2xl backdrop-blur-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              Autonomous ReAct Execution Stream
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                Pydantic ReActDecision
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Iterative reasoning loop (Thought → Action → Observation) with live working memory
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold shadow-sm">
          {progressPercent}% Complete
        </Badge>
      </div>

      {/* Functional Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 font-semibold">
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Active Reasoning Cycle...
              </>
            ) : finalAnswer ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Workflow Execution Complete
              </>
            ) : (
              "Ready to Initialize Goal"
            )}
          </span>
          <span>Step {currentStepIndex} of {steps.length}</span>
        </div>
        <div className="w-full bg-secondary/60 rounded-full h-2 overflow-hidden border border-border/40 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
          />
        </div>
      </div>

      {/* Live ReAct Working Memory Scratchpad */}
      <div className="p-4 rounded-2xl border border-border/70 bg-secondary/30 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Agent Working Memory Scratchpad:
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-secondary text-foreground/80 border border-border/60 font-semibold">
            Structured Context State
          </span>
        </div>
        <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed italic">
          "{latestThought || (steps.length === 0 ? "Direct chat session active. No academic tools required." : "Reasoning about research objective...")}"
        </p>
        {memorySummary && (
          <p className="text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/40">
            Memory Status: {memorySummary}
          </p>
        )}
      </div>

      {/* Stepper Cards Grid */}
      {steps.length === 0 ? (
        <div className="p-6 rounded-2xl border border-border/60 bg-secondary/20 text-center space-y-2">
          <BrainCircuit className="w-8 h-8 text-indigo-400/60 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground font-medium">
            Direct Chat Session Active. Academic tools (literature search, dataset recommendations, gap detection) are only invoked for specialized research queries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {steps.map((st) => {
            const isDone = currentStepIndex > st.id || (!isRunning && finalAnswer !== null && currentStepIndex >= st.id);
            const isCurrent = isRunning && currentStepIndex === st.id;
            const IconComp = st.icon;

            return (
              <motion.div
                key={st.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-4 rounded-2xl border transition-all duration-300 space-y-2.5 shadow-sm ${
                  isCurrent
                    ? "bg-indigo-500/10 border-indigo-500/60 shadow-lg shadow-indigo-500/15 scale-[1.01]"
                    : isDone
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-secondary/20 border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                          : isDone
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                        Step {st.id}
                      </span>
                      <span className="text-xs font-bold text-foreground line-clamp-1">
                        {st.name}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  )}
                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {st.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
