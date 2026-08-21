import React from "react";
import { Sparkles, ArrowRight, Dna, BrainCircuit, Layers, FileText, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  isRunning?: boolean;
  activePaper?: { id: string; filename: string; pages: number } | null;
  onRemovePaper?: () => void;
  onNewSession?: () => void;
  onSelectPreset?: (preset: string) => void;
}

const PRESET_PILLS = [
  {
    label: "Drug Discovery GNNs",
    prompt: "Graph neural networks for drug discovery: do a literature review and identify 3 unexplored directions.",
    icon: Dna,
  },
  {
    label: "Brain Tumor Datasets",
    prompt: "I want to work on brain tumor. Do a literature review, then tell me which dataset and benchmark I should use.",
    icon: BrainCircuit,
  },
  {
    label: "Diffusion Segmentation",
    prompt: "Diffusion models for medical imaging segmentation: literature review and benchmark datasets.",
    icon: Layers,
  },
];

export const AgentHeader: React.FC<AgentHeaderProps> = ({
  isRunning = false,
  activePaper,
  onRemovePaper,
  onNewSession,
  onSelectPreset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border/70 bg-card text-xs shadow-sm">
      {/* Left: Clean status indicator */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          {isRunning ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          )}
        </span>
        <span className="font-semibold text-foreground tracking-tight">
          Research Agent
        </span>
        <Badge
          variant="outline"
          className="text-[10px] font-mono px-2 py-0 bg-secondary/60 text-muted-foreground border-border/50"
        >
          {isRunning ? "Researching..." : "Ready"}
        </Badge>

        {activePaper && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 border border-border/60 text-foreground text-[11px]">
            <FileText className="w-3 h-3 text-indigo-400" />
            <span className="max-w-[130px] truncate font-medium">{activePaper.filename}</span>
            {onRemovePaper && (
              <button
                type="button"
                onClick={onRemovePaper}
                className="hover:text-red-400 ml-0.5 text-muted-foreground transition-colors"
                title="Remove paper context"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick presets + New Session */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Quick Starters:
          </span>

          {PRESET_PILLS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={isRunning}
                onClick={() => onSelectPreset?.(item.prompt)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/40 hover:bg-secondary border border-border/60 hover:border-border text-[11px] text-foreground/80 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Icon className="w-3 h-3 text-muted-foreground group-hover:text-indigo-400" />
                <span>{item.label}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>

        {onNewSession && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewSession}
            disabled={isRunning}
            className="h-7 text-[11px] rounded-lg border-border/60 hover:bg-secondary text-foreground gap-1.5"
            title="Start new research session"
          >
            <RefreshCw className="w-3 h-3" />
            New Session
          </Button>
        )}
      </div>
    </div>
  );
};
