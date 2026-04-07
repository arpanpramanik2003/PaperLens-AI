import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, Info, Sparkles, FileText, Upload, Copy, Check, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";

const ease = [0.2, 0, 0, 1] as const;

const severityConfig = {
  high: { label: "High", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", className: "bg-accent/10 text-accent" },
  low: { label: "Low", className: "bg-secondary text-muted-foreground" },
};

export default function GapDetection() {
  const { getToken, userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

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
      alert("Failed to detect research gaps.");
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
      alert("Please log in to save detected gaps.");
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
      alert("Gap report saved.");
    } catch (err) {
      console.error(err);
      alert("Could not save gap report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Gap Detection Engine</h1>
        <p className="text-sm text-muted-foreground mb-6">Identify research gaps from project plans or papers.</p>
      </motion.div>

      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${
            activeTab === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" /> Project Plan
        </button>
        <button
          onClick={() => setActiveTab("file")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${
            activeTab === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Paper
        </button>
      </div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-6 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        {activeTab === "text" ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Paste your project plan or research idea here..."
              className="min-h-[200px] bg-secondary/30 border-border/50 resize-none"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-border/50 rounded-xl p-12 text-center hover:border-accent/30 transition-colors bg-secondary/10">
            <input
              type="file"
              id="gap-file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".pdf,.docx"
            />
            <label htmlFor="gap-file" className="cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-sm text-foreground font-medium truncate max-w-[250px] sm:max-w-md mx-auto">
                {selectedFile ? selectedFile.name : "Click to upload PDF or DOCX"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDetect} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8">
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} /> 
            {loading ? "Searching for Gaps..." : "Detect Gaps"}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {detected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium font-mono">{gaps.length} gaps identified</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2 h-8 text-xs border-border/50" onClick={handleSaveGaps} disabled={saving}>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="gap-2 h-8 text-xs border-border/50" onClick={copyToClipboard}>
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Report"}
                </Button>
              </div>
            </div>
            {gaps.map((gap, i) => (
              <motion.div
                key={gap.title + i}
                className="rounded-xl border border-border/50 bg-card p-5 hover:border-accent/20 transition-colors"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{gap.title}</h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${severityConfig[gap.severity as keyof typeof severityConfig]?.className || severityConfig.low.className}`}>
                    {severityConfig[gap.severity as keyof typeof severityConfig]?.label || "Low"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{gap.explanation}</p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed italic">{gap.suggestion}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {!detected && !loading && (
        <div className="text-center py-16">
          <ScanSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Provide a plan or paper to uncover research opportunities.</p>
        </div>
      )}
    </div>
  );
}
