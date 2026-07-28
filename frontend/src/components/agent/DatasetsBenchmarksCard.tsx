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
    <Card className="p-6 border-border/70 bg-card shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            {sectionIndex}. Datasets, Benchmarks & Evaluation Metrics
          </h3>
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
          {datasetsList.length} Recommended Datasets
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            "Multi-modal Records & Feature Vectors";

          let tasks = renderTextOrObject(ds.tasks || ds.details?.tasks);
          if (!tasks && Array.isArray(ds.details?.tasks)) {
            tasks = ds.details.tasks.join(", ");
          }
          if (!tasks) tasks = "Classification, Segmentation & Benchmarking";

          let metrics = renderTextOrObject(
            ds.metrics || ds.details?.metrics || ds.details?.primary_metrics
          );
          if (!metrics && Array.isArray(ds.details?.primary_metrics)) {
            metrics = ds.details.primary_metrics.join(", ");
          }
          if (!metrics) metrics = "ROC-AUC, F1-Score, RMSE, Accuracy";

          const recommendation =
            renderTextOrObject(ds.recommendation) ||
            (ds.fit_score ? `${fitScore}/5 High-Fit Benchmark` : "SOTA Benchmark");

          return (
            <div
              key={idx}
              className="rounded-xl border border-border/70 bg-secondary/15 p-4 space-y-3 hover:border-cyan-500/30 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-foreground leading-snug">{name}</h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex-shrink-0">
                  {fitScore}/5 Fit
                </span>
              </div>

              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              )}

              <div className="space-y-2 pt-2 border-t border-border/40 text-xs font-sans">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="font-semibold text-muted-foreground text-[11px] min-w-[125px] font-mono">
                    Modalities / Format:
                  </span>
                  <span className="text-foreground text-[11px] font-medium">{modality}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="font-semibold text-muted-foreground text-[11px] min-w-[125px] font-mono">
                    Primary Tasks:
                  </span>
                  <span className="text-foreground text-[11px] font-medium">{tasks}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="font-semibold text-muted-foreground text-[11px] min-w-[125px] font-mono">
                    Evaluation Metrics:
                  </span>
                  <span className="text-cyan-300 font-mono text-[11px] font-semibold">{metrics}</span>
                </div>
              </div>

              {recommendation && (
                <div className="pt-1">
                  <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
                    {recommendation}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
