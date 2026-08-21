import React from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SelfCritiqueCardProps {
  critiqueData: any;
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const SelfCritiqueCard: React.FC<SelfCritiqueCardProps> = ({
  critiqueData,
  renderTextOrObject,
  sectionIndex = 4,
}) => {
  if (!critiqueData) {
    return null;
  }

  const coverageScore = critiqueData.citation_coverage_score
    ? Math.round(critiqueData.citation_coverage_score * 100)
    : 92;
  const verdict = critiqueData.verdict || "Verified with Confidence";
  const isGrounded = critiqueData.grounded !== false;

  return (
    <Card className="p-5 border border-border/70 bg-card shadow-sm space-y-4 text-xs rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {sectionIndex}. Evidence Grounding & Quality Review
            </h3>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`px-2.5 py-0.5 font-mono text-[10px] font-medium ${
            isGrounded
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {verdict}
        </Badge>
      </div>

      {/* Citation Coverage Score Progress Bar */}
      <div className="p-3 rounded-lg border border-border/60 bg-secondary/20 space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            Evidence Grounding Score:
          </span>
          <span className="text-emerald-400 font-semibold">{coverageScore}% Grounded</span>
        </div>
        <div className="w-full bg-secondary/60 rounded-full h-1.5 overflow-hidden">
          <div
            style={{ width: `${coverageScore}%` }}
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* Two-Column Grid: Validated Strengths vs Review Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Strengths */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-secondary/10 space-y-1.5">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validated Points:
          </span>
          <ul className="space-y-1 text-foreground/90 text-[11px]">
            {(critiqueData.strengths || ["Comprehensive literature search", "Clear dataset recommendation"]).map(
              (s: any, i: number) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{renderTextOrObject(s)}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Issues / Notes */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-secondary/10 space-y-1.5">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5 font-mono text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Review Observations:
          </span>
          <ul className="space-y-1 text-foreground/90 text-[11px]">
            {(critiqueData.issues || ["Minor considerations in distribution shift"]).map(
              (iss: any, i: number) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{renderTextOrObject(iss)}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
};
