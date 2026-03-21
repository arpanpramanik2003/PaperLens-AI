import type { Feature } from "./constants";
import AnimatedWindowCard from "./windows/AnimatedWindowCard";
import DatasetBenchmarkWindow from "./windows/DatasetBenchmarkWindow";
import ExperimentPlannerWindow from "./windows/ExperimentPlannerWindow";
import GapDetectionWindow from "./windows/GapDetectionWindow";
import PaperAnalyzerWindow from "./windows/PaperAnalyzerWindow";
import ProblemGeneratorWindow from "./windows/ProblemGeneratorWindow";
import CitationIntelligenceWindow from "./windows/CitationIntelligenceWindow";

type FeatureDemoWindowProps = {
  feature: Feature;
  index: number;
};

export default function FeatureDemoWindow({ feature, index }: FeatureDemoWindowProps) {
  if (index === 0) return <PaperAnalyzerWindow />;
  if (index === 1) return <ProblemGeneratorWindow />;
  if (index === 2) return <ExperimentPlannerWindow />;
  if (index === 3) return <GapDetectionWindow />;
  if (index === 4) return <DatasetBenchmarkWindow />;
  if (index === 5) return <CitationIntelligenceWindow />;
  return <AnimatedWindowCard feature={feature} index={index} />;
}
