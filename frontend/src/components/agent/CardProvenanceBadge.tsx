import React from "react";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CardProvenanceBadgeProps {
  toolName?: string;
  timestamp?: string;
  durationMs?: number;
  qualitySignal?: string;
  className?: string;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_papers: "Literature Discovery",
  search_workspace_vector_db: "Document Index",
  analyze_paper: "Deep Paper Analysis",
  detect_gaps: "Research Gap Analysis",
  generate_problem: "Problem Formulation",
  find_datasets: "Benchmark Datasets",
  plan_experiment: "Experimental Roadmap",
  synthesize_and_verify: "Quality Audit",
};

export const CardProvenanceBadge: React.FC<CardProvenanceBadgeProps> = ({
  toolName,
  timestamp,
  durationMs,
  qualitySignal,
  className = "",
}) => {
  if (!toolName && !timestamp && !durationMs && !qualitySignal) return null;

  const displayName = toolName ? (TOOL_DISPLAY_NAMES[toolName] || toolName) : null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground pb-1.5 px-1 ${className}`}>
      <div className="flex items-center gap-2">
        {displayName && (
          <span className="flex items-center gap-1.5 bg-secondary/80 px-2 py-0.5 rounded-md border border-border/60 text-foreground font-medium text-[10px]">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {displayName}
          </span>
        )}

        {durationMs !== undefined && durationMs > 0 && (
          <span className="flex items-center gap-1 text-[10px]">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            {(durationMs / 1000).toFixed(1)}s
          </span>
        )}

        {timestamp && (
          <span className="text-[10px] text-muted-foreground">
            {timestamp}
          </span>
        )}
      </div>

      {qualitySignal && (
        <Badge
          variant="outline"
          className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-mono"
        >
          <ShieldCheck className="w-3 h-3" />
          {qualitySignal}
        </Badge>
      )}
    </div>
  );
};
