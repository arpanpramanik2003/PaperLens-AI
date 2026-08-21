import React, { useRef, useEffect } from "react";
import {
  BrainCircuit,
  Bot,
  User,
  Paperclip,
  Send,
  Loader2,
  FileText,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentReasoningBlock, TraceData } from "./AgentReasoningBlock";

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text?: string;
  timestamp: string;
  paperInfo?: { filename: string; pages: number };
  task_id?: string;
  trace?: TraceData;
}

interface AgentChatPanelProps {
  chatMessages: ChatMessage[];
  inputQuery: string;
  setInputQuery: (val: string) => void;
  isRunning: boolean;
  isUploadingPaper: boolean;
  activePaper: { id: string; filename: string; pages: number } | null;
  onSendMessage: (query?: string) => void;
  onStopAgent: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePaper: () => void;
  onNewSession: () => void;
  onInspectToolCard: (toolName: string) => void;
  promptSuggestions: string[];
  isOtherCollapsed?: boolean;
  onMaximize?: () => void;
  onResetSplit?: () => void;
}

const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => <h1 className="text-base font-bold mt-4 mb-2 text-foreground border-b border-border/50 pb-1" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-sm font-semibold mt-3 mb-1.5 text-indigo-400" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-xs font-semibold mt-2.5 mb-1 text-foreground" {...props} />,
  strong: ({ node, ...props }: any) => <strong className="font-semibold text-foreground" {...props} />,
  p: ({ node, ...props }: any) => <p className="mb-2 leading-relaxed text-foreground/90 text-xs" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-3 space-y-1 text-xs" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-xs text-foreground/90" {...props} />,
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

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  chatMessages,
  inputQuery,
  setInputQuery,
  isRunning,
  isUploadingPaper,
  activePaper,
  onSendMessage,
  onStopAgent,
  onFileUpload,
  onRemovePaper,
  onNewSession,
  onInspectToolCard,
  promptSuggestions,
  isOtherCollapsed = false,
  onMaximize,
  onResetSplit,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smooth scroll message container when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length, isRunning]);

  // Dynamic textarea height adjustment (auto-expand up to 5 lines ~120px, then smooth scroll to bottom)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 5 lines limit
      textareaRef.current.style.height = `${Math.min(scrollH, maxHeight)}px`;

      // If prompt crosses 5 lines, keep latest typed lines directly in viewpoint
      if (scrollH > maxHeight) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [inputQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputQuery.trim() && !isRunning) {
        onSendMessage();
      }
    }
  };

  return (
    <Card className="h-full w-full flex flex-col min-h-0 border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      {/* Panel Header */}
      <div className="p-2.5 sm:p-3 border-b border-border/50 bg-secondary/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary border border-border/60 text-indigo-400">
            <BrainCircuit className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Research Chat
              <span className="relative flex h-1.5 w-1.5">
                <span className={`inline-flex rounded-full h-1.5 w-1.5 ${isRunning ? "bg-indigo-400 animate-pulse" : "bg-emerald-500"}`} />
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground">Interactive Session</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activePaper && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-foreground text-[11px]">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span className="max-w-[90px] truncate font-medium">{activePaper.filename}</span>
              <button
                type="button"
                onClick={onRemovePaper}
                className="hover:text-red-400 ml-0.5 text-muted-foreground transition-colors"
                title="Remove paper"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onNewSession}
            disabled={isRunning}
            title="Start new conversation"
            className="h-7 text-[11px] rounded-md border-border/60 hover:bg-secondary gap-1 px-2"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">New</span>
          </Button>

          {/* Minimize / Maximize Layout Controls */}
          {(onMaximize || onResetSplit) && (
            <div className="hidden lg:flex items-center gap-0.5 bg-secondary/60 border border-border/60 rounded-md p-0.5 ml-0.5">
              {onMaximize && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-background/80"
                  title={isOtherCollapsed ? "Restore 50/50 split view" : "Maximize chat panel"}
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

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "agent" && (
              <div className="w-6 h-6 rounded-md bg-secondary border border-border/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-secondary/30 border border-border/60 text-foreground rounded-tl-none space-y-2"
              }`}
            >
              {/* Inline Reasoning & Action Receipts */}
              {msg.sender === "agent" && msg.trace && (
                <AgentReasoningBlock
                  trace={msg.trace}
                  onInspectTool={onInspectToolCard}
                />
              )}

              {/* Markdown Body */}
              {msg.text && (
                <div className="text-foreground/90 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {normalizeMarkdown(msg.text)}
                  </ReactMarkdown>
                </div>
              )}

              <span className={`block text-[9px] font-mono pt-0.5 text-right ${msg.sender === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === "user" && (
              <div className="w-6 h-6 rounded-md bg-secondary border border-border/60 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggestion Chips: Clean scroll container without native scrollbar */}
      <div className="px-3 py-2 bg-secondary/15 border-t border-border/30 overflow-x-auto flex items-center gap-1.5 flex-shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Suggestions:</span>
        {promptSuggestions.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSendMessage(sug)}
            disabled={isRunning}
            className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/50 text-[11px] text-foreground/80 hover:text-foreground transition-all shrink-0 whitespace-nowrap cursor-pointer"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Prominent Auto-Expanding Multi-Line Prompt Card (Gemini / ChatGPT style) */}
      <div className="p-3 border-t border-border/50 bg-card/60 flex flex-col gap-2 flex-shrink-0">
        <div className="relative flex flex-col rounded-2xl border border-border/80 bg-background/90 shadow-sm focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all p-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activePaper
                ? `Ask research agent about '${activePaper.filename}'... (Shift+Enter for newline)`
                : "Ask research query, compare datasets, or design experiment plans... (Shift+Enter for newline)"
            }
            disabled={isRunning}
            className="w-full bg-transparent resize-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed max-h-[120px] min-h-[38px] overflow-y-auto px-1 py-0.5 font-sans"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-1">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploadingPaper || isRunning}
                onClick={() => fileInputRef.current?.click()}
                title="Attach PDF Paper"
                className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 text-xs font-medium"
              >
                {isUploadingPaper ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Paperclip className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Attach PDF</span>
              </Button>

              {activePaper && (
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate max-w-[130px]">
                  {activePaper.filename}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                ↵ Enter
              </span>
              {isRunning ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onStopAgent}
                  className="h-8 rounded-lg px-3 text-xs flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!inputQuery.trim()}
                  onClick={() => onSendMessage()}
                  className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium hidden sm:inline">Send</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
