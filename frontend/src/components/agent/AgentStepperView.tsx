import React from "react";
import { BrainCircuit, CheckCircle2, Loader2, Sparkles } from "lucide-react";
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
}

export const AgentStepperView: React.FC<AgentStepperViewProps> = ({
  steps,
  currentStepIndex,
  progressPercent,
  isRunning,
  finalAnswer,
}) => {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-xl backdrop-blur-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Autonomous Execution Pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Live event stream of intent router, tool execution graph, self-critique & report synthesis
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
          {progressPercent}% Orchestration Complete
        </Badge>
      </div>

      {/* Modern Gradient Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>Pipeline Status: {isRunning ? "Processing Steps..." : finalAnswer ? "Workflow Finished" : "Ready"}</span>
          <span>{currentStepIndex} of {steps.length} Steps</span>
        </div>
        <div className="w-full bg-secondary/60 rounded-full h-2.5 overflow-hidden border border-border/40 p-0.5">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepper Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {steps.map((st) => {
          const isDone = currentStepIndex > st.id || (!isRunning && finalAnswer !== null && currentStepIndex >= st.id);
          const isCurrent = isRunning && currentStepIndex === st.id;
          const IconComp = st.icon;

          return (
            <div
              key={st.id}
              className={`relative p-4 rounded-xl border transition-all duration-300 space-y-2.5 ${
                isCurrent
                  ? "bg-indigo-500/10 border-indigo-500/60 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                  : isDone
                  ? "bg-emerald-500/5 border-emerald-500/25"
                  : "bg-secondary/20 border-border/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
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
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      Step 0{st.id}
                    </span>
                    <span className="font-bold text-xs text-foreground line-clamp-1">
                      {st.name}
                    </span>
                  </div>
                </div>

                {isDone ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4.5 h-4.5 text-indigo-400 animate-spin flex-shrink-0" />
                ) : null}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pl-0.5">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

