import React from "react";
import { AlertCircle, ShieldAlert, Lightbulb, Info, ArrowUpRight, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ResearchGapItem {
  title?: string;
  gap?: string;
  explanation?: string;
  description?: string;
  detail?: string;
  severity?: "high" | "medium" | "low" | string;
  suggestion?: string;
  opportunity?: string;
  mitigation?: string;
}

interface ResearchGapsCardProps {
  gaps: (ResearchGapItem | string)[];
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

const severityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "High Severity", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "Medium", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { label: "Low", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

export const ResearchGapsCard: React.FC<ResearchGapsCardProps> = ({
  gaps,
  renderTextOrObject,
  sectionIndex = 1,
}) => {
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const normalizedGaps: ResearchGapItem[] = gaps.map((g) => {
    if (typeof g === "string") {
      return {
        title: g,
        explanation: "",
        severity: "medium",
        suggestion: "",
      };
    }
    return {
      title: g.title || g.gap || "Research Gap",
      explanation: g.explanation || g.description || g.detail || "",
      severity: (g.severity || "medium").toLowerCase(),
      suggestion: g.suggestion || g.opportunity || g.mitigation || "",
    };
  });

  return (
    <Card className="border border-border/80 bg-card/90 shadow-sm rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>{sectionIndex}.</span> Research Gap Analysis & Limitations
            </h3>
            <p className="text-[10px] text-muted-foreground">Unexplored dimensions, architectural constraints & methodological vulnerabilities</p>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono bg-background/50 border-border/60">
          {normalizedGaps.length} Gaps Identified
        </Badge>
      </div>

      {/* Gaps List */}
      <div className="p-3.5 space-y-3">
        {normalizedGaps.map((item, i) => {
          const sevKey = item.severity?.toLowerCase() || "medium";
          const sevStyle = severityConfig[sevKey] || severityConfig.medium;
          const copyText = `${item.title}\n\nExplanation: ${item.explanation}\n\nRecommendation: ${item.suggestion}`;

          return (
            <div
              key={i}
              className="group relative rounded-xl border border-border/60 bg-background/50 p-3.5 hover:border-border transition-all space-y-2.5"
            >
              {/* Title & Severity */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                      GAP 0{i + 1}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${sevStyle.className}`}>
                      {sevStyle.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-snug">
                    {item.title}
                  </h4>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy gap report"
                  onClick={() => handleCopy(copyText, i)}
                >
                  {copiedIdx === i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>

              {/* Detailed Explanation */}
              {item.explanation ? (
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {item.explanation}
                </p>
              ) : null}

              {/* Actionable Suggestion / Mitigation Box */}
              {item.suggestion && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-medium text-indigo-300 block">Suggested Research Mitigation:</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.suggestion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
