import React from "react";
import { Clock, ShieldCheck, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CardProvenanceBadgeProps {
  toolName?: string;
  timestamp?: string;
  durationMs?: number;
  qualitySignal?: string;
  className?: string;
}

export const CardProvenanceBadge: React.FC<CardProvenanceBadgeProps> = ({
  toolName,
  timestamp,
  durationMs,
  qualitySignal = "High Confidence",
  className = "",
}) => {
  if (!toolName && !timestamp && !durationMs) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground pb-1.5 px-1 ${className}`}>
      <div className="flex items-center gap-2">
        {toolName && (
          <span className="flex items-center gap-1.5 bg-secondary/80 px-2 py-0.5 rounded-md border border-border/60 text-foreground font-semibold text-[10px]">
            <Cpu className="w-3 h-3 text-indigo-400" />
            Tool: {toolName}
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
          className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1"
        >
          <ShieldCheck className="w-3 h-3" />
          {qualitySignal}
        </Badge>
      )}
    </div>
  );
};
