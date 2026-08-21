import React from "react";
import { FlaskConical, AlertTriangle, Cog, Layers, Database, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExperimentStep {
  num: number;
  title: string;
  iconName?: string;
  details: string;
  params?: string;
  risks?: string;
}

interface ExperimentPlanCardProps {
  steps: ExperimentStep[];
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const ExperimentPlanCard: React.FC<ExperimentPlanCardProps> = ({
  steps,
  renderTextOrObject,
  sectionIndex = 1,
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <Card className="p-5 border border-border/70 bg-card shadow-sm space-y-4 rounded-xl font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {sectionIndex}. Experimental Execution Roadmap
            </h3>
          </div>
        </div>
        <Badge variant="outline" className="text-[11px] font-mono bg-secondary/60 text-muted-foreground border-border/60">
          {steps.length} Execution Stages
        </Badge>
      </div>

      <div className="space-y-3">
        {steps.map((st, idx) => {
          const stageNum = st.num || idx + 1;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-secondary/15 border border-border/60 hover:border-indigo-500/30 transition-all space-y-2.5"
            >
              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Stage 0{stageNum}
                  </span>
                  <h4 className="font-semibold text-xs text-foreground">
                    {renderTextOrObject(st.title)}
                  </h4>
                </div>
              </div>

              {/* Implementation Strategy Details */}
              <div className="space-y-1 text-xs">
                <p className="text-foreground/90 leading-relaxed text-[11px]">
                  {renderTextOrObject(st.details)}
                </p>
              </div>

              {/* Parameters & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs">
                {st.params && (
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/40 space-y-1">
                    <span className="text-[10px] font-medium text-cyan-400 font-mono flex items-center gap-1">
                      <Cog className="w-3 h-3" /> Parameters & Configurations:
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {renderTextOrObject(st.params)}
                    </p>
                  </div>
                )}

                {st.risks && (
                  <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-medium text-amber-400 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Potential Risks & Checkpoints:
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {renderTextOrObject(st.risks)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
