import React from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderBannerProps {
  presetPrompts: string[];
  isRunning: boolean;
  onSelectPreset: (preset: string) => void;
}

export const AgentHeaderBanner: React.FC<AgentHeaderBannerProps> = ({
  presetPrompts,
  isRunning,
  onSelectPreset,
}) => {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-secondary text-foreground border border-border/50">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Agent Mode: Autonomous Research Orchestrator
            </h1>
            <p className="text-xs text-muted-foreground">
              Literature review, step-by-step problem roadmaps, dataset selection & self-critique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 border-border/70">
            Model: Groq / Llama-3.3-70B
          </Badge>
          <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            MCP & Supabase pgvector Active
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sample Research Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              disabled={isRunning}
              onClick={() => onSelectPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary hover:border-border text-foreground transition-all text-left flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="truncate max-w-lg">{preset}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
