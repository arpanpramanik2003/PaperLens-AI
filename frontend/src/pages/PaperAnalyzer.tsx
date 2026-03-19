import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import { apiClient } from "@/lib/api-client";

const ease = [0.2, 0, 0, 1] as const;

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

export default function PaperAnalyzer() {
  const { getToken, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [docId, setDocId] = useState<string>("");
  
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile.name);
    setAnalyzing(true);
    setAnalyzed(false);
    setChatMessages([]);
    
    if (!userId) {
      setTimeout(() => {
        setAnalysisResult("This paper introduces the Transformer architecture, a novel sequence transduction model based entirely on attention mechanisms...\n\n**Methodology**\nThe authors propose a multi-head self-attention mechanism...\n\n**Results**\nThe Transformer achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results by over 2 BLEU.\n\n**Limitations**\nThe model's self-attention mechanism has O(n²) complexity with respect to sequence length, which can be prohibitive for very long sequences.");
        setDocId("demo_doc_id");
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
          throw new Error(err.error || "Analysis failed. Ensure the server is running.");
      }
      
      const data = await res.json();
      setAnalysisResult(data.result);
      setDocId(data.doc_id);
      setAnalyzed(true);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
      setFile(null);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !docId) return;
    
    const input = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: input }]);
    setChatInput("");
    
    if (!userId) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "ai", text: `Based on the analysis, this relates to the attention mechanisms described in the paper.` }]);
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
        body: JSON.stringify({ question: input, doc_id: docId })
      }, getToken);
      
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch(error) {
      console.error(error);
      setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error answering that." }]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Paper Analyzer</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload a paper and get structured AI-powered insights.</p>
      </motion.div>

      {!file && !analyzed && (
        <>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            accept=".pdf,.docx" 
          />
          <motion.div
            className="border-2 border-dashed border-border/50 rounded-2xl p-16 text-center hover:border-accent/30 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            whileHover={{ scale: 1.005 }}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-foreground font-medium mb-1">Drop your PDF or DOCX here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
          </motion.div>
        </>
      )}

      {analyzing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
            <FileText className="w-5 h-5 text-accent" />
                        <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">{file}</span>
            <span className="text-xs text-accent font-mono ml-auto">Analyzing...</span>
          </div>
          <div className="space-y-3">
            {["Summary", "Methodology", "Results"].map((s) => (
              <div key={s} className="rounded-xl border border-border/50 bg-card p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Analysis */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
              <FileText className="w-5 h-5 text-accent" />
                            <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">{file}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent ml-auto">Analyzed</span>
            </div>

            <motion.div
              className="rounded-xl border border-border/50 bg-card p-5 overflow-auto"
              style={{ maxHeight: "calc(100vh - 250px)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              <h3 className="text-sm font-semibold text-foreground capitalize mb-4">Analysis Result</h3>
              <div className="text-sm">
                {analysisResult ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {analysisResult.replace(/^\s*\*\*(.*?)\*\*\s*$/gm, '## $1')}
                  </ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground whitespace-pre-wrap">No analysis generated.</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border/50 bg-card flex flex-col h-[600px] sticky top-20">
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Chat with Paper</span>
                <span className="text-xs text-muted-foreground font-mono ml-auto">Context: This Document</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-10">Ask a question about the document.</p>
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
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <form onSubmit={handleChat} className="p-3 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this paper..."
                    className="text-sm bg-secondary/50 border-border/50"
                  />
                  <Button type="submit" size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
