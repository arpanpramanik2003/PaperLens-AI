import { lazy, Suspense } from "react";
import type { Feature } from "./constants";

const PaperAnalyzerWindow = lazy(() => import("./windows/PaperAnalyzerWindow"));
const ProblemGeneratorWindow = lazy(() => import("./windows/ProblemGeneratorWindow"));
const ExperimentPlannerWindow = lazy(() => import("./windows/ExperimentPlannerWindow"));
const GapDetectionWindow = lazy(() => import("./windows/GapDetectionWindow"));
const DatasetBenchmarkWindow = lazy(() => import("./windows/DatasetBenchmarkWindow"));
const CitationIntelligenceWindow = lazy(() => import("./windows/CitationIntelligenceWindow"));
const AnimatedWindowCard = lazy(() => import("./windows/AnimatedWindowCard"));

type FeatureDemoWindowProps = {
  feature: Feature;
  index: number;
};

function FeatureWindowSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden animate-pulse">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-muted" />
          <div className="w-2.5 h-2.5 rounded-full bg-muted" />
          <div className="w-2.5 h-2.5 rounded-full bg-muted" />
        </div>
        <div className="w-32 h-3 bg-muted rounded ml-2" />
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="w-24 h-4 bg-muted rounded" />
        <div className="w-full h-16 bg-muted/40 rounded-lg" />
        <div className="w-3/4 h-8 bg-muted/30 rounded" />
        <div className="w-1/2 h-8 bg-muted/20 rounded" />
      </div>
    </div>
  );
}

export default function FeatureDemoWindow({ feature, index }: FeatureDemoWindowProps) {
  return (
    <Suspense fallback={<FeatureWindowSkeleton />}>
      {index === 0 && <PaperAnalyzerWindow />}
      {index === 1 && <ProblemGeneratorWindow />}
      {index === 2 && <ExperimentPlannerWindow />}
      {index === 3 && <GapDetectionWindow />}
      {index === 4 && <DatasetBenchmarkWindow />}
      {index === 5 && <CitationIntelligenceWindow />}
      {index > 5 && <AnimatedWindowCard feature={feature} index={index} />}
    </Suspense>
  );
}
