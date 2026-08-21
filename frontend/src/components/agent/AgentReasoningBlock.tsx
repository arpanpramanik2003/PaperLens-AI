import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  BrainCircuit,
  Search,
  BookOpen,
  Zap,
  Target,
  Database,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ToolReceipt {
  id?: string;
  tool: string;
  toolName?: string;
  args?: Record<string, any>;
  summary?: string;
  status: "running" | "completed" | "unavailable" | "error";
  durationMs?: number;
  data?: any;
  timestamp?: string;
}

export interface TraceData {
  thoughts: string[];
  activeThought?: string | null;
  receipts: ToolReceipt[];
  isExecuting: boolean;
  startTime?: number;
  totalDurationSec?: number;
}

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  search_papers: Search,
  search_workspace_vector_db: Database,
  analyze_paper: BookOpen,
  detect_gaps: Zap,
  generate_problem: Target,
  find_datasets: Database,
  plan_experiment: FlaskConical,
};

const TOOL_LABELS: Record<string, string> = {
  search_papers: "Literature Search",
  search_workspace_vector_db: "Document Search",
  analyze_paper: "Paper Analysis",
  detect_gaps: "Research Gap Detection",
  generate_problem: "Problem Formulation",
  find_datasets: "Dataset Discovery",
  plan_experiment: "Experiment Planning",
};

interface AgentReasoningBlockProps {
  trace?: TraceData;
  onInspectTool?: (toolName: string) => void;
}

export const AgentReasoningBlock: React.FC<AgentReasoningBlockProps> = ({
  trace,
  onInspectTool,
}) => {
  const [isThinkingOpen, setIsThinkingOpen] = useState(true);
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({});

  if (!trace || (!trace.thoughts.length && !trace.activeThought && !trace.receipts.length)) {
    return null;
  }

  const toggleReceipt = (key: string) => {
    setExpandedReceipts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const thoughts = trace.thoughts || [];
  const activeThought = trace.activeThought;
  const receipts = trace.receipts || [];
  const isExecuting = trace.isExecuting;

  return (
    <div className="space-y-2 my-2 font-sans">
      {/* Collapsible Thinking Accordion */}
      {(thoughts.length > 0 || activeThought) && (
        <div className="rounded-xl border border-border/70 bg-secondary/30 overflow-hidden text-xs transition-all">
          <button
            type="button"
            onClick={() => setIsThinkingOpen(!isThinkingOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-[11px] font-medium"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className={`w-3.5 h-3.5 ${isExecuting ? "text-indigo-400 animate-pulse" : "text-muted-foreground"}`} />
              <span className="font-semibold text-foreground/90">
                {isExecuting ? "Reasoning & Planning..." : "Reasoning Process"}
              </span>
              {trace.totalDurationSec !== undefined && trace.totalDurationSec > 0 && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  ({trace.totalDurationSec.toFixed(1)}s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isExecuting && (
                <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  live
                </span>
              )}
              {isThinkingOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {isThinkingOpen && (
            <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border/40 bg-secondary/10 text-[11px] text-foreground/80 font-mono">
              {thoughts.map((th, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-indigo-400 shrink-0 select-none">›</span>
                  <span className="break-words">{th}</span>
                </div>
              ))}
              {activeThought && isExecuting && (
                <div className="flex items-start gap-2 leading-relaxed text-indigo-300 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />
                  <span className="break-words">{activeThought}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tool-Call Activity Receipts */}
      {receipts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold px-0.5">
            Actions Executed ({receipts.length})
          </div>

          <div className="space-y-1.5">
            {receipts.map((rcpt, idx) => {
              const Icon = TOOL_ICONS[rcpt.tool] || BrainCircuit;
              const title = rcpt.toolName || TOOL_LABELS[rcpt.tool] || rcpt.tool;
              const isExpanded = !!expandedReceipts[`rcpt-${idx}`];
              const isCompleted = rcpt.status === "completed";
              const isRunning = rcpt.status === "running";
              const isUnavailable = rcpt.status === "unavailable";
              const isError = rcpt.status === "error";

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-card p-2.5 text-xs transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg border shrink-0 ${
                          isRunning
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : isUnavailable
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : isError
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isUnavailable || isError ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-[11px] truncate">
                            {title}
                          </span>
                        </div>

                        {rcpt.summary && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                            {rcpt.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {rcpt.durationMs !== undefined && (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {(rcpt.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}

                      {onInspectTool && isCompleted && (
                        <button
                          type="button"
                          onClick={() => onInspectTool(rcpt.tool)}
                          title="Jump to Artifact Card"
                          className="px-2 py-0.5 text-[10px] rounded-md bg-secondary hover:bg-indigo-500/10 hover:text-indigo-300 border border-border/60 text-muted-foreground font-mono transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          Card
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleReceipt(`rcpt-${idx}`)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded receipt details */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border/40 space-y-1.5 text-[10px] font-mono bg-secondary/20 p-2 rounded-lg">
                      {rcpt.args && Object.keys(rcpt.args).length > 0 && (
                        <div>
                          <span className="text-muted-foreground block font-semibold">Inputs:</span>
                          <pre className="text-foreground/90 whitespace-pre-wrap overflow-x-auto max-h-24">
                            {JSON.stringify(rcpt.args, null, 2)}
                          </pre>
                        </div>
                      )}
                      {rcpt.data && (
                        <div>
                          <span className="text-muted-foreground block font-semibold">Output Summary:</span>
                          <pre className="text-foreground/80 whitespace-pre-wrap overflow-x-auto max-h-28">
                            {JSON.stringify(rcpt.data, null, 2).slice(0, 400)}
                            {JSON.stringify(rcpt.data).length > 400 ? "\n..." : ""}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
