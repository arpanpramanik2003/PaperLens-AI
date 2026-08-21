import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ImperativePanelHandle } from "react-resizable-panels";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MessageSquare, Layers, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

import { AgentHeader } from "@/components/agent/AgentHeader";
import { AgentChatPanel, ChatMessage } from "@/components/agent/AgentChatPanel";
import { AgentArtifactsPanel } from "@/components/agent/AgentArtifactsPanel";
import { ToolReceipt } from "@/components/agent/AgentReasoningBlock";

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
  results?: any[];
  timestamp?: string;
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

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_papers: "Literature Search",
  search_workspace_vector_db: "Document Search",
  analyze_paper: "Paper Analysis",
  detect_gaps: "Research Gap Detection",
  generate_problem: "Problem Formulation",
  find_datasets: "Dataset Discovery",
  plan_experiment: "Experiment Planning",
};

const PROMPT_SUGGESTIONS = [
  "Find out research gaps and limitations in my uploaded paper",
  "Formulate novel problem statements for Breast cancer detection",
  "Recommend SOTA datasets and benchmarks for GNN molecular property prediction",
  "Design a multi-stage experimental execution roadmap for medical image segmentation",
];

export default function AgentMode() {
  const { getToken } = useAuth();

  // Multi-Turn Session State
  const [sessionId, setSessionId] = useState<string>(() => {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  });

  const [inputQuery, setInputQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: "Welcome to **PaperLens Research Agent**.\n\nAsk research questions, search literature, compare benchmark datasets, design experiment roadmaps, or attach a research PDF to detect unexplored gaps.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Paper Upload Context State
  const [activePaper, setActivePaper] = useState<{ id: string; filename: string; pages: number } | null>(null);
  const [isUploadingPaper, setIsUploadingPaper] = useState(false);

  // Agent Task & Findings State
  const [isRunning, setIsRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [critiqueData, setCritiqueData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"artifacts" | "report" | "json">("artifacts");
  const [copied, setCopied] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  // Resizable Split & Collapse State
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  const artifactsPanelRef = useRef<ImperativePanelHandle>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isArtifactsCollapsed, setIsArtifactsCollapsed] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<"chat" | "artifacts">("chat");

  const sseRef = useRef<EventSource | null>(null);
  const taskStartTimeRef = useRef<number>(0);

  const handleMaximizeChat = () => {
    if (isArtifactsCollapsed) {
      handleResetSplit();
    } else {
      artifactsPanelRef.current?.collapse();
      chatPanelRef.current?.expand();
    }
  };

  const handleMaximizeArtifacts = () => {
    if (isChatCollapsed) {
      handleResetSplit();
    } else {
      chatPanelRef.current?.collapse();
      artifactsPanelRef.current?.expand();
    }
  };

  const handleResetSplit = () => {
    chatPanelRef.current?.resize(48);
    artifactsPanelRef.current?.resize(52);
    chatPanelRef.current?.expand();
    artifactsPanelRef.current?.expand();
    setIsChatCollapsed(false);
    setIsArtifactsCollapsed(false);
  };

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
        text: "Started a fresh research session. How can I assist with your research literature, problem formulation, or benchmark discovery?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
    toast.success("New research session started.");
  };

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
    toast.loading("Uploading and indexing paper for research agent...", { id: "upload-paper" });

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/agent/upload-paper`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const data = await res.json();
      setActivePaper({
        id: data.paper_id,
        filename: data.filename,
        pages: data.total_pages || 1,
      });

      toast.success(`Paper '${data.filename}' attached to research session.`, { id: "upload-paper" });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `paper-${Date.now()}`,
          sender: "agent",
          text: `Paper **${data.filename}** (${data.total_pages} pages) attached to context. Ask me to detect research gaps, analyze methodology, or formulate problem statements!`,
          timestamp: new Date().toLocaleTimeString(),
          paperInfo: { filename: data.filename, pages: data.total_pages },
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload paper.", { id: "upload-paper" });
    } finally {
      setIsUploadingPaper(false);
      e.target.value = "";
    }
  };

  const handleSendMessage = async (promptGoal?: string) => {
    const textGoal = promptGoal || inputQuery;
    if (!textGoal.trim()) {
      toast.error("Please enter a research query.");
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
        activeThought: "Analyzing research intent and determining relevant actions...",
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
    setFinalAnswer(null);
    setResultsData([]);
    setCritiqueData(null);
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

      if (!res.ok) throw new Error(`Failed to initialize research task (${res.status})`);

      const data = await res.json();
      const newTaskId = data.task_id;
      setTaskId(newTaskId);

      connectSSE(newTaskId, agentMsgId, token);
    } catch (err: any) {
      toast.error(err.message || "Could not launch research agent.");
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
              const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;

              const newReceipt: ToolReceipt = {
                id: `rcpt-${Date.now()}`,
                tool: toolName,
                toolName: displayName,
                args: payload.args,
                summary: payload.description || `Executing ${displayName}`,
                status: "running",
                timestamp: new Date().toLocaleTimeString(),
              };

              return {
                ...msg,
                trace: {
                  ...curTrace,
                  activeThought: `Executing ${displayName}...`,
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

            if (payload.type === "final" || payload.type === "error") {
              setIsRunning(false);
              setFinalAnswer(payload.answer || null);
              setResultsData(payload.results || []);
              setCritiqueData((payload as any).critique || null);

              const totalDurationSec = (Date.now() - (curTrace.startTime || Date.now())) / 1000;

              return {
                ...msg,
                text: payload.answer || "Research task completed.",
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
    toast.info("Research process stopped.");
  };

  const copyToClipboard = () => {
    if (!finalAnswer) return;
    navigator.clipboard.writeText(finalAnswer);
    setCopied(true);
    toast.success("Executive report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdownReport = () => {
    if (!finalAnswer) return;
    const blob = new Blob([finalAnswer], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaperLens-Research-Report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded as Markdown.");
  };

  const handleInspectToolCard = (toolName: string) => {
    setActiveTab("artifacts");
    setHighlightedCard(toolName);
    const el = document.getElementById(`card-${toolName}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    setTimeout(() => setHighlightedCard(null), 2500);
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-2 overflow-hidden font-sans relative">
      {/* Top Session Header */}
      <div className="flex-shrink-0">
        <AgentHeader
          isRunning={isRunning}
          activePaper={activePaper}
          onRemovePaper={() => setActivePaper(null)}
          onNewSession={handleNewSession}
          onSelectPreset={(preset) => handleSendMessage(preset)}
        />
      </div>

      {/* Floating Restore Trigger when Chat is collapsed on Desktop */}
      {isChatCollapsed && (
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            chatPanelRef.current?.expand();
            setIsChatCollapsed(false);
          }}
          className="hidden lg:flex fixed left-6 bottom-8 z-40 items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md hover:border-indigo-500/60 hover:bg-secondary transition-all cursor-pointer text-xs font-semibold text-foreground group"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>Research Chat (Collapsed)</span>
        </motion.button>
      )}

      {/* Floating Restore Trigger when Artifacts is collapsed on Desktop */}
      {isArtifactsCollapsed && (
        <motion.button
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            artifactsPanelRef.current?.expand();
            setIsArtifactsCollapsed(false);
          }}
          className="hidden lg:flex fixed right-6 bottom-8 z-40 items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md hover:border-indigo-500/60 hover:bg-secondary transition-all cursor-pointer text-xs font-semibold text-foreground group"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Artifacts Panel (Collapsed)</span>
          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
        </motion.button>
      )}

      {/* MOBILE / TABLET VIEW (< lg screens): Tab Switcher */}
      <div className="flex lg:hidden items-center justify-center p-1 bg-secondary/40 rounded-lg border border-border/50 flex-shrink-0 text-xs">
        <button
          type="button"
          onClick={() => setMobileActiveView("chat")}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
            mobileActiveView === "chat" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
          }`}
        >
          Research Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView("artifacts")}
          className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
            mobileActiveView === "artifacts" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground"
          }`}
        >
          Artifacts & Findings
        </button>
      </div>

      <div className="block lg:hidden flex-1 min-h-0 w-full overflow-hidden">
        {mobileActiveView === "chat" ? (
          <AgentChatPanel
            chatMessages={chatMessages}
            inputQuery={inputQuery}
            setInputQuery={setInputQuery}
            isRunning={isRunning}
            isUploadingPaper={isUploadingPaper}
            activePaper={activePaper}
            onSendMessage={handleSendMessage}
            onStopAgent={handleStopAgent}
            onFileUpload={handleFileUpload}
            onRemovePaper={() => setActivePaper(null)}
            onNewSession={handleNewSession}
            onInspectToolCard={handleInspectToolCard}
            promptSuggestions={PROMPT_SUGGESTIONS}
          />
        ) : (
          <AgentArtifactsPanel
            isRunning={isRunning}
            finalAnswer={finalAnswer}
            resultsData={resultsData}
            critiqueData={critiqueData}
            highlightedCard={highlightedCard}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onCopyReport={copyToClipboard}
            onDownloadReport={downloadMarkdownReport}
            copied={copied}
            renderTextOrObject={renderTextOrObject}
          />
        )}
      </div>

      {/* DESKTOP VIEW (>= lg screens): Resizable Side-by-Side Panels with Minimize-Maximize Bar */}
      <div className="hidden lg:flex flex-1 min-h-0 w-full overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full h-full min-h-0 items-stretch"
        >
          {/* Left Panel: Research Chat & Live Trace */}
          <ResizablePanel
            ref={chatPanelRef}
            defaultSize={48}
            minSize={25}
            collapsible={true}
            onCollapse={() => setIsChatCollapsed(true)}
            onExpand={() => setIsChatCollapsed(false)}
            className={`h-full min-h-0 transition-all duration-200 ${isChatCollapsed ? "hidden lg:hidden" : ""}`}
          >
            <AgentChatPanel
              chatMessages={chatMessages}
              inputQuery={inputQuery}
              setInputQuery={setInputQuery}
              isRunning={isRunning}
              isUploadingPaper={isUploadingPaper}
              activePaper={activePaper}
              onSendMessage={handleSendMessage}
              onStopAgent={handleStopAgent}
              onFileUpload={handleFileUpload}
              onRemovePaper={() => setActivePaper(null)}
              onNewSession={handleNewSession}
              onInspectToolCard={handleInspectToolCard}
              promptSuggestions={PROMPT_SUGGESTIONS}
              isOtherCollapsed={isArtifactsCollapsed}
              onMaximize={handleMaximizeChat}
              onResetSplit={handleResetSplit}
            />
          </ResizablePanel>

          {/* Minimize-Maximize & Resize Handle Bar */}
          <ResizableHandle
            withHandle
            className={`flex mx-1.5 my-auto h-24 opacity-60 hover:opacity-100 transition-opacity ${
              isChatCollapsed || isArtifactsCollapsed ? "hidden" : ""
            }`}
            title="Drag to resize panels • Double-click to reset (50/50)"
            onDoubleClick={handleResetSplit}
          />

          {/* Right Panel: Structured Artifacts & Executive Report */}
          <ResizablePanel
            ref={artifactsPanelRef}
            defaultSize={52}
            minSize={25}
            collapsible={true}
            onCollapse={() => setIsArtifactsCollapsed(true)}
            onExpand={() => setIsArtifactsCollapsed(false)}
            className={`h-full min-h-0 transition-all duration-200 ${isArtifactsCollapsed ? "hidden lg:hidden" : ""}`}
          >
            <AgentArtifactsPanel
              isRunning={isRunning}
              finalAnswer={finalAnswer}
              resultsData={resultsData}
              critiqueData={critiqueData}
              highlightedCard={highlightedCard}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCopyReport={copyToClipboard}
              onDownloadReport={downloadMarkdownReport}
              copied={copied}
              renderTextOrObject={renderTextOrObject}
              isOtherCollapsed={isChatCollapsed}
              onMaximize={handleMaximizeArtifacts}
              onResetSplit={handleResetSplit}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
