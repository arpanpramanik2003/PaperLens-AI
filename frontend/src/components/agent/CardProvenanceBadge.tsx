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
    <div className={`flex flex-wrap items-center gap-2 text-[10px] font-mono text-muted-foreground pt-2.5 border-t border-border/40 ${className}`}>
      {toolName && (
        <span className="flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded border border-border/50 text-foreground/80">
          <Cpu className="w-2.5 h-2.5 text-indigo-400" />
          Tool: {toolName}
        </span>
      )}

      {durationMs !== undefined && durationMs > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-muted-foreground" />
          {(durationMs / 1000).toFixed(1)}s latency
        </span>
      )}

      {timestamp && (
        <span className="text-muted-foreground">
          {timestamp}
        </span>
      )}

      {qualitySignal && (
        <Badge
          variant="outline"
          className="ml-auto text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          {qualitySignal}
        </Badge>
      )}
    </div>
  );
};
