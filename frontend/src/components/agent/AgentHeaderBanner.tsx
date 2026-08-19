import React from "react";
import { Sparkles, ArrowRight, Dna, BrainCircuit, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderBannerProps {
  presetPrompts?: string[];
  isRunning?: boolean;
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

export const AgentHeaderBanner: React.FC<AgentHeaderBannerProps> = ({
  presetPrompts,
  isRunning = false,
  onSelectPreset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md text-xs shadow-sm">
      {/* Left: Clean status & engine identifier */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-foreground tracking-tight">
          Autonomous Research Workbench
        </span>
        <Badge
          variant="outline"
          className="text-[10px] font-mono px-2 py-0 bg-secondary/80 text-muted-foreground border-border/50"
        >
          Two-Tier Engine
        </Badge>
      </div>

      {/* Right: Quick starter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 font-medium">
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-indigo-500/10 hover:text-indigo-300 border border-border/60 hover:border-indigo-500/30 text-[11px] text-foreground/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Icon className="w-3 h-3 text-muted-foreground group-hover:text-indigo-400" />
              <span>{item.label}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
