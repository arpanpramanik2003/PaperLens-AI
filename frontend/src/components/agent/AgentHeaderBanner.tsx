import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Dna, Layers, BookOpen, ShieldCheck, ArrowRight, Zap } from "lucide-react";
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
    color: "from-purple-500/15 via-indigo-500/10 to-purple-500/5 text-purple-400 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/5",
  },
  {
    title: "Medical AI & Oncology",
    tag: "Brain Tumor Benchmarks",
    icon: BrainCircuit,
    color: "from-cyan-500/15 via-blue-500/10 to-cyan-500/5 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60 shadow-cyan-500/5",
  },
  {
    title: "Medical Imaging & Segmentation",
    tag: "Diffusion Models",
    icon: Layers,
    color: "from-emerald-500/15 via-teal-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/5",
  },
];

export const AgentHeaderBanner: React.FC<AgentHeaderBannerProps> = ({
  presetPrompts,
  isRunning,
  onSelectPreset,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/95 via-card/70 to-card/95 p-6 md:p-8 shadow-2xl backdrop-blur-2xl space-y-6"
    >
      {/* Background Subtle Mesh Glow Effects */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Top Meta Bar: Engine Status & Model Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Autonomous Multi-Agent Engine v2.0
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Fast-Path Router Active
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Literature & Vector RAG
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Pydantic Verified
          </Badge>
        </div>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="space-y-2 max-w-3xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-indigo-300">
              Autonomous Research Orchestrator
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
              Input any research goal to trigger literature discovery, problem ideation, dataset recommendations, peer-review self-critique, and inline experiment roadmaps.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Preset Prompt Templates */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Quick Start Templates:
          </span>
          <span className="text-[11px] text-muted-foreground/70 hidden sm:inline font-mono">
            Click any prompt to run autonomous loop
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {presetPrompts.map((preset, idx) => {
            const meta = PRESET_META[idx] || {
              title: "Research Exploration",
              tag: "General Inquiry",
              icon: Sparkles,
              color: "from-secondary/40 to-secondary/10 text-indigo-400 border-border/60",
            };
            const IconComp = meta.icon;

            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isRunning}
                onClick={() => onSelectPreset(preset)}
                className={`group relative text-left p-4 rounded-2xl border bg-gradient-to-br transition-all duration-300 shadow-md ${meta.color} ${
                  isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-background/80 border border-border/50 font-bold shadow-sm">
                    {meta.tag}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-foreground" />
                </div>
                <div className="flex items-start gap-2.5">
                  <IconComp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/90 font-medium leading-snug line-clamp-2">
                    {preset}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
