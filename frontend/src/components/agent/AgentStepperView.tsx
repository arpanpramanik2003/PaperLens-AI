import React from "react";
import { BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <Card className="p-6 border-border/70 bg-card shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight">Autonomous Multi-Agent Progress</h3>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {progressPercent}% Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden border border-border/40">
        <div
          className="bg-indigo-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stepper Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((st) => {
          const isDone = currentStepIndex > st.id || (!isRunning && finalAnswer !== null && currentStepIndex >= st.id);
          const isCurrent = isRunning && currentStepIndex === st.id;
          const IconComp = st.icon;

          return (
            <div
              key={st.id}
              className={`p-4 rounded-lg border transition-all duration-300 space-y-2 ${
                isCurrent
                  ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                  : isDone
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-secondary/20 border-border/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-md ${
                      isCurrent
                        ? "bg-indigo-500 text-white"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    Step {st.id}: {st.name}
                  </span>
                </div>

                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                ) : null}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">{st.desc}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
