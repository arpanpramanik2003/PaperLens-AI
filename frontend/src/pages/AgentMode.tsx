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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AgentHeaderBanner } from "@/components/agent/AgentHeaderBanner";
import { AgentStepperView, StepItem } from "@/components/agent/AgentStepperView";
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
  text: string;
  timestamp: string;
  paperInfo?: { filename: string; pages: number };
  task_id?: string;
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

const RESEARCH_STEPS: StepItem[] = [
  { id: 1, name: "Literature Repository Search", desc: "Searching global paper repositories & workspace index", icon: Search },
  { id: 2, name: "Methodology & Insights Analysis", desc: "Extracting paper abstractions & technical insights", icon: BookOpen },
  { id: 3, name: "Novel Research Directions", desc: "Formulating research directions & core bottlenecks", icon: Target },
  { id: 4, name: "Dataset & Benchmark Selection", desc: "Evaluating SOTA datasets & metrics", icon: Database },
  { id: 5, name: "Peer-Review Self-Critique", desc: "Verifying claims & citation coverage against sources", icon: ShieldCheck },
  { id: 6, name: "Report Synthesis", desc: "Synthesizing executive literature review proposal", icon: FileText },
];

const PROMPT_SUGGESTIONS = [
  "Find out research gaps and limitations in my uploaded paper",
  "Formulate novel problem statements and research directions for Breast cancer detection",
  "Recommend SOTA datasets and benchmarks for GNN molecular property prediction",
  "Design a multi-stage experimental execution roadmap for medical image segmentation",
];

export default function AgentMode() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Chatbot State
  // Multi-Turn Session State
  const [sessionId, setSessionId] = useState<string>(() => {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  });

  const [inputQuery, setInputQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: "Welcome to **PaperLens Continuous Autonomous Agent Workspace**!\n\nYou can chat with me, ask complex research questions, or attach a PDF paper to detect research gaps and generate novel solution roadmaps.",
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
  const [plannedSteps, setPlannedSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [critiqueData, setCritiqueData] = useState<any | null>(null);
  const [latestThought, setLatestThought] = useState<string | null>(null);
  const [memorySummary, setMemorySummary] = useState<string | null>(null);
  const [dynamicSteps, setDynamicSteps] = useState<StepItem[]>([]);
  const [activeExecutingTool, setActiveExecutingTool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cards" | "stepper" | "raw">("cards");
  const [copied, setCopied] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

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
    setPlannedSteps([]);
    setDynamicSteps([]);
    setCurrentStepIndex(0);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    setLatestThought(null);
    setMemorySummary(null);
    setActiveExecutingTool(null);
    toast.success("New research session initialized.");
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, events]);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  const activeResearchSteps = useMemo<StepItem[]>(() => {
    return dynamicSteps;
  }, [dynamicSteps]);

  // Upload Paper PDF Handler
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

      // Add system chat message for paper upload
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

  // Start Agent Task Handler
  const handleSendMessage = async (promptGoal?: string) => {
    const textGoal = promptGoal || inputQuery;
    if (!textGoal.trim()) {
      toast.error("Please enter a research prompt.");
      return;
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textGoal.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    // Prepare conversation history (last 4 turns) before appending the current message
    const priorHistory = chatMessages.slice(-4).map((m) => ({
      role: m.sender,
      text: m.text,
    }));

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsRunning(true);

    setEvents([]);
    setPlannedSteps([]);
    setDynamicSteps([]);
    setCurrentStepIndex(1);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    setLatestThought(null);
    setMemorySummary(null);
    setActiveExecutingTool(null);
    setActiveTab("cards");

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

      connectSSE(newTaskId, token);
    } catch (err: any) {
      toast.error(err.message || "Could not launch agent task.");
      setIsRunning(false);
    }
  };

  const connectSSE = (tId: string, token: string | null) => {
    if (sseRef.current) sseRef.current.close();

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
            if (taskData.live_history) {
              const finalEvt = taskData.live_history.find((e: any) => e.type === "final");
              if (finalEvt && finalEvt.answer) {
                setFinalAnswer(finalEvt.answer);
                setResultsData(finalEvt.results || []);
                setCritiqueData(finalEvt.critique || null);
                setActiveTab("cards");
                appendAgentChatResponse(finalEvt.answer, tId);
              }
            }
          } else if (taskData.status === "cancelled") {
            window.clearInterval(pollInterval);
            setIsRunning(false);
            eventSource.close();
          }
        }
      } catch (err) {
        // ignore polling error
      }
    }, 3500);

    eventSource.onmessage = (e) => {
      try {
        const payload: EventStep = JSON.parse(e.data);
        payload.timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [...prev, payload]);

        if (payload.type === "thought" && (payload as any).thought) {
          setLatestThought((payload as any).thought);
        } else if ((payload.type === "action" || payload.type === "tool_call") && payload.tool) {
          const tMeta = TOOL_META[payload.tool];
          setActiveExecutingTool(tMeta?.name || payload.tool);
          pushDynamicStep(payload.tool, (payload as any).description);
          setActiveTab("stepper");
        } else if (payload.type === "final" || payload.type === "error") {
          window.clearInterval(pollInterval);
          setIsRunning(false);
          setActiveExecutingTool(null);
          setFinalAnswer(payload.answer || null);
          setResultsData(payload.results || []);
          setCritiqueData((payload as any).critique || null);
          setActiveTab("cards");
          appendAgentChatResponse(payload.answer || "Agent task completed.", tId);
        }
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };
  };

  const appendAgentChatResponse = (text: string, tId: string) => {
    setChatMessages((prev) => {
      if (prev.some((m) => m.task_id === tId)) return prev;
      return [
        ...prev,
        {
          id: `agent-reply-${Date.now()}`,
          sender: "agent",
          text: text.slice(0, 400) + (text.length > 400 ? "...\n\n*(Full report synthesized on right panel)*" : ""),
          timestamp: new Date().toLocaleTimeString(),
          task_id: tId,
        },
      ];
    });
  };

  const pushDynamicStep = (toolName: string, customDesc?: string) => {
    setDynamicSteps((prev) => {
      if (prev.some((s) => (s as any).tool === toolName)) return prev;
      const meta = TOOL_META[toolName] || {
        name: customDesc || `Tool: ${toolName}`,
        desc: customDesc || `Executing ${toolName}`,
        icon: Zap,
      };
      return [...prev, { id: prev.length + 1, name: meta.name, desc: meta.desc, icon: meta.icon, tool: toolName } as any];
    });
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

  return (
    <div className="space-y-6 pb-12">
      <AgentHeaderBanner
        isRunning={isRunning}
        onSelectPreset={(preset) => handleSendMessage(preset)}
      />

      {/* Split-Screen SaaS Agent Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[750px]">
        {/* LEFT PANEL: Continuous Interactive Agent Chatbot */}
        <Card className="flex flex-col border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden h-[750px]">
          {/* Chatbot Header */}
          <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  PaperLens Agent Assistant
                  <Badge variant="outline" className="text-[10px] text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    SaaS Mode
                  </Badge>
                </h2>
                <p className="text-[11px] text-muted-foreground">Continuous research chatbot & tool executor</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewSession}
                disabled={isRunning}
                title="Start a fresh conversation session"
                className="h-7 text-[11px] rounded-xl border-border/60 hover:bg-indigo-500/10 hover:text-indigo-300 gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                New Chat
              </Button>

              {/* Active Paper Context Badge */}
              {activePaper && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate font-medium">{activePaper.filename}</span>
                  <button onClick={() => setActivePaper(null)} className="hover:text-red-400 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Thread Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "agent" && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-lg ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-secondary/70 border border-border/60 text-foreground rounded-tl-none"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {msg.text}
                  </ReactMarkdown>
                  <span className="block text-[10px] opacity-60 text-right mt-1.5 font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-foreground/10 border border-border/40 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isRunning && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                {activeExecutingTool ? (
                  <div className="bg-secondary/70 border border-indigo-500/30 rounded-2xl p-3 text-xs text-indigo-300 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Executing tool: <strong className="font-semibold text-indigo-200">{activeExecutingTool}</strong>...</span>
                  </div>
                ) : (
                  <div className="bg-secondary/70 border border-border/40 rounded-2xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>PaperLens AI is typing...</span>
                  </div>
                )}
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 bg-secondary/20 border-t border-border/30 overflow-x-auto flex items-center gap-2 scrollbar-none">
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Suggestions:</span>
            {PROMPT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                disabled={isRunning}
                className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-indigo-500/20 border border-border/40 hover:border-indigo-500/40 text-[11px] text-foreground/80 hover:text-indigo-300 transition-all shrink-0 whitespace-nowrap"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Chatbot Input Dock */}
          <div className="p-3 border-t border-border/50 bg-secondary/40 flex items-center gap-2">
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
              title="Attach PDF Paper to Agent Context"
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
                  : "Ask research prompt or request datasets/problems..."
              }
              disabled={isRunning}
              className="flex-1 bg-background/80 border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60"
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

        {/* RIGHT PANEL: Live Agent Tool Inspector & Synthesis Canvas */}
        <Card className="flex flex-col border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden h-[750px]">
          {/* Inspector Header & Navigation Tabs */}
          <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Agent Execution Inspector</span>
              {isRunning && (
                <Badge variant="outline" className="text-[10px] text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse">
                  Executing Tools
                </Badge>
              )}
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-background/60 p-1 rounded-xl border border-border/40 text-xs">
              <button
                onClick={() => setActiveTab("cards")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "cards" ? "bg-indigo-600 text-white font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Artefacts
              </button>
              <button
                onClick={() => setActiveTab("stepper")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "stepper" ? "bg-indigo-600 text-white font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Live Trace
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "raw" ? "bg-indigo-600 text-white font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Markdown
              </button>
            </div>
          </div>

          {/* Inspector Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "cards" && (
              <>
                {!finalAnswer && !isRunning && resultsData.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
                    <BrainCircuit className="w-12 h-12 text-indigo-400/40 animate-bounce" />
                    <p className="text-xs max-w-sm">
                      Submit a research prompt or upload a paper on the left chatbot to see live tool results and synthesized cards.
                    </p>
                  </div>
                )}

                {/* Render Tool Results Cards */}
                {(() => {
                  let litItem = resultsData.find((r) => r.tool === "search_papers" || r.papers);
                  let litPapers = litItem?.result?.papers || litItem?.result?.top_papers || [];

                  let probItem = resultsData.find((r) => r.tool === "generate_problem" || r.problems);
                  let problemsList = probItem?.result?.problems || probItem?.result?.ideas || [];

                  let expItem = resultsData.find((r) => r.tool === "plan_experiment" || r.steps);
                  let experimentPlanSteps = expItem?.result?.steps || [];

                  let datasetItem = resultsData.find((r) => r.tool === "find_datasets" || r.datasets);
                  let datasetsList = datasetItem?.result?.datasets || [];

                  return (
                    <div className="space-y-4">
                      {litPapers.length > 0 && (
                        <LiteratureReviewCard
                          papers={litPapers}
                          sortOrder="newest"
                          selectedYear="all"
                          searchQuery=""
                          onSortChange={() => {}}
                          onYearChange={() => {}}
                          onSearchChange={() => {}}
                          renderTextOrObject={renderTextOrObject}
                          sectionIndex={1}
                        />
                      )}

                      {problemsList.length > 0 && (
                        <ProposedDirectionsCard
                          problems={problemsList}
                          loadingPlanIndex={null}
                          directionPlans={{}}
                          onGeneratePlan={() => {}}
                          renderTextOrObject={renderTextOrObject}
                          sectionIndex={2}
                        />
                      )}

                      {datasetsList.length > 0 && (
                        <DatasetsBenchmarksCard
                          datasetsList={datasetsList}
                          renderTextOrObject={renderTextOrObject}
                          sectionIndex={3}
                        />
                      )}

                      {experimentPlanSteps.length > 0 && (
                        <ExperimentPlanCard
                          steps={experimentPlanSteps}
                          renderTextOrObject={renderTextOrObject}
                          sectionIndex={4}
                        />
                      )}

                      {critiqueData && (
                        <SelfCritiqueCard
                          critiqueData={critiqueData}
                          renderTextOrObject={renderTextOrObject}
                          sectionIndex={5}
                        />
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {activeTab === "stepper" && (
              <AgentStepperView
                steps={activeResearchSteps}
                currentStepIndex={currentStepIndex}
                progressPercent={(currentStepIndex / Math.max(activeResearchSteps.length, 1)) * 100}
                isRunning={isRunning}
                finalAnswer={finalAnswer}
                latestThought={latestThought}
                memorySummary={memorySummary}
              />
            )}

            {activeTab === "raw" && finalAnswer && (
              <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-xs font-bold text-foreground">Markdown Synthesized Report</h3>
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-7 text-[11px] rounded-lg">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="prose prose-invert max-w-none text-xs leading-relaxed font-sans">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {normalizeMarkdown(finalAnswer)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
