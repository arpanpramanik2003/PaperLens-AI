import React from "react";
import { Target, AlertCircle, CheckSquare, Loader2, ChevronUp, FlaskConical, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProposedDirectionsCardProps {
  proposedProblems?: any[];
  problems?: any[];
  directionPlans?: Record<number, any[]>;
  loadingPlanIndex?: number | null;
  onPlanExperimentRoadmap?: (idx: number, title: string) => void;
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const ProposedDirectionsCard: React.FC<ProposedDirectionsCardProps> = ({
  proposedProblems,
  problems,
  directionPlans = {},
  loadingPlanIndex = null,
  onPlanExperimentRoadmap,
  renderTextOrObject,
  sectionIndex = 2,
}) => {
  const items = proposedProblems || problems || [];
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 border border-border/70 bg-card shadow-sm space-y-4 rounded-xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {sectionIndex}. Proposed Research Directions & Problem Statements
          </h3>
        </div>
        <Badge variant="outline" className="text-[11px] font-mono bg-secondary/60 text-muted-foreground border-border/60">
          {items.length} Directions Formulated
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((prob, idx) => {
          const title = renderTextOrObject(prob.title) || `Research Direction #${idx + 1}`;
          const problemStatement = renderTextOrObject(prob.problem_statement || prob.description || prob.desc);
          const objective = renderTextOrObject(prob.objective);
          const isExpanded = Boolean(directionPlans[idx]);
          const isLoadingThis = loadingPlanIndex === idx;
          const loadedSteps = directionPlans[idx] || [];

          return (
            <div
              key={idx}
              className="rounded-xl border border-border/70 bg-secondary/15 p-4 space-y-3 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Direction 0{idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground leading-snug">{title}</h4>
                </div>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-mono">
                  Novel Problem
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {problemStatement && (
                  <div className="p-3 rounded-lg bg-background/80 border border-border/60 space-y-1">
                    <span className="font-semibold text-amber-400 text-[11px] flex items-center gap-1.5 font-mono">
                      <AlertCircle className="w-3 h-3" /> Core Bottleneck:
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">{problemStatement}</p>
                  </div>
                )}

                {objective && (
                  <div className="p-3 rounded-lg bg-background/80 border border-border/60 space-y-1">
                    <span className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1.5 font-mono">
                      <CheckSquare className="w-3 h-3" /> Proposed Solution:
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">{objective}</p>
                  </div>
                )}
              </div>

              {onPlanExperimentRoadmap && (
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Generate staged experiment design & protocol roadmap.
                  </span>

                  <Button
                    onClick={() => onPlanExperimentRoadmap(idx, title)}
                    disabled={isLoadingThis}
                    variant="outline"
                    size="sm"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium border-border/70 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all flex items-center gap-1.5"
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Plan...
                      </>
                    ) : isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Hide Roadmap
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                        Plan Experiment Roadmap
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isExpanded && (
                <div className="pt-3 border-t border-border/50 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-indigo-400 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5" /> Staged Execution Protocol ({loadedSteps.length} Stages)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {loadedSteps.map((st: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-lg bg-background/90 border border-border/70 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs border-b border-border/40 pb-1">
                          <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[9px]">
                            {st.num || sIdx + 1}
                          </span>
                          <span className="truncate">{renderTextOrObject(st.title)}</span>
                        </div>

                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-4">
                          {renderTextOrObject(st.details)}
                        </p>

                        {st.params && (
                          <div className="text-[10px] text-indigo-300 font-mono bg-indigo-500/5 p-1 rounded border border-indigo-500/10">
                            <strong>Config:</strong> {renderTextOrObject(st.params)}
                          </div>
                        )}

                        {st.risks && (
                          <div className="text-[10px] text-amber-300 font-mono bg-amber-500/5 p-1 rounded border border-amber-500/10">
                            <strong>Risk:</strong> {renderTextOrObject(st.risks)}
                          </div>
                        )}
                      </div>
                    ))}
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
