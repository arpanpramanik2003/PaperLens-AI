import React from "react";
import { Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DatasetsBenchmarksCardProps {
  datasetsList: any[];
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const DatasetsBenchmarksCard: React.FC<DatasetsBenchmarksCardProps> = ({
  datasetsList,
  renderTextOrObject,
  sectionIndex = 3,
}) => {
  if (!datasetsList || datasetsList.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 border border-border/70 bg-card shadow-sm space-y-4 rounded-xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {sectionIndex}. Benchmark Datasets & Evaluation Metrics
          </h3>
        </div>
        <Badge variant="outline" className="text-[11px] font-mono bg-secondary/60 text-muted-foreground border-border/60">
          {datasetsList.length} Datasets
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {datasetsList.map((ds, idx) => {
          const name = renderTextOrObject(ds.name) || `Dataset #${idx + 1}`;
          const description = renderTextOrObject(
            ds.short_description || ds.description || ds.summary || ds.details?.short_description
          );
          const fitScore =
            typeof ds.fit_score === "number"
              ? ds.fit_score.toFixed(1)
              : ds.details?.fit_score
              ? String(ds.details.fit_score)
              : "4.8";

          const modality =
            renderTextOrObject(ds.type || ds.format || ds.details?.modality || ds.details?.type) ||
            "Benchmark Data";

          let tasks = renderTextOrObject(ds.tasks || ds.details?.tasks);
          if (!tasks && Array.isArray(ds.details?.tasks)) {
            tasks = ds.details.tasks.join(", ");
          }
          if (!tasks) tasks = "Benchmarking & Evaluation";

          let metrics = renderTextOrObject(
            ds.metrics || ds.details?.metrics || ds.details?.primary_metrics
          );
          if (!metrics && Array.isArray(ds.details?.primary_metrics)) {
            metrics = ds.details.primary_metrics.join(", ");
          }
          if (!metrics) metrics = "Standard Metrics";

          return (
            <div
              key={idx}
              className="rounded-xl border border-border/70 bg-secondary/15 p-4 space-y-2.5 hover:border-cyan-500/30 transition-all shadow-sm text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-foreground leading-snug">{name}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium flex-shrink-0">
                  {fitScore}/5 Fit
                </span>
              </div>

              {description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
              )}

              <div className="space-y-1.5 pt-2 border-t border-border/40 text-[11px]">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-muted-foreground min-w-[90px] font-mono text-[10px]">
                    Modalities:
                  </span>
                  <span className="text-foreground font-medium truncate">{modality}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-muted-foreground min-w-[90px] font-mono text-[10px]">
                    Target Tasks:
                  </span>
                  <span className="text-foreground truncate">{tasks}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-muted-foreground min-w-[90px] font-mono text-[10px]">
                    Key Metrics:
                  </span>
                  <span className="text-cyan-400 font-mono font-medium truncate">{metrics}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
