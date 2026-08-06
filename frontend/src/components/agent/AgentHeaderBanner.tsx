import React from "react";
import { BrainCircuit, Sparkles, Dna, Layers, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderBannerProps {
  presetPrompts: string[];
  isRunning: boolean;
  onSelectPreset: (preset: string) => void;
}

const PRESET_META = [
  {
    title: "Drug Discovery & GNNs",
    tag: "Graph Neural Networks",
    icon: Dna,
    color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/40",
  },
  {
    title: "Medical AI & Oncology",
    tag: "Brain Tumor Benchmarks",
    icon: BrainCircuit,
    color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    title: "Medical Imaging & Segmentation",
    tag: "Diffusion Models",
    icon: Layers,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40",
  },
];

export const AgentHeaderBanner: React.FC<AgentHeaderBannerProps> = ({
  presetPrompts,
  isRunning,
  onSelectPreset,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/90 via-card/60 to-card/90 p-6 md:p-8 shadow-lg backdrop-blur-xl space-y-6">
      {/* Background Subtle Mesh Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Top Meta Bar: Engine Status & Model Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Autonomous Agent Workbench
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
          >
            <BookOpen className="w-3 h-3" />
            Academic Paper Search
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            <ShieldCheck className="w-3 h-3" />
            Automated Self-Critique Active
          </Badge>
        </div>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="space-y-2 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Autonomous Research Orchestrator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-0.5">
              Formulate novel research directions, conduct multi-repository literature surveys, discover datasets, and run automated peer-review critiques.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Preset Prompt Templates */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Quick Start Templates:
          </span>
          <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
            Click any prompt to populate & run research loop
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presetPrompts.map((preset, idx) => {
            const meta = PRESET_META[idx] || {
              title: "Research Exploration",
              tag: "General Inquiry",
              icon: Sparkles,
              color: "from-secondary/30 to-secondary/10 text-indigo-400 border-border/60",
            };
            const IconComp = meta.icon;

            return (
              <button
                key={idx}
                disabled={isRunning}
                onClick={() => onSelectPreset(preset)}
                className={`group relative text-left p-3.5 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${meta.color} ${
                  isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-background/60 border border-border/40 font-semibold">
                    {meta.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-foreground" />
                </div>
                <div className="flex items-start gap-2.5">
                  <IconComp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/90 font-medium leading-snug line-clamp-2">
                    {preset}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

