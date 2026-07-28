import React from "react";
import { Target, AlertCircle, CheckSquare, Loader2, ChevronUp, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProposedDirectionsCardProps {
  proposedProblems: any[];
  directionPlans: Record<number, any[]>;
  loadingPlanIndex: number | null;
  onPlanExperimentRoadmap: (idx: number, title: string) => void;
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const ProposedDirectionsCard: React.FC<ProposedDirectionsCardProps> = ({
  proposedProblems,
  directionPlans,
  loadingPlanIndex,
  onPlanExperimentRoadmap,
  renderTextOrObject,
  sectionIndex = 2,
}) => {
  if (!proposedProblems || proposedProblems.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-border/70 bg-card shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {sectionIndex}. Proposed Novel Research Directions
          </h3>
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
          Problem Generator Engine
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {proposedProblems.map((prob, idx) => {
          const title = renderTextOrObject(prob.title) || `Novel Direction #${idx + 1}`;
          const problemStatement = renderTextOrObject(prob.problem_statement || prob.description || prob.desc);
          const objective = renderTextOrObject(prob.objective);
          const isExpanded = Boolean(directionPlans[idx]);
          const isLoadingThis = loadingPlanIndex === idx;
          const loadedSteps = directionPlans[idx] || [];

          return (
            <div
              key={idx}
              className="rounded-2xl border border-border/70 bg-secondary/10 p-5 space-y-4 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                    DIRECTION #{idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-foreground leading-snug">{title}</h4>
                </div>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                  High Impact Direction
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {problemStatement && (
                  <div className="p-3.5 rounded-xl bg-background/70 border border-border/60 space-y-1.5">
                    <span className="font-semibold text-amber-400 text-[11px] flex items-center gap-1.5 font-mono">
                      <AlertCircle className="w-3.5 h-3.5" /> Core Bottleneck / Problem Statement:
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">{problemStatement}</p>
                  </div>
                )}

                {objective && (
                  <div className="p-3.5 rounded-xl bg-background/70 border border-border/60 space-y-1.5">
                    <span className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1.5 font-mono">
                      <CheckSquare className="w-3.5 h-3.5" /> Proposed Solution & Objective:
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">{objective}</p>
                  </div>
                )}
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Generate full staged experiment design & mitigation roadmap.
                </span>

                <Button
                  onClick={() => onPlanExperimentRoadmap(idx, title)}
                  disabled={isLoadingThis}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Generating Experiment Plan...
                    </>
                  ) : isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Experiment Plan Roadmap
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4 text-indigo-200" />
                      Plan Roadmap in Experiment Planner
                    </>
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="pt-3 border-t border-border/50 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4" /> Experiment Planner Execution Roadmap ({loadedSteps.length} Stages)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Route: /api/plan-experiment
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {loadedSteps.map((st: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-3.5 rounded-xl bg-background/80 border border-border/70 space-y-2 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                          <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px]">
                              {st.num || sIdx + 1}
                            </span>
                            <span>{renderTextOrObject(st.title)}</span>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {renderTextOrObject(st.details)}
                        </p>

                        {st.params && (
                          <div className="text-[10px] text-indigo-300 font-mono bg-indigo-500/5 p-1.5 rounded border border-indigo-500/10">
                            <strong>Config/Params:</strong> {renderTextOrObject(st.params)}
                          </div>
                        )}

                        {st.risks && (
                          <div className="text-[10px] text-amber-300 font-mono bg-amber-500/5 p-1.5 rounded border border-amber-500/10">
                            <strong>Risk Checkpoint:</strong> {renderTextOrObject(st.risks)}
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
