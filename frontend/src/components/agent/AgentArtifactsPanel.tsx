import React, { useState } from "react";
import {
  Layers,
  FileText,
  Code2,
  Copy,
  Check,
  Download,
  BrainCircuit,
  Search,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CardProvenanceBadge } from "./CardProvenanceBadge";
import { LiteratureReviewCard } from "./LiteratureReviewCard";
import { ResearchGapsCard } from "./ResearchGapsCard";
import { ProposedDirectionsCard } from "./ProposedDirectionsCard";
import { DatasetsBenchmarksCard } from "./DatasetsBenchmarksCard";
import { ExperimentPlanCard } from "./ExperimentPlanCard";
import { SelfCritiqueCard } from "./SelfCritiqueCard";

interface AgentArtifactsPanelProps {
  isRunning: boolean;
  finalAnswer: string | null;
  resultsData: any[];
  critiqueData: any | null;
  highlightedCard: string | null;
  activeTab: "artifacts" | "report" | "json";
  setActiveTab: (tab: "artifacts" | "report" | "json") => void;
  onCopyReport: () => void;
  onDownloadReport: () => void;
  copied: boolean;
  renderTextOrObject: (val: any) => string;
  isOtherCollapsed?: boolean;
  onMaximize?: () => void;
  onResetSplit?: () => void;
}

const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold mt-5 mb-2.5 text-foreground border-b border-border/50 pb-1.5" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-base font-semibold mt-4 mb-2 text-indigo-400" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-foreground" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-2.5 leading-relaxed text-foreground/90 text-xs" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-3 space-y-1 text-xs" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-xs text-foreground/90" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-foreground/90 leading-relaxed" {...props} />,
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border/70 bg-card text-xs">
      <table className="w-full text-left border-collapse text-xs" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-secondary/70 text-foreground font-mono border-b border-border/60" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-border/40 text-foreground/90" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-secondary/40 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-2.5 font-semibold text-[11px] border-r border-border/30 last:border-r-0" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-2.5 align-top leading-relaxed text-xs border-r border-border/30 last:border-r-0" {...props} />,
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-secondary text-indigo-300 font-mono text-[11px]" {...props} />
    ) : (
      <code className="block p-2.5 rounded-lg bg-secondary/80 text-foreground font-mono text-xs overflow-x-auto my-2 border border-border/60" {...props} />
    ),
};

const normalizeMarkdown = (value: string) => {
  if (!value) return "";
  let norm = value.replace(/\r\n/g, "\n");
  norm = norm.replace(/\|\s*\|\s*(?=[A-Za-z0-9\-–\s—\[\*\<])/g, "|\n|");
  norm = norm.replace(/([^\n])\s*(#{1,6})(?!#)\s*/g, "$1\n\n$2 ");
  norm = norm.replace(/^(\s*#{1,6})([^\s#])/gm, "$1 $2");
  return norm;
};

export const AgentArtifactsPanel: React.FC<AgentArtifactsPanelProps> = ({
  isRunning,
  finalAnswer,
  resultsData,
  critiqueData,
  highlightedCard,
  activeTab,
  setActiveTab,
  onCopyReport,
  onDownloadReport,
  copied,
  renderTextOrObject,
  isOtherCollapsed = false,
  onMaximize,
  onResetSplit,
}) => {
  // Paper Search & Sort State for Literature Card
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  return (
    <Card className="h-full w-full flex flex-col min-h-0 border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      {/* Panel Header & Tab Navigation */}
      <div className="p-2.5 sm:p-3 border-b border-border/50 bg-secondary/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-foreground">Artifacts & Findings</span>
          {isRunning && (
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 animate-pulse">
              Streaming...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Clean View Tabs: Artifacts | Executive Report | JSON */}
          <div className="flex items-center gap-0.5 bg-secondary/50 p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("artifacts")}
              className={`px-2 py-0.5 rounded-md transition-all text-xs font-medium ${
                activeTab === "artifacts"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Artifacts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`px-2 py-0.5 rounded-md transition-all text-xs font-medium ${
                activeTab === "report"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Executive Report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`px-2 py-0.5 rounded-md transition-all text-xs font-medium ${
                activeTab === "json"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              JSON
            </button>
          </div>

          {/* Minimize / Maximize Layout Controls */}
          {(onMaximize || onResetSplit) && (
            <div className="hidden lg:flex items-center gap-0.5 bg-secondary/60 border border-border/60 rounded-md p-0.5 ml-0.5">
              {onMaximize && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-background/80"
                  title={isOtherCollapsed ? "Restore 50/50 split view" : "Maximize artifacts panel"}
                  onClick={onMaximize}
                >
                  {isOtherCollapsed ? <Minimize2 className="w-3 h-3 text-indigo-400" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
              )}
              {onResetSplit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-background/80"
                  title="Reset split view (50% / 50%)"
                  onClick={onResetSplit}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Scroll Area: Takes all remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 font-sans">
        {/* TAB 1: Structured Research Artifacts */}
        {activeTab === "artifacts" && (
          <div className="space-y-3.5">
            {!finalAnswer && !isRunning && resultsData.length === 0 && (
              <div className="h-[420px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                <BrainCircuit className="w-8 h-8 text-muted-foreground/30" />
                <h3 className="text-xs font-semibold text-foreground">No Research Artifacts Yet</h3>
                <p className="text-xs max-w-sm leading-relaxed text-muted-foreground">
                  Send a research query or upload a paper on the left. The agent will discover literature, detect gaps, formulate directions, and recommend benchmarks here.
                </p>
              </div>
            )}

            {/* Render Cards Dynamically */}
            {resultsData.map((item, idx) => {
              const toolName = item.tool;
              const res = item.result || {};
              const isHighlighted = highlightedCard === toolName;

              if (toolName === "search_papers") {
                const papers = res.papers || res.top_papers || [];
                if (!papers.length) return null;
                return (
                  <div
                    id={`card-${toolName}`}
                    key={idx}
                    className={`space-y-1.5 transition-all duration-300 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-xl" : ""}`}
                  >
                    <CardProvenanceBadge
                      toolName={toolName}
                      qualitySignal="Verified Academic Sources"
                    />
                    <LiteratureReviewCard
                      papers={papers}
                      filteredPapers={papers}
                      paperSearchQuery={paperSearchQuery}
                      setPaperSearchQuery={setPaperSearchQuery}
                      sortOrder={sortOrder}
                      setSortOrder={setSortOrder}
                      selectedYear={selectedYear}
                      setSelectedYear={setSelectedYear}
                      yearwiseCounts={[]}
                      renderTextOrObject={renderTextOrObject}
                      sectionIndex={idx + 1}
                    />
                  </div>
                );
              }

              if (toolName === "detect_gaps") {
                const gaps = res.gaps || [];
                if (!gaps.length) return null;
                return (
                  <div
                    id={`card-${toolName}`}
                    key={idx}
                    className={`space-y-1.5 transition-all duration-300 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-xl" : ""}`}
                  >
                    <CardProvenanceBadge
                      toolName={toolName}
                      qualitySignal="Critical Gap Analysis"
                    />
                    <ResearchGapsCard
                      gaps={gaps}
                      renderTextOrObject={renderTextOrObject}
                      sectionIndex={idx + 1}
                    />
                  </div>
                );
              }

              if (toolName === "generate_problem") {
                const problems = res.problems || res.problem_statements || res.ideas || [];
                if (!problems.length) return null;
                return (
                  <div
                    id={`card-${toolName}`}
                    key={idx}
                    className={`space-y-1.5 transition-all duration-300 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-xl" : ""}`}
                  >
                    <CardProvenanceBadge
                      toolName={toolName}
                      qualitySignal="Targeted Problem Formulations"
                    />
                    <ProposedDirectionsCard
                      proposedProblems={problems}
                      problems={problems}
                      renderTextOrObject={renderTextOrObject}
                      sectionIndex={idx + 1}
                    />
                  </div>
                );
              }

              if (toolName === "find_datasets") {
                const datasets = res.datasets || [];
                if (!datasets.length) return null;
                return (
                  <div
                    id={`card-${toolName}`}
                    key={idx}
                    className={`space-y-1.5 transition-all duration-300 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-xl" : ""}`}
                  >
                    <CardProvenanceBadge
                      toolName={toolName}
                      qualitySignal="SOTA Benchmarks"
                    />
                    <DatasetsBenchmarksCard
                      datasetsList={datasets}
                      renderTextOrObject={renderTextOrObject}
                      sectionIndex={idx + 1}
                    />
                  </div>
                );
              }

              if (toolName === "plan_experiment") {
                const steps = res.steps || res.stages || [];
                if (!steps.length) return null;
                return (
                  <div
                    id={`card-${toolName}`}
                    key={idx}
                    className={`space-y-1.5 transition-all duration-300 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-xl" : ""}`}
                  >
                    <CardProvenanceBadge
                      toolName={toolName}
                      qualitySignal="Multi-Stage Roadmap"
                    />
                    <ExperimentPlanCard
                      steps={steps}
                      renderTextOrObject={renderTextOrObject}
                      sectionIndex={idx + 1}
                    />
                  </div>
                );
              }

              return null;
            })}

            {/* Quality Audit Card */}
            {critiqueData && (
              <div className="space-y-1.5">
                <CardProvenanceBadge
                  toolName="synthesize_and_verify"
                  qualitySignal={critiqueData.verdict || "Audited"}
                />
                <SelfCritiqueCard
                  critiqueData={critiqueData}
                  renderTextOrObject={renderTextOrObject}
                  sectionIndex={resultsData.length + 1}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Full Synthesized Executive Report */}
        {activeTab === "report" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-semibold text-foreground">Synthesized Research Document</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyReport}
                  className="h-7 text-xs rounded-md gap-1 border-border/60"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  {copied ? "Copied" : "Copy Markdown"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadReport}
                  className="h-7 text-xs rounded-md gap-1 border-border/60"
                >
                  <Download className="w-3 h-3 text-muted-foreground" />
                  Download .md
                </Button>
              </div>
            </div>

            {finalAnswer ? (
              <div className="p-4 rounded-xl border border-border/70 bg-card text-foreground text-xs leading-relaxed shadow-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {normalizeMarkdown(finalAnswer)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-16">
                Executive report will be generated upon completion of research tasks.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: Raw JSON Data */}
        {activeTab === "json" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2 border-b border-border/50">
              <span>Structured Findings ({resultsData.length} records)</span>
            </div>
            <pre className="p-3 rounded-lg border border-border/60 bg-secondary/20 text-foreground font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed">
              {JSON.stringify(resultsData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};
