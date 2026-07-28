import React from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

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

  return (
    <Card className="p-5 border-border/70 bg-card shadow-sm space-y-3 text-xs">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold tracking-tight">{sectionIndex}. Peer-Review Self-Critique & Verification</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="font-semibold text-emerald-400">Validated Strengths:</span>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
            {(critiqueData.strengths || ["Comprehensive literature search", "Clear dataset recommendation"]).map(
              (s: any, i: number) => (
                <li key={i}>{renderTextOrObject(s)}</li>
              )
            )}
          </ul>
        </div>
        <div className="space-y-1">
          <span className="font-semibold text-amber-400">Review Notes:</span>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
            {(critiqueData.issues || ["Minor gap in scanner distribution shift"]).map(
              (iss: any, i: number) => (
                <li key={i}>{renderTextOrObject(iss)}</li>
              )
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
};
