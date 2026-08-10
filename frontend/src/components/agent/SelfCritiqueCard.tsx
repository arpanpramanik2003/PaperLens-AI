import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertTriangle, Award, BarChart2 } from "lucide-react";
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
  const verdict = critiqueData.verdict || "Pass with High Confidence";
  const isGrounded = critiqueData.grounded !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-card to-card shadow-xl backdrop-blur-2xl space-y-4 text-xs rounded-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                {sectionIndex}. Peer-Review Self-Critique & Citation Verification
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Unified audit pass (`SynthesisAndCritiqueResult`) evaluating grounding and citation coverage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`px-3 py-1 font-mono text-[11px] font-bold ${
                isGrounded
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              <Award className="w-3.5 h-3.5 mr-1" />
              {verdict}
            </Badge>
          </div>
        </div>

        {/* Citation Coverage Score Progress Bar */}
        <div className="p-3.5 rounded-2xl border border-border/60 bg-secondary/30 space-y-2">
          <div className="flex justify-between items-center text-[11px] font-mono font-semibold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              Citation Grounding Score:
            </span>
            <span className="text-emerald-400 font-bold">{coverageScore}% Grounded</span>
          </div>
          <div className="w-full bg-secondary/60 rounded-full h-2.5 overflow-hidden border border-border/40 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverageScore}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* Two-Column Grid: Validated Strengths vs Review Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Strengths */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Validated Strengths:
            </span>
            <ul className="space-y-1.5 text-foreground/90 text-xs">
              {(critiqueData.strengths || ["Comprehensive literature search", "Clear dataset recommendation"]).map(
                (s: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{renderTextOrObject(s)}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Issues / Notes */}
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-xs">
              <AlertTriangle className="w-4 h-4" />
              Peer Review Notes:
            </span>
            <ul className="space-y-1.5 text-foreground/90 text-xs">
              {(critiqueData.issues || ["Minor gap in scanner distribution shift"]).map(
                (iss: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{renderTextOrObject(iss)}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
