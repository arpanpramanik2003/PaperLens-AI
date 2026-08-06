import React from "react";
import { Search, Loader2, Play, Square, RefreshCw, Wand2, Globe, Database, ShieldCheck, CornerDownLeft, BrainCircuit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AgentGoalInputProps {
  goal: string;
  setGoal: (val: string) => void;
  isRunning: boolean;
  onStartAgent: () => void;
  onStopAgent?: () => void;
}

export const AgentGoalInput: React.FC<AgentGoalInputProps> = ({
  goal,
  setGoal,
  isRunning,
  onStartAgent,
  onStopAgent,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning && goal.trim()) {
        onStartAgent();
      }
    }
  };

  return (
    <div className="relative rounded-2xl border border-border/80 bg-card/90 p-5 md:p-6 shadow-xl backdrop-blur-xl transition-colors duration-200 space-y-4 focus-within:border-indigo-500/60">
      {/* Input Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-2 font-mono">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          Research Goal & Objective Prompt
        </label>
        {isRunning ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400 font-mono animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Agent loop actively executing...
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <CornerDownLeft className="w-3 h-3 text-indigo-400" />
            Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/60 text-[10px]">Ctrl + Enter</kbd> to run
          </div>
        )}
      </div>

      {/* Primary Research Goal Textarea */}
      <Textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isRunning}
        placeholder="Describe your research goal in detail (e.g. Graph neural networks for drug discovery: do a literature review, identify 3 unexplored research directions, and recommend benchmark datasets)..."
        className="min-h-[110px] md:min-h-[125px] rounded-xl bg-background/50 border border-border/60 p-4 text-sm md:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-indigo-500/80 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500/80 resize-y transition-colors duration-200"
      />

      {/* Tool Stack Badges & Execution Control Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40">
        {/* Research Workflow Capabilities */}
        <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground/70">Capabilities:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40 font-mono text-foreground/80">
            <BrainCircuit className="w-3 h-3 text-indigo-400" /> ReAct Reasoning Memory
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40 font-mono text-foreground/80">
            <Globe className="w-3 h-3 text-cyan-400" /> Global Paper Search
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/40 border border-border/40 font-mono text-foreground/80">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Peer-Review Audit
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 ml-auto">
          {goal && !isRunning && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGoal("")}
              className="h-9 px-3 text-xs border-border/70 hover:bg-secondary transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              Clear Prompt
            </Button>
          )}

          {isRunning ? (
            <Button
              onClick={onStopAgent}
              className="h-10 px-5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs md:text-sm font-semibold shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Agent Process
            </Button>
          ) : (
            <Button
              onClick={onStartAgent}
              disabled={!goal.trim()}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run Autonomous Agent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

