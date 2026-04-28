import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, Info, Sparkles, FileText, Upload, Copy, Check, BookmarkPlus, Compass, ShieldAlert, SearchCheck, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/clerk-react";
import { scrollToResult } from "@/lib/scroll-to-result";
import { apiClient } from "@/lib/api-client";
import { showSaveErrorToast, showSaveSignInToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

const severityConfig = {
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", className: "bg-accent/10 text-accent" },
  low: { label: "Low", className: "bg-secondary text-muted-foreground" },
};

const workflowGuide = [
  {
    title: "Provide Input",
    detail: "Paste plan text or upload a paper file.",
    icon: FileText,
  },
  {
    title: "Analyze Structure",
    detail: "Detect missing assumptions and weak links.",
    icon: SearchCheck,
  },
  {
    title: "Prioritize Risks",
    detail: "Classify findings by severity and impact.",
    icon: ShieldAlert,
  },
  {
    title: "Improve Plan",
    detail: "Apply targeted suggestions to close gaps.",
    icon: Lightbulb,
  },
];

export default function GapDetection() {
  const { getToken, userId } = useAuth();
  const resultsRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detected) return;
    scrollToResult(resultsRef.current);
  }, [detected]);

  const handleDetect = async () => {
    if (activeTab === "text" && !inputText.trim()) return;
    if (activeTab === "file" && !selectedFile) return;

    setDetected(false);
    setGaps([]);

    if (!userId) {
      setLoading(true);
      setTimeout(() => {
        setGaps([
          { title: "Demo: Logical Flow Gap", explanation: "The proposed project plan assumes high availability of labeled data which might not be realistic.", severity: "high", suggestion: "Consider synthetic data generation." },
          { title: "Demo: Infrastructure Weakness", explanation: "Lacks detail on distributed training scaling.", severity: "medium", suggestion: "Add a section on Horovod or PyTorch DDP." },
        ]);
        setLoading(false);
        setDetected(true);
      }, 1500);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const formData = new FormData();
      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("text", inputText);
      }

      const res = await apiClient.fetch("/api/detect-gaps", {
        method: "POST",
        body: formData
      }, getToken);

      if (!res.ok) throw new Error("Failed to detect gaps");
      const data = await res.json();
      setGaps(data.gaps || []);
      setDetected(true);
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Gap analysis");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = gaps.map(g => `${g.title}\nSeverity: ${g.severity}\nGap: ${g.explanation}\nSuggestion: ${g.suggestion}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveGaps = async () => {
    if (!detected || gaps.length === 0) return;
    if (!userId) {
      showSaveSignInToast("Gap report");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.fetch(
        "/api/saved-items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "gap_detection",
            title: activeTab === "text" ? "Gap Analysis (Project Plan)" : "Gap Analysis (Uploaded Paper)",
            summary: `${gaps.length} research gaps identified`,
            payload: {
              activeTab,
              sourceText: activeTab === "text" ? inputText : null,
              fileName: selectedFile?.name || null,
              gaps,
            },
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to save detected gaps.");
      showSaveSuccessToast("Gap report");
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Gap report");
    } finally {
      setSaving(false);
    }
  };

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
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Risk Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight">Gap Detection Engine</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Identify blind spots, weak assumptions, and missing links in plans or research papers.
            </p>
          </div>

          <span className="inline-flex min-w-[8.5rem] items-center justify-center text-center whitespace-nowrap text-xs font-mono uppercase tracking-widest text-muted-foreground px-2.5 py-1.5 rounded-full border border-border/60 bg-background/40">
            {detected ? "Gaps Ready" : loading ? "Analyzing" : "Awaiting Input"}
          </span>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div
          className="lg:col-span-8 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50 mb-5 w-fit">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                activeTab === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" /> Project Plan
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-all ${
                activeTab === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-4 h-4" /> Upload Paper
            </button>
          </div>

          {activeTab === "text" ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your project plan or research idea here..."
                className="min-h-[220px] bg-secondary/30 border-border/50 resize-none rounded-2xl"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden border border-border/60 rounded-2xl p-10 sm:p-12 text-center hover:border-accent/30 transition-colors bg-secondary/10">
              <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_15%_15%,hsl(var(--accent)/0.1),transparent_34%),radial-gradient(circle_at_85%_80%,hsl(var(--accent)/0.08),transparent_40%)]" />
              <input
                type="file"
                id="gap-file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.docx"
              />
              <label htmlFor="gap-file" className="cursor-pointer relative z-10 block">
                <div className="w-14 h-14 rounded-2xl border border-border/60 bg-background/60 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <p className="text-sm text-foreground font-medium truncate max-w-[250px] sm:max-w-md mx-auto">
                  {selectedFile ? selectedFile.name : "Click to upload PDF or DOCX"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <ShinyButton onClick={handleDetect} disabled={loading} className="w-full sm:w-auto px-8 rounded-xl">
              <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Searching for Gaps..." : "Detect Gaps"}
            </ShinyButton>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="lg:col-span-4 rounded-3xl border border-border/60 bg-card/90 p-5 sm:p-6 premium-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wide">Workflow Example</h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">4 Stages</span>
          </div>

          <div className="space-y-2.5">
            {workflowGuide.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: 0.2 + index * 0.07, ease }}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-3.5"
              >
                <div className="w-9 h-9 rounded-xl border border-border/60 bg-card flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-accent" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{index + 1}. {item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </section>

      <AnimatePresence>
        {detected && (
          <section ref={resultsRef} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
              <p className="text-sm text-muted-foreground font-medium font-mono">{gaps.length} gaps identified</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2 h-8 text-xs border-border/50 rounded-lg" onClick={handleSaveGaps} disabled={saving}>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="gap-2 h-8 text-xs border-border/50 rounded-lg" onClick={copyToClipboard}>
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Report"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {gaps.map((gap, i) => (
                <motion.div
                  key={gap.title + i}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-5 hover:border-accent/30 transition-all duration-250 hover:-translate-y-0.5 premium-shadow"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/10 via-transparent to-accent/5" />

                  <div className="relative z-10 flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{gap.title}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider ${severityConfig[gap.severity as keyof typeof severityConfig]?.className || severityConfig.low.className}`}>
                      {severityConfig[gap.severity as keyof typeof severityConfig]?.label || "Low"}
                    </span>
                  </div>

                  <p className="relative z-10 text-xs text-muted-foreground leading-relaxed mb-3 text-justify sm:text-left">{gap.explanation}</p>

                  <div className="relative z-10 flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/15">
                    <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed italic">{gap.suggestion}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </AnimatePresence>

      {!detected && !loading && (
        <div className="text-center py-12 sm:py-16">
          <ScanSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Provide a plan or paper to uncover research opportunities.</p>
        </div>
      )}
    </div>
  );
}
