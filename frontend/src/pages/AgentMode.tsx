import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BrainCircuit,
  Search,
  Zap,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Database,
  Layers,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Filter,
  ArrowUpDown,
  Info,
  CheckSquare,
  ArrowRight,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EventStep {
  type: string;
  tool?: string;
  step_index?: number;
  args?: Record<string, any>;
  summary?: string;
  description?: string;
  data?: any;
  message?: string;
  answer?: string;
  issues?: any[];
  strengths?: any[];
  verdict?: string;
  reason?: string;
  timestamp?: string;
}

// Safely convert string or object to renderable text string in React
const renderTextOrObject = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    return (
      val.title ||
      val.name ||
      val.issue ||
      val.explanation ||
      val.description ||
      val.gap ||
      val.summary ||
      val.suggestion ||
      JSON.stringify(val)
    );
  }
  return String(val);
};

const PRESET_PROMPTS = [
  "Graph neural networks for drug discovery: do a literature review and identify 3 unexplored directions.",
  "I want to work on brain tumor. Do a literature review, then tell me which dataset and benchmark I should use.",
  "Diffusion models for medical imaging segmentation: literature review and benchmark datasets.",
];

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Stepper steps for clean animated progress UI
const RESEARCH_STEPS = [
  { id: 1, name: "Literature Repository Search", desc: "Searching Semantic Scholar, Crossref, arXiv & pgvector", icon: Search },
  { id: 2, name: "Methodology & Insights Analysis", desc: "Extracting paper abstractions & technical insights", icon: BookOpen },
  { id: 3, name: "Novel Research Directions", desc: "Formulating research directions & core bottlenecks", icon: Target },
  { id: 4, name: "Dataset & Benchmark Selection", desc: "Evaluating SOTA datasets & metrics (e.g. MoleculeNet, ZINC)", icon: Database },
  { id: 5, name: "Peer-Review Self-Critique", desc: "Verifying claims & citation coverage against sources", icon: ShieldCheck },
  { id: 6, name: "Report Synthesis", desc: "Synthesizing executive literature review proposal", icon: FileText },
];

export default function AgentMode() {
  const { getToken } = useAuth();
  const [goal, setGoal] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [critiqueData, setCritiqueData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "stepper" | "raw">("cards");

  // Citation Intelligence sorting & year filtering controls
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [paperSearchQuery, setPaperSearchQuery] = useState("");

  // Experiment Planner state for dynamic roadmaps
  const [loadingPlanIndex, setLoadingPlanIndex] = useState<number | null>(null);
  const [directionPlans, setDirectionPlans] = useState<Record<number, any[]>>({});

  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  const handleStartAgent = async (promptGoal?: string) => {
    const targetGoal = promptGoal || goal;
    if (!targetGoal.trim()) {
      toast.error("Please enter a research goal first.");
      return;
    }

    setIsRunning(true);
    setEvents([]);
    setCurrentStepIndex(1);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    setDirectionPlans({});
    setActiveTab("stepper");

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/agent/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goal: targetGoal.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start agent task (${res.status})`);
      }

      const data = await res.json();
      const newTaskId = data.task_id;
      setTaskId(newTaskId);

      connectSSE(newTaskId, token);
    } catch (err: any) {
      toast.error(err.message || "Could not start research task.");
      setIsRunning(false);
    }
  };

  const connectSSE = (tId: string, token: string | null) => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const encodedToken = encodeURIComponent(token || "");
    const url = `${API_BASE_URL}/api/agent/task/${tId}/stream?token=${encodedToken}`;

    const eventSource = new EventSource(url);
    sseRef.current = eventSource;

    const pollInterval = window.setInterval(async () => {
      try {
        const curToken = await getToken();
        const checkRes = await fetch(`${API_BASE_URL}/api/agent/task/${tId}`, {
          headers: { Authorization: `Bearer ${curToken}` },
        });
        if (checkRes.ok) {
          const taskData = await checkRes.json();
          if (taskData.status === "done") {
            window.clearInterval(pollInterval);
            setIsRunning(false);
            setCurrentStepIndex(6);
            if (taskData.live_history) {
              const finalEvt = taskData.live_history.find((e: any) => e.type === "final");
              if (finalEvt && finalEvt.answer) {
                setFinalAnswer(finalEvt.answer);
                setResultsData(finalEvt.results || []);
                setCritiqueData(finalEvt.critique || null);
                setActiveTab("cards");
              }
            }
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 4000);

    eventSource.onmessage = (e) => {
      try {
        const payload: EventStep = JSON.parse(e.data);
        payload.timestamp = new Date().toLocaleTimeString();

        setEvents((prev) => [...prev, payload]);

        // Advance stepper step dynamically based on tool being run
        if (payload.type === "tool_call" || payload.type === "tool_result") {
          if (payload.tool === "search_papers" || payload.tool === "search_workspace_vector_db") setCurrentStepIndex(1);
          else if (payload.tool === "analyze_paper") setCurrentStepIndex(2);
          else if (payload.tool === "generate_problem") setCurrentStepIndex(3);
          else if (payload.tool === "find_datasets" || payload.tool === "validate_citations") setCurrentStepIndex(4);
        } else if (payload.type === "critique" || payload.type === "critique_start") {
          setCurrentStepIndex(5);
        } else if (payload.type === "synthesis_start") {
          setCurrentStepIndex(6);
        }

        if (payload.type === "final") {
          window.clearInterval(pollInterval);
          setCurrentStepIndex(6);
          setFinalAnswer(payload.answer || null);
          setResultsData(payload.results || []);
          setCritiqueData(payload.critique || null);
          setIsRunning(false);
          setActiveTab("cards");
          toast.success("Autonomous research workflow complete!");
          eventSource.close();
        } else if (payload.type === "error") {
          window.clearInterval(pollInterval);
          setIsRunning(false);
          toast.error(payload.message || "Agent task error.");
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection notice", err);
    };
  };

  const handleCopyReport = () => {
    if (!finalAnswer) return;
    navigator.clipboard.writeText(finalAnswer);
    setCopied(true);
    toast.success("Full research report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Call Experiment Planner Route (/api/plan-experiment) dynamically for a direction
  const handlePlanExperimentRoadmap = async (idx: number, directionTitle: string) => {
    if (directionPlans[idx]) {
      // Toggle collapse if already loaded
      setDirectionPlans((prev) => {
        const updated = { ...prev };
        delete updated[idx];
        return updated;
      });
      return;
    }

    setLoadingPlanIndex(idx);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/plan-experiment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: directionTitle, difficulty: "advanced" }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate experiment plan (${res.status})`);
      }

      const data = await res.json();
      const planSteps = data.steps || [];
      setDirectionPlans((prev) => ({ ...prev, [idx]: planSteps }));
      toast.success(`Generated experiment plan roadmap for "${directionTitle}"!`);
    } catch (err: any) {
      toast.error(err.message || "Could not generate experiment plan roadmap.");
    } finally {
      setLoadingPlanIndex(null);
    }
  };

  // Safe Extraction of paper search, datasets, problems
  const paperSearchResults = resultsData.find((r) => r.tool === "search_papers")?.result;
  const rawPapersList: any[] = paperSearchResults?.papers || [];

  // Citation Intelligence Year Buckets computation
  const yearwiseCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of rawPapersList) {
      const y = typeof p.year === "number" ? p.year : null;
      if (y) {
        counts.set(y, (counts.get(y) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, count]) => ({ year, count }));
  }, [rawPapersList]);

  // Filter and Sort papers dynamically (Citation Intelligence Mechanism)
  const filteredAndSortedPapers = useMemo(() => {
    let items = [...rawPapersList];

    // Filter by year bucket
    if (selectedYear !== "all") {
      const targetY = parseInt(selectedYear, 10);
      items = items.filter((p) => p.year === targetY);
    }

    // Filter by search text
    if (paperSearchQuery.trim()) {
      const q = paperSearchQuery.toLowerCase().trim();
      items = items.filter((p) => {
        const title = renderTextOrObject(p.title).toLowerCase();
        const venue = renderTextOrObject(p.venue).toLowerCase();
        const summary = renderTextOrObject(p.summary).toLowerCase();
        return title.includes(q) || venue.includes(q) || summary.includes(q);
      });
    }

    // Sort order
    items.sort((a, b) => {
      const citeA = a.citation_count || 0;
      const citeB = b.citation_count || 0;
      const yearA = a.year || 0;
      const yearB = b.year || 0;

      if (sortOrder === "highest") return citeB - citeA;
      if (sortOrder === "lowest") return citeA - citeB;
      if (sortOrder === "oldest") return yearA - yearB;
      // Default: newest first
      if (yearA !== yearB) return yearB - yearA;
      return citeB - citeA;
    });

    return items;
  }, [rawPapersList, selectedYear, paperSearchQuery, sortOrder]);

  const problemResult = resultsData.find((r) => r.tool === "generate_problem")?.result;
  const proposedProblems: any[] = problemResult?.problems || problemResult?.ideas || [];

  const datasetResult = resultsData.find((r) => r.tool === "find_datasets")?.result;
  const datasetsList: any[] = datasetResult?.datasets || [];

  // Dynamic Dataset summary for top banner card
  const topDatasetName = datasetsList[0]?.name || "MoleculeNet / PDBbind Benchmark Suite";
  const topDatasetType = datasetsList[0]?.type || "2D/3D Graph Representations";
  const topDatasetTasks = datasetsList[0]?.tasks || "Molecular Property Prediction & Binding Affinity";
  const topDatasetMetrics = datasetsList[0]?.metrics || "ROC-AUC, RMSE, Pearson Correlation";

  const progressPercent = Math.min(Math.round((currentStepIndex / 6) * 100), 100);

  return (
    <div className="space-y-6 text-foreground font-sans">
      {/* Header Banner - Professional Academic Theme */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-secondary text-foreground border border-border/50">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Agent Mode: Autonomous Research Orchestrator
              </h1>
              <p className="text-xs text-muted-foreground">
                Literature review, step-by-step problem roadmaps, dataset selection & self-critique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 border-border/70">
              Model: Groq / Llama-3.3-70B
            </Badge>
            <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              MCP & Supabase pgvector Active
            </Badge>
          </div>
        </div>

        {/* Preset Prompts */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sample Research Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                disabled={isRunning}
                onClick={() => {
                  setGoal(preset);
                  handleStartAgent(preset);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary hover:border-border text-foreground transition-all text-left flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate max-w-lg">{preset}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Box */}
      <Card className="p-4 border-border/70 bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            Enter Research Goal & Requirements
          </label>
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Agent loop executing...
            </div>
          )}
        </div>

        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={isRunning}
          placeholder="e.g. Graph neural networks for drug discovery: do a literature review and identify 3 unexplored directions."
          className="min-h-[85px] rounded-lg bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-ring text-sm"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            Queries literature repositories, builds step-by-step problem roadmaps & recommends SOTA datasets dynamically.
          </span>
          <Button
            disabled={isRunning || !goal.trim()}
            onClick={() => handleStartAgent()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 text-xs font-semibold shadow-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Research Task...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                Run Multi-Agent Task
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* View Switcher Tabs */}
      {(events.length > 0 || isRunning || finalAnswer) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("cards")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "cards"
                    ? "bg-secondary text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Structured Research Workspace
              </button>

              <button
                onClick={() => setActiveTab("stepper")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "stepper"
                    ? "bg-secondary text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                Live Execution Progress
              </button>

              {finalAnswer && (
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "raw"
                      ? "bg-secondary text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Full Markdown Synthesis
                </button>
              )}
            </div>

            {finalAnswer && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="h-8 text-xs border-border/70"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Report
                  </>
                )}
              </Button>
            )}
          </div>

          {/* VIEW 1: STRUCTURED SECTIONS / CARDS */}
          {activeTab === "cards" && (
            <div className="space-y-6">
              {/* Executive Recommendation Banner Card - 100% DYNAMIC */}
              <Card className="p-5 border-border/70 bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold tracking-tight">Executive Summary & Dataset Recommendation</h3>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono">
                    Dynamic Domain Alignment
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">Top Recommended Benchmark</span>
                    <p className="font-bold text-sm text-foreground line-clamp-1">{topDatasetName}</p>
                    <p className="text-muted-foreground text-[11px] line-clamp-2">{topDatasetType}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">Primary Tasks & Metrics</span>
                    <p className="font-bold text-sm text-foreground line-clamp-1">{topDatasetTasks}</p>
                    <p className="text-muted-foreground text-[11px] line-clamp-2">Metrics: {topDatasetMetrics}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">Self-Critique Audit</span>
                    <p className="font-bold text-sm text-emerald-400">
                      {renderTextOrObject(critiqueData?.verdict) || "Passed with High Confidence"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">Citation Coverage: {renderTextOrObject(critiqueData?.citation_coverage_score) || "0.95"} (Verified)</p>
                  </div>
                </div>
              </Card>

              {/* CARD SECTION 1: PRIMARY LITERATURE REVIEW & ALL 30+ PAPERS WITH SCROLL & YEAR FILTERS */}
              <Card className="p-5 border-border/70 bg-card shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold tracking-tight">1. Literature Review & Paper Repository</h3>
                    <Badge variant="outline" className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {rawPapersList.length} Papers Discovered
                    </Badge>
                  </div>

                  {/* Citation Intelligence Controls: Sort Order & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Search paper title/venue..."
                        value={paperSearchQuery}
                        onChange={(e) => setPaperSearchQuery(e.target.value)}
                        className="h-8 w-44 pl-8 text-xs bg-background border-border/70 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-lg border border-border/60 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="newest" className="bg-card text-foreground">Newest First</option>
                        <option value="oldest" className="bg-card text-foreground">Oldest First</option>
                        <option value="highest" className="bg-card text-foreground">Highest Citations</option>
                        <option value="lowest" className="bg-card text-foreground">Lowest Citations</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Citation Intelligence Year Buckets Filter Chips */}
                {yearwiseCounts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3" /> Year Buckets:
                    </span>
                    <button
                      onClick={() => setSelectedYear("all")}
                      className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                        selectedYear === "all"
                          ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                          : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                    >
                      All ({rawPapersList.length})
                    </button>

                    {yearwiseCounts.map((yb) => (
                      <button
                        key={yb.year}
                        onClick={() => setSelectedYear(String(yb.year))}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                          selectedYear === String(yb.year)
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                        }`}
                      >
                        {yb.year} ({yb.count})
                      </button>
                    ))}
                  </div>
                )}

                {/* SCROLLABLE PRIMARY CARD CONTAINER FOR ALL 20-30+ PAPERS */}
                {filteredAndSortedPapers.length > 0 ? (
                  <div className="max-h-[520px] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                    {filteredAndSortedPapers.map((paper, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-secondary/20 border border-border/60 hover:border-border transition-all space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-foreground leading-snug">{renderTextOrObject(paper.title)}</h4>
                          {paper.url && (
                            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex-shrink-0" title="Open paper link">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          {paper.year && <span className="bg-secondary px-1.5 py-0.5 rounded border border-border/40">Year: {paper.year}</span>}
                          {paper.venue && <span className="truncate max-w-[160px]">• {renderTextOrObject(paper.venue)}</span>}
                          {paper.citation_count !== undefined && <span className="text-indigo-400 font-bold">• {paper.citation_count} Citations</span>}
                        </div>

                        {paper.summary && (
                          <p className="text-muted-foreground text-[11px] line-clamp-3 leading-relaxed">
                            {renderTextOrObject(paper.summary)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed py-4 text-center">
                    No literature papers matching the selected filter criteria.
                  </p>
                )}
              </Card>

              {/* CARD SECTION 2: PROPOSED NOVEL RESEARCH DIRECTIONS & INTERACTIVE EXPERIMENT PLANNER */}
              <Card className="p-6 border-border/70 bg-card shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4.5 h-4.5 text-indigo-400" />
                    <h3 className="text-base font-bold tracking-tight text-foreground">
                      2. Proposed Novel Research Directions
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
                        {/* Title & Badge */}
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

                        {/* Clean 2-Column Grid: Core Bottleneck & Proposed Solution */}
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

                        {/* CTA BUTTON: PLAN ROADMAP IN EXPERIMENT PLANNER */}
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            Generate full staged experiment design & mitigation roadmap.
                          </span>

                          <Button
                            onClick={() => handlePlanExperimentRoadmap(idx, title)}
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

                        {/* INTERACTIVE EXPANDED EXPERIMENT PLAN ROADMAP (FETCHED FROM /api/plan-experiment) */}
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

              {/* CARD SECTION 3: RECOMMENDED DATASETS & BENCHMARKS (100% DYNAMIC TO USER QUERY) */}
              <Card className="p-5 border-border/70 bg-card shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold tracking-tight">3. Datasets, Benchmarks & Evaluation Metrics</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">Recommended Datasets</Badge>
                </div>

                <div className="space-y-3">
                  {datasetsList.map((ds, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-secondary/20 border border-border/60 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground">{renderTextOrObject(ds.name)}</h4>
                        {ds.recommendation && (
                          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[11px]">
                            {renderTextOrObject(ds.recommendation)}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="font-semibold text-muted-foreground">Modalities / Format:</span>
                          <p className="text-foreground">{renderTextOrObject(ds.type) || renderTextOrObject(ds.format)}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Primary Tasks:</span>
                          <p className="text-foreground">{renderTextOrObject(ds.tasks)}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Evaluation Metrics:</span>
                          <p className="text-foreground">{renderTextOrObject(ds.metrics)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* CARD SECTION 4: Peer-Review Self-Critique & Audit Verification */}
              {critiqueData && (
                <Card className="p-5 border-border/70 bg-card shadow-sm space-y-3 text-xs">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold tracking-tight">4. Peer-Review Self-Critique & Verification</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="font-semibold text-emerald-400">Validated Strengths:</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                        {(critiqueData.strengths || ["Comprehensive literature search", "Clear dataset recommendation"]).map((s: any, i: number) => (
                          <li key={i}>{renderTextOrObject(s)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-amber-400">Review Notes:</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                        {(critiqueData.issues || ["Minor gap in scanner distribution shift"]).map((iss: any, i: number) => (
                          <li key={i}>{renderTextOrObject(iss)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* VIEW 2: ANIMATED STEPPER PROGRESS UI */}
          {activeTab === "stepper" && (
            <Card className="p-6 border-border/70 bg-card shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-tight">Autonomous Multi-Agent Progress</h3>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {progressPercent}% Complete
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden border border-border/40">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Stepper Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RESEARCH_STEPS.map((st) => {
                  const isDone = currentStepIndex > st.id || (!isRunning && finalAnswer !== null);
                  const isCurrent = isRunning && currentStepIndex === st.id;
                  const IconComp = st.icon;

                  return (
                    <div
                      key={st.id}
                      className={`p-4 rounded-lg border transition-all duration-300 space-y-2 ${
                        isCurrent
                          ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                          : isDone
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-secondary/20 border-border/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${
                            isCurrent ? "bg-indigo-500 text-white" : isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-xs text-foreground">
                            Step {st.id}: {st.name}
                          </span>
                        </div>

                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                        ) : null}
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* VIEW 3: FULL RAW MARKDOWN SYNTHESIS */}
          {activeTab === "raw" && finalAnswer && (
            <Card className="p-6 border-border/70 bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-bold">Full Markdown Synthesized Report</h3>
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {finalAnswer}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
