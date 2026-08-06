import React from "react";
import { FlaskConical, CheckCircle2, AlertTriangle, Cpu, Layers, BarChart3, Database, Cog } from "lucide-react";
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

const ICON_MAP: Record<string, any> = {
  Database: Database,
  Cog: Cog,
  Cpu: Cpu,
  BarChart3: BarChart3,
  FlaskConical: FlaskConical,
  Layers: Layers,
};

export const ExperimentPlanCard: React.FC<ExperimentPlanCardProps> = ({
  steps,
  renderTextOrObject,
  sectionIndex = 1,
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <Card className="p-6 border-border/80 bg-card/90 shadow-xl backdrop-blur-xl space-y-5 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              {sectionIndex}. Experimental Execution Roadmap & Plan
            </h3>
            <p className="text-xs text-muted-foreground">
              Multi-stage engineering roadmap, hyperparameter specifications & risk mitigations
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
          {steps.length} Execution Stages
        </Badge>
      </div>

      <div className="space-y-4">
        {steps.map((st, idx) => {
          const IconComp = ICON_MAP[st.iconName || ""] || FlaskConical;
          const stageNum = st.num || idx + 1;

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-secondary/20 border border-border/60 hover:border-indigo-500/40 transition-all space-y-3"
            >
              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Stage 0{stageNum}
                  </span>
                  <h4 className="font-bold text-sm text-foreground">
                    {renderTextOrObject(st.title)}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <IconComp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Execution Phase</span>
                </div>
              </div>

              {/* Implementation Strategy Details */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider">
                  Implementation Strategy & Architecture
                </span>
                <p className="text-foreground/90 leading-relaxed">
                  {renderTextOrObject(st.details)}
                </p>
              </div>

              {/* Parameters & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                {st.params && (
                  <div className="p-3 rounded-lg bg-background/50 border border-border/40 space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono flex items-center gap-1">
                      <Cog className="w-3 h-3" /> Concrete Parameters & Configs
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {renderTextOrObject(st.params)}
                    </p>
                  </div>
                )}

                {st.risks && (
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Technical Risks & Failure Modes
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
