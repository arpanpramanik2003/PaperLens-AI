import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, Send, Bot, Loader2, CheckCircle2, RefreshCw, Compass, ShieldCheck, MessageSquareText, ScanText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import { apiClient } from "@/lib/api-client";
import { scrollToResult } from "@/lib/scroll-to-result";
import { toast } from "@/components/ui/sonner";

const ease = [0.2, 0, 0, 1] as const;

const guideSteps = [
  {
    title: "Upload",
    description: "Add your PDF or DOCX paper.",
    icon: Upload,
  },
  {
    title: "Analyze",
    description: "Get structured sections and insights.",
    icon: ScanText,
  },
  {
    title: "Interrogate",
    description: "Ask focused follow-up questions.",
    icon: MessageSquareText,
  },
  {
    title: "Validate",
    description: "Cross-check methods and claims quickly.",
    icon: ShieldCheck,
  },
];

const quickPromptSuggestions = [
  "Summarize the core contribution in 5 bullets",
  "What are the key assumptions and limitations?",
  "List reproducibility risks in methodology",
  "Suggest 3 follow-up experiment ideas",
];

const MarkdownComponents: any = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mt-6 mb-3 text-accent" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-bold mt-4 mb-3 text-foreground" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-semibold text-foreground" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-3 leading-relaxed text-foreground/90" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5" {...props} />,
  li: ({node, ...props}: any) => <li className="text-foreground/90" {...props} />,
};

const normalizeMarkdown = (value: string) => {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s*(#{2,6})(?!#)\s*/g, "$1\n\n$2 ")
    .replace(/^(\s*#{2,6})([^\s#])/gm, "$1 $2")
    .replace(/^\s*\*\*(.*?)\*\*\s*$/gm, "## $1");
};

type AnalyzeErrorPayload = {
  error?: string;
  code?: string;
};

export default function PaperAnalyzer() {
  const { getToken, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [docId, setDocId] = useState<string>("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const analysisSteps = [
    "Uploading file",
    "Extracting sections",
    "Generating analysis",
    "Finalizing result"
  ];

  const parseAnalyzeError = (status: number, payload: AnalyzeErrorPayload) => {
    const message = payload?.error || "Analysis failed. Please try again.";

    if (status === 413 || payload?.code === "PAPER_TOO_LENGTHY") {
      return "This paper is too long for the current deployment limits. Please upload a shorter paper or reduce file size.";
    }

    if (message.toLowerCase().includes("memory") || message.toLowerCase().includes("too lengthy")) {
      return "The file is too large to process on the current server plan. Please upload a shorter paper.";
    }

    return message;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile.name);
    setAnalyzing(true);
    setAnalyzingStep(0);
    setAnalyzed(false);
    setWarningMessage(null);
    setChatMessages([]);
    setPageCount(null);

    const stepTimer = window.setInterval(() => {
      setAnalyzingStep((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1200);
    
    if (!userId) {
      setTimeout(() => {
        setAnalysisResult("This paper introduces the Transformer architecture, a novel sequence transduction model based entirely on attention mechanisms...\n\n**Methodology**\nThe authors propose a multi-head self-attention mechanism...\n\n**Results**\nThe Transformer achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results by over 2 BLEU.\n\n**Limitations**\nThe model's self-attention mechanism has O(n²) complexity with respect to sequence length, which can be prohibitive for very long sequences.");
        setDocId("demo_doc_id");
        setPageCount(15);
        setAnalyzed(true);
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 2000);
      return;
    }
    
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await apiClient.fetch("/api/analyze", {
        method: "POST",
        body: formData
      }, getToken);
      
      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw { status: res.status, payload: err };
      }
      
      const data = await res.json();
      setAnalysisResult(data.result);
      setDocId(data.doc_id);
      setPageCount(typeof data.page_count === "number" ? data.page_count : null);
      setAnalyzed(true);
    } catch (error: unknown) {
      console.error(error);
      const err = error as { status?: number; payload?: AnalyzeErrorPayload };
      const message = parseAnalyzeError(err?.status ?? 0, err?.payload ?? {});
      setWarningMessage(message);
      toast.error("Analysis could not be completed", {
        description: message
      });
      setFile(null);
    } finally {
      window.clearInterval(stepTimer);
      setAnalyzing(false);
      setAnalyzingStep(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !docId) return;
    
    const input = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: input }]);
    setChatInput("");

    const normalizedInput = input.trim().toLowerCase();
    const acknowledgementRegex = /^(ok|okay|ok good|great|nice|cool|got it|understood|thanks|thank you|perfect|alright|all right)[.!\s]*$/i;

    if (acknowledgementRegex.test(normalizedInput)) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Great — let me know if you want a summary, key findings, or deeper verification from the paper.",
        },
      ]);
      return;
    }

    setAiGenerating(true);
    
    if (!userId) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "ai", text: `Based on the analysis, this relates to the attention mechanisms described in the paper.` }]);
        setAiGenerating(false);
      }, 1000);
      return;
    }
    
    try {
      const token = await getToken();
      const res = await apiClient.fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: input,
          doc_id: docId,
          history: chatMessages.slice(-10)
        })
      }, getToken);
      
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch(error) {
      console.error(error);
      setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error answering that." }]);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleResetAnalyzer = () => {
    setFile(null);
    setAnalyzing(false);
    setAnalyzed(false);
    setAnalysisResult("");
    setDocId("");
    setPageCount(null);
    setChatMessages([]);
    setChatInput("");
    setAiGenerating(false);
    setWarningMessage(null);
    setAnalyzingStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!analyzed) return;

    const scrollContainer = chatScrollRef.current;
    if (scrollContainer) {
      const rafId = window.requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      });

      return () => window.cancelAnimationFrame(rafId);
    }
  }, [chatMessages, aiGenerating, analyzed]);

  useEffect(() => {
    if (!analyzed) return;
    scrollToResult(analysisRef.current);
  }, [analyzed]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(140deg,hsl(var(--card))_0%,hsl(var(--card)/0.9)_62%,hsl(var(--accent)/0.08)_100%)] px-6 py-6 sm:px-8 sm:py-7"
      >
        <div className="pointer-events-none absolute -top-20 left-6 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 mb-3">
              <Compass className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Guided Analysis</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight">Paper Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Upload a paper, get structured AI insights, then interrogate claims through contextual Q&A.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1.5 rounded-full border border-border/60 bg-background/40">
              {analyzed ? "Ready" : analyzing ? "Processing" : "Awaiting File"}
            </span>
            {(analyzed || file) && !analyzing && (
              <Button variant="outline" size="sm" onClick={handleResetAnalyzer} className="gap-2 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5" />
                New Upload
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {!file && !analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            accept=".pdf,.docx" 
          />

          <motion.div
            className="lg:col-span-3 relative overflow-hidden border border-border/60 rounded-3xl p-10 sm:p-14 text-center cursor-pointer bg-card/90 transition-all duration-300 hover:border-accent/35 hover:shadow-[0_24px_50px_-35px_hsl(var(--accent))]"
            onClick={() => fileInputRef.current?.click()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            whileHover={{ scale: 1.005 }}
          >
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_15%_15%,hsl(var(--accent)/0.12),transparent_32%),radial-gradient(circle_at_85%_80%,hsl(var(--accent)/0.08),transparent_38%)]" />
            <div className="relative z-10 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl border border-border/60 bg-background/60 flex items-center justify-center mx-auto mb-5">
                <Upload className="w-8 h-8 text-accent" strokeWidth={1.6} />
              </div>
              <p className="text-foreground text-xl font-semibold mb-2">Drop your PDF or DOCX here</p>
              <p className="text-sm text-muted-foreground mb-5">or click to browse files and begin guided analysis</p>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-widest border border-border/60 rounded-full px-3 py-1.5 bg-background/50">
                Max quality for 5-20 page papers
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide">Guide Menu</h2>
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">4 Steps</span>
            </div>

            <div className="space-y-2.5">
              {guideSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: 0.2 + index * 0.07, ease }}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-3.5"
                >
                  <div className="w-9 h-9 rounded-xl border border-border/60 bg-card flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 text-accent" strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{index + 1}. {step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto mt-1 group-hover:text-accent transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {warningMessage && !analyzing && (
        <motion.div
          className="mb-4 rounded-xl border border-border/50 bg-card p-4"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-medium text-foreground">Upload limit reached</p>
          <p className="text-sm text-muted-foreground mt-1">{warningMessage}</p>
        </motion.div>
      )}

      {analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card/90 premium-shadow">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/70 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">{file}</span>
              <span className="text-[11px] text-accent font-mono uppercase tracking-widest ml-auto">Analyzing...</span>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/90 p-5 premium-shadow">
              <p className="text-sm font-semibold tracking-wide text-foreground mb-3">Processing Pipeline</p>
              <div className="space-y-2.5">
                {analysisSteps.map((step, index) => {
                  const isDone = index < analyzingStep;
                  const isActive = index === analyzingStep;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        isActive ? "border-accent/35 bg-accent/5" : "border-border/60 bg-background/40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 text-accent animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border/70" />
                      )}
                      <span className={`text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/90 p-5 premium-shadow">
            <p className="text-sm font-semibold tracking-wide text-foreground mb-3">Live Preview</p>
            <div className="space-y-3">
              {["Summary", "Methodology", "Results"].map((s) => (
                <div key={s} className="rounded-xl border border-border/60 bg-background/45 p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Analysis */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card/90 premium-shadow">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-background/70 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">{file}</span>
              <span className="text-[11px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-accent/10 text-accent ml-auto">Analyzed</span>
            </div>

            <motion.div
              ref={analysisRef}
              className="rounded-2xl border border-border/60 bg-card/90 p-5 overflow-auto premium-shadow"
              style={{ maxHeight: "calc(100vh - 250px)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground capitalize tracking-wide">Analysis Result</h3>
                </div>
                {typeof pageCount === "number" && pageCount > 0 && (
                  <div className="text-xs font-mono px-2 py-1 rounded-md bg-secondary text-foreground border border-border/60 whitespace-nowrap uppercase tracking-wider">
                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                  </div>
                )}
              </div>
              <div className="text-sm [&_p]:text-justify sm:[&_p]:text-left">
                {analysisResult ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {normalizeMarkdown(analysisResult)}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground whitespace-pre-wrap">No analysis generated.</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/90 flex flex-col lg:h-[560px] lg:sticky lg:top-20 premium-shadow">
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Chat with Paper</span>
                <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider ml-auto">Context: This Document</span>
              </div>

              <div ref={chatScrollRef} className="overflow-y-auto p-4 max-h-[38vh] sm:max-h-[42vh] lg:flex-1 lg:max-h-none">
                <div className="flex flex-col gap-4 lg:min-h-full lg:justify-end">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Ask a question about the document.</p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {msg.role === "ai" && (
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-accent" />
                        </div>
                      )}
                      <div className={`max-w-[85%] ${msg.role === "user" ? "bg-secondary rounded-2xl rounded-br-md px-4 py-2.5" : ""}`}>
                        {msg.role === "ai" ? (
                          <div className="text-sm">
                            <ReactMarkdown components={MarkdownComponents}>
                              {normalizeMarkdown(msg.text)}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {aiGenerating && (
                    <motion.div
                      className="flex gap-3"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-3 py-2 border border-border/50 bg-secondary/30">
                        <div className="flex items-center gap-1">
                          <motion.span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                          <motion.span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                          <motion.span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                          <span className="text-xs text-muted-foreground ml-2">AI is generating…</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <form onSubmit={handleChat} className="p-3 border-t border-border/50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this paper..."
                    className="text-sm bg-secondary/50 border-border/50 rounded-xl"
                  />
                  <ShinyButton type="submit" variant="inline" className="h-9 w-9 p-0 flex-shrink-0 rounded-xl">
                    <Send className="w-4 h-4" />
                  </ShinyButton>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickPromptSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatInput(prompt)}
                      className="text-[11px] px-2 py-1 rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
