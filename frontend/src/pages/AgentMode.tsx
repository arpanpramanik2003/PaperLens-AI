import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  BrainCircuit,
  FileText,
  Search,
  BookOpen,
  Target,
  Database,
  ShieldCheck,
  Zap,
  FlaskConical,
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  Trash2,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  UploadCloud,
  X,
  RefreshCw,
  Layers,
  Code2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AgentHeaderBanner } from "@/components/agent/AgentHeaderBanner";
import { AgentStepperView, StepItem } from "@/components/agent/AgentStepperView";
import { AgentInlineTrace, TraceData, ToolReceipt } from "@/components/agent/AgentInlineTrace";
import { CardProvenanceBadge } from "@/components/agent/CardProvenanceBadge";
import { LiteratureReviewCard } from "@/components/agent/LiteratureReviewCard";
import { ProposedDirectionsCard } from "@/components/agent/ProposedDirectionsCard";
import { ExperimentPlanCard } from "@/components/agent/ExperimentPlanCard";
import { DatasetsBenchmarksCard } from "@/components/agent/DatasetsBenchmarksCard";
import { SelfCritiqueCard } from "@/components/agent/SelfCritiqueCard";

const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground border-b border-border/50 pb-2" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mt-5 mb-2.5 text-indigo-400" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-foreground" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-3 leading-relaxed text-foreground/90 text-xs" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-xs" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-xs text-foreground/90" {...props} />,
  li: ({ node, ...props }: any) => <li className="text-foreground/90 leading-relaxed" {...props} />,
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-border/80 bg-card/90 shadow-xl backdrop-blur-xl">
      <table className="w-full text-left border-collapse text-xs" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-secondary/80 text-indigo-400 font-mono border-b border-border/60" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-border/40 text-foreground/90" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-indigo-500/5 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-3 font-bold uppercase tracking-wider text-[11px] border-r border-border/30 last:border-r-0" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-3 align-top leading-relaxed text-xs border-r border-border/30 last:border-r-0" {...props} />,
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-secondary text-indigo-300 font-mono text-[11px]" {...props} />
    ) : (
      <code className="block p-3 rounded-xl bg-secondary/80 text-foreground font-mono text-xs overflow-x-auto my-3 border border-border/60" {...props} />
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

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text?: string;
  timestamp: string;
  paperInfo?: { filename: string; pages: number };
  task_id?: string;
  trace?: TraceData;
}

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

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const TOOL_META: Record<string, { name: string; desc: string; icon: any }> = {
  search_papers: { name: "Literature Repository Search", desc: "Searching academic publication repositories", icon: Search },
  search_workspace_vector_db: { name: "Workspace Paper Index", desc: "Searching indexed papers in workspace", icon: Database },
  analyze_paper: { name: "Paper Analysis", desc: "Extracting methodology and key assertions", icon: BookOpen },
  detect_gaps: { name: "Research Gap Detection", desc: "Identifying unexplored research gaps & limitations", icon: Zap },
  generate_problem: { name: "Novel Research Directions", desc: "Formulating research directions & core bottlenecks", icon: Target },
  find_datasets: { name: "Dataset & Benchmark Selection", desc: "Evaluating SOTA datasets & metrics", icon: Database },
  plan_experiment: { name: "Experimental Roadmap Design", desc: "Designing multi-stage experimental execution roadmap", icon: FlaskConical },
};

const PROMPT_SUGGESTIONS = [
  "Find out research gaps and limitations in my uploaded paper",
  "Formulate novel problem statements and research directions for Breast cancer detection",
  "Recommend SOTA datasets and benchmarks for GNN molecular property prediction",
  "Design a multi-stage experimental execution roadmap for medical image segmentation",
];

export default function AgentMode() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Multi-Turn Session State
  const [sessionId, setSessionId] = useState<string>(() => {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  });

  const [inputQuery, setInputQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: "Welcome to **PaperLens Autonomous Agent Workbench**!\n\nAsk research questions, compare datasets, design experimental roadmaps, or attach a PDF paper to detect unexplored research gaps.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Paper Upload Context State
  const [activePaper, setActivePaper] = useState<{ id: string; filename: string; pages: number } | null>(null);
  const [isUploadingPaper, setIsUploadingPaper] = useState(false);

  // Agent Task & Inspector State
  const [isRunning, setIsRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventStep[]>([]);
  const [dynamicSteps, setDynamicSteps] = useState<StepItem[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [critiqueData, setCritiqueData] = useState<any | null>(null);
  const [latestThought, setLatestThought] = useState<string | null>(null);
  const [memorySummary, setMemorySummary] = useState<string | null>(null);
  const [activeExecutingTool, setActiveExecutingTool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"artifacts" | "report" | "trace" | "json">("artifacts");
  const [copied, setCopied] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  // Paper Search / Filter State for Literature Review Card
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const sseRef = useRef<EventSource | null>(null);
  const taskStartTimeRef = useRef<number>(0);

  const handleNewSession = () => {
    if (isRunning) return;
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
    setSessionId(newId);
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "agent",
        text: "Started a fresh research session! Ask me about datasets, literature, problem formulations, or attach a new paper.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setEvents([]);
    setDynamicSteps([]);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    setLatestThought(null);
    setMemorySummary(null);
    setActiveExecutingTool(null);
    toast.success("New research session initialized.");
  };

  // Only scroll the internal chat container when a message is added (never window/page scroll)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file (.pdf)");
      return;
    }

    setIsUploadingPaper(true);
    toast.loading("Uploading and indexing paper for Agent Mode...", { id: "upload-paper" });

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/agent/upload-paper`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      const data = await res.json();
      setActivePaper({
        id: data.paper_id,
        filename: data.filename,
        pages: data.total_pages || 1,
      });

      toast.success(`Paper '${data.filename}' indexed for Agent Mode!`, { id: "upload-paper" });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `paper-${Date.now()}`,
          sender: "agent",
          text: `Paper **${data.filename}** (${data.total_pages} pages) attached to context. Ask me to detect gaps, search text, or formulate problem statements!`,
          timestamp: new Date().toLocaleTimeString(),
          paperInfo: { filename: data.filename, pages: data.total_pages },
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload paper.", { id: "upload-paper" });
    } finally {
      setIsUploadingPaper(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (promptGoal?: string) => {
    const textGoal = promptGoal || inputQuery;
    if (!textGoal.trim()) {
      toast.error("Please enter a research prompt.");
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now() + 1}`;
    const startTime = Date.now();
    taskStartTimeRef.current = startTime;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textGoal.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const initialAgentMsg: ChatMessage = {
      id: agentMsgId,
      sender: "agent",
      text: "",
      timestamp: new Date().toLocaleTimeString(),
      trace: {
        thoughts: [],
        activeThought: "Analyzing user intent and selecting optimal research tools...",
        receipts: [],
        isExecuting: true,
        startTime,
      },
    };

    const priorHistory = chatMessages.slice(-4).map((m) => ({
      role: m.sender,
      text: m.text || "",
    }));

    setChatMessages((prev) => [...prev, userMsg, initialAgentMsg]);
    setInputQuery("");
    setIsRunning(true);

    setEvents([]);
    setDynamicSteps([]);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    setLatestThought(null);
    setMemorySummary(null);
    setActiveExecutingTool(null);
    setActiveTab("artifacts");

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/agent/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal: textGoal.trim(),
          paper_id: activePaper?.id || null,
          session_id: sessionId,
          conversation_history: priorHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize agent task (${res.status})`);
      }

      const data = await res.json();
      const newTaskId = data.task_id;
      setTaskId(newTaskId);

      connectSSE(newTaskId, agentMsgId, token);
    } catch (err: any) {
      toast.error(err.message || "Could not launch agent task.");
      setIsRunning(false);
    }
  };

  const connectSSE = (tId: string, agentMsgId: string, token: string | null) => {
    if (sseRef.current) sseRef.current.close();

    const encodedToken = encodeURIComponent(token || "");
    const url = `${API_BASE_URL}/api/agent/task/${tId}/stream?token=${encodedToken}`;
    const eventSource = new EventSource(url);
    sseRef.current = eventSource;

    const toolStartTimes: Record<string, number> = {};

    eventSource.onmessage = (e) => {
      try {
        const payload: EventStep = JSON.parse(e.data);
        payload.timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [...prev, payload]);

        // Real-time Chat Inline Trace Updates
        setChatMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== agentMsgId) return msg;

            const curTrace = msg.trace || {
              thoughts: [],
              receipts: [],
              isExecuting: true,
              startTime: taskStartTimeRef.current,
            };

            if (payload.type === "thought") {
              const th = (payload as any).thought;
              setLatestThought(th);
              return {
                ...msg,
                trace: {
                  ...curTrace,
                  thoughts: th ? [...curTrace.thoughts, th] : curTrace.thoughts,
                  activeThought: th,
                },
              };
            }

            if (payload.type === "action" && payload.tool) {
              const toolName = payload.tool;
              toolStartTimes[toolName] = Date.now();
              const tMeta = TOOL_META[toolName];
              setActiveExecutingTool(tMeta?.name || toolName);

              const newReceipt: ToolReceipt = {
                id: `rcpt-${Date.now()}`,
                tool: toolName,
                toolName: tMeta?.name || toolName,
                args: payload.args,
                summary: payload.description || `Executing ${toolName}`,
                status: "running",
                timestamp: new Date().toLocaleTimeString(),
              };

              return {
                ...msg,
                trace: {
                  ...curTrace,
                  activeThought: `Executing ${tMeta?.name || toolName}...`,
                  receipts: [...curTrace.receipts.filter((r) => r.tool !== toolName), newReceipt],
                },
              };
            }

            if (payload.type === "observation" && payload.tool) {
              const toolName = payload.tool;
              const startTime = toolStartTimes[toolName] || Date.now();
              const durationMs = Date.now() - startTime;
              const isUnavail = (payload.data as any)?.status === "unavailable";

              return {
                ...msg,
                trace: {
                  ...curTrace,
                  receipts: curTrace.receipts.map((r) => {
                    if (r.tool === toolName) {
                      return {
                        ...r,
                        status: isUnavail ? "unavailable" : "completed",
                        summary: payload.summary || r.summary,
                        data: payload.data,
                        durationMs,
                      };
                    }
                    return r;
                  }),
                },
              };
            }

            if (payload.type === "memory_update") {
              setMemorySummary((payload as any).active_memory_summary || null);
            }

            if (payload.type === "final" || payload.type === "error") {
              setIsRunning(false);
              setActiveExecutingTool(null);
              setFinalAnswer(payload.answer || null);
              setResultsData(payload.results || []);
              setCritiqueData((payload as any).critique || null);

              const totalDurationSec = (Date.now() - (curTrace.startTime || Date.now())) / 1000;

              return {
                ...msg,
                text: payload.answer || "Agent task completed.",
                task_id: tId,
                trace: {
                  ...curTrace,
                  activeThought: null,
                  isExecuting: false,
                  totalDurationSec,
                },
              };
            }

            return msg;
          })
        );
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };
  };

  const handleStopAgent = async () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setIsRunning(false);
    if (taskId) {
      try {
        const token = await getToken();
        await fetch(`${API_BASE_URL}/api/agent/task/${taskId}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Cancel failed", err);
      }
    }
    toast.info("Agent process terminated.");
  };

  const copyToClipboard = () => {
    if (!finalAnswer) return;
    navigator.clipboard.writeText(finalAnswer);
    setCopied(true);
    toast.success("Markdown report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdownReport = () => {
    if (!finalAnswer) return;
    const blob = new Blob([finalAnswer], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaperLens-Agent-Report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded as Markdown file.");
  };

  const handleInspectToolCard = (toolName: string) => {
    setActiveTab("artifacts");
    setHighlightedCard(toolName);
    const el = document.getElementById(`card-${toolName}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    setTimeout(() => setHighlightedCard(null), 3000);
  };

  return (
    <div className="space-y-4 pb-12">
      <AgentHeaderBanner
        isRunning={isRunning}
        onSelectPreset={(preset) => handleSendMessage(preset)}
      />

      {/* Split-Screen Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[780px]">
        {/* LEFT PANEL: Interactive Agent Chat & Inline Step-Trace */}
        <Card className="flex flex-col border border-border/80 bg-card/95 shadow-xl rounded-2xl overflow-hidden h-[780px]">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
                  PaperLens Research Workbench
                  <Badge variant="outline" className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    Two-Tier Agent
                  </Badge>
                </h2>
                <p className="text-[10px] text-muted-foreground">Autonomous Reasoning & Empirical Evidence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewSession}
                disabled={isRunning}
                title="Start a fresh conversation session"
                className="h-7 text-[11px] rounded-lg border-border/60 hover:bg-indigo-500/10 hover:text-indigo-300 gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                New Chat
              </Button>

              {activePaper && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[110px] truncate font-medium">{activePaper.filename}</span>
                  <button onClick={() => setActivePaper(null)} className="hover:text-red-400 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages & Inline Receipts */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "agent" && (
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] rounded-2xl p-4 shadow-sm space-y-2 ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-secondary/40 border border-border/70 text-foreground rounded-tl-none"
                  }`}
                >
                  {/* Inline Step-Trace Accordion & Tool Receipts */}
                  {msg.sender === "agent" && msg.trace && (
                    <AgentInlineTrace
                      trace={msg.trace}
                      onInspectTool={handleInspectToolCard}
                    />
                  )}

                  {/* Clean Markdown Response */}
                  {msg.text && (
                    <div className="prose-xs text-foreground/90 leading-relaxed pt-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {normalizeMarkdown(msg.text)}
                      </ReactMarkdown>
                    </div>
                  )}

                  <span className="block text-[9px] opacity-60 text-right font-mono pt-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-foreground/10 border border-border/40 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 bg-secondary/20 border-t border-border/30 overflow-x-auto flex items-center gap-2 scrollbar-none">
            <span className="text-[10px] text-muted-foreground shrink-0 font-semibold font-mono">Suggestions:</span>
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                disabled={isRunning}
                className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-indigo-500/10 border border-border/40 hover:border-indigo-500/40 text-[11px] text-foreground/80 hover:text-indigo-300 transition-all shrink-0 whitespace-nowrap"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chat Input Dock */}
          <div className="p-3 border-t border-border/50 bg-secondary/30 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isUploadingPaper || isRunning}
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF Paper"
              className="rounded-xl border-border/60 hover:bg-indigo-500/10 hover:text-indigo-300 shrink-0"
            >
              {isUploadingPaper ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder={
                activePaper
                  ? `Ask agent about '${activePaper.filename}'...`
                  : "Ask research query or request datasets/problem statements..."
              }
              disabled={isRunning}
              className="flex-1 bg-background/90 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60"
            />

            {isRunning ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleStopAgent}
                className="rounded-xl px-3"
              >
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!inputQuery.trim()}
                onClick={() => handleSendMessage()}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* RIGHT PANEL: Dynamic Artifact Workspace Feed */}
        <Card className="flex flex-col border border-border/80 bg-card/95 shadow-xl rounded-2xl overflow-hidden h-[780px]">
          {/* Workspace Header & Views Switcher */}
          <div className="p-3.5 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-foreground">Artifact Workspace</span>
              {isRunning && (
                <Badge variant="outline" className="text-[10px] text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse">
                  Streaming Artifacts
                </Badge>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setActiveTab("artifacts")}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  activeTab === "artifacts" ? "bg-indigo-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Artifacts
              </button>
              <button
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  activeTab === "report" ? "bg-indigo-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Executive Report
              </button>
              <button
                onClick={() => setActiveTab("trace")}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  activeTab === "trace" ? "bg-indigo-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Execution Trace
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={`px-3 py-1 rounded-lg transition-all text-xs ${
                  activeTab === "json" ? "bg-indigo-600 text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
            {/* VIEW 1: Chronological Dynamic Artifacts */}
            {activeTab === "artifacts" && (
              <div className="space-y-4">
                {!finalAnswer && !isRunning && resultsData.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground space-y-3">
                    <BrainCircuit className="w-12 h-12 text-indigo-400/30 animate-pulse" />
                    <p className="text-xs max-w-sm">
                      Submit a research prompt on the left to see live structured artifact cards rendered in execution order.
                    </p>
                  </div>
                )}

                {/* Render Cards Dynamically in Execution Order */}
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
                        className={`space-y-1.5 transition-all duration-500 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-2xl" : ""}`}
                      >
                        <CardProvenanceBadge
                          toolName={toolName}
                          qualitySignal="Semantic Scholar + arXiv verified"
                          className="px-1"
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

                  if (toolName === "detect_gaps" || toolName === "generate_problem") {
                    const problems = res.problems || res.problem_statements || res.ideas || res.gaps || [];
                    if (!problems.length) return null;
                    return (
                      <div
                        id={`card-${toolName}`}
                        key={idx}
                        className={`space-y-1.5 transition-all duration-500 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-2xl" : ""}`}
                      >
                        <CardProvenanceBadge
                          toolName={toolName}
                          qualitySignal="Attributed Gaps"
                          className="px-1"
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
                        className={`space-y-1.5 transition-all duration-500 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-2xl" : ""}`}
                      >
                        <CardProvenanceBadge
                          toolName={toolName}
                          qualitySignal="SOTA Benchmarks"
                          className="px-1"
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
                        className={`space-y-1.5 transition-all duration-500 ${isHighlighted ? "ring-2 ring-indigo-500 rounded-2xl" : ""}`}
                      >
                        <CardProvenanceBadge
                          toolName={toolName}
                          qualitySignal="Execution Roadmap"
                          className="px-1"
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

                {/* Self-Critique Audit Card */}
                {critiqueData && (
                  <div className="space-y-1.5">
                    <CardProvenanceBadge
                      toolName="synthesize_and_verify"
                      qualitySignal={critiqueData.verdict || "Audited"}
                      className="px-1"
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

            {/* VIEW 2: Full Synthesized Executive Report */}
            {activeTab === "report" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground">Synthesized Research Document</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-7 text-xs rounded-lg gap-1 border-border/60"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy Markdown"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadMarkdownReport}
                      className="h-7 text-xs rounded-lg gap-1 border-border/60"
                    >
                      <Download className="w-3 h-3" />
                      Download .md
                    </Button>
                  </div>
                </div>

                {finalAnswer ? (
                  <div className="p-6 rounded-2xl border border-border/70 bg-card/80 text-foreground text-xs leading-relaxed shadow-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {normalizeMarkdown(finalAnswer)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-12">
                    Synthesis report will appear once agent research execution completes.
                  </p>
                )}
              </div>
            )}

            {/* VIEW 3: Live Stepper & Reasoning Trace */}
            {activeTab === "trace" && (
              <AgentStepperView
                steps={dynamicSteps}
                currentStepIndex={dynamicSteps.length}
                progressPercent={isRunning ? 60 : finalAnswer ? 100 : 0}
                isRunning={isRunning}
                finalAnswer={finalAnswer}
                latestThought={latestThought}
                memorySummary={memorySummary}
              />
            )}

            {/* VIEW 4: Raw Structured Entities Inspector */}
            {activeTab === "json" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2 border-b border-border/50">
                  <span>Structured Results Payload ({resultsData.length} records)</span>
                </div>
                <pre className="p-4 rounded-xl border border-border/60 bg-secondary/20 text-foreground font-mono text-[11px] overflow-x-auto max-h-[600px] leading-relaxed">
                  {JSON.stringify(resultsData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
