import React from "react";
import { Search, Loader2, Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AgentGoalInputProps {
  goal: string;
  setGoal: (val: string) => void;
  isRunning: boolean;
  onStartAgent: () => void;
}

export const AgentGoalInput: React.FC<AgentGoalInputProps> = ({
  goal,
  setGoal,
  isRunning,
  onStartAgent,
}) => {
  return (
    <Card className="p-4 border-border/70 bg-card shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          Enter Research Goal & Requirements
        </label>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Agent loop executing...
          </div>
        )}
      </div>

      <Textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        disabled={isRunning}
        placeholder="e.g. Graph neural networks for drug discovery: do a literature review and identify 3 unexplored directions."
        className="min-h-[85px] rounded-lg bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-ring text-sm"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          Autonomous loop: Intent router → Tool Graph → Critique → Synthesis.
        </span>

        <div className="flex items-center gap-2">
          {goal && !isRunning && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGoal("")}
              className="h-8 text-xs border-border/70"
            >
              <RefreshCw className="w-3 h-3 mr-1 text-muted-foreground" />
              Clear
            </Button>
          )}

          <Button
            onClick={onStartAgent}
            disabled={isRunning || !goal.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Running Research Task...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Run Autonomous Agent
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
