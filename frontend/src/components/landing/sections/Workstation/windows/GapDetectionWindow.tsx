import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { detectedGaps, projectDescriptions, ease } from "../workstationData";

export default function GapDetectionWindow() {
  const [activeTab, setActiveTab] = useState<"project" | "paper">("project");
  const [gapsDetected, setGapsDetected] = useState<typeof detectedGaps | null>(detectedGaps.slice(0, 3));
  const projectContent = projectDescriptions[0];

  const handleDetectGaps = () => {
    const randomGaps = [...detectedGaps].sort(() => Math.random() - 0.5).slice(0, 4);
    setGapsDetected(randomGaps);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-destructive";
      case "High":
        return "text-warning";
      case "Medium":
        return "text-accent";
      default:
        return "text-success";
    }
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Gap Detection Engine</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="gap-scope-select" className="text-xs font-semibold text-foreground">Target Research Scope</label>
              <div className="flex gap-1 bg-muted/40 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("project")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    activeTab === "project" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Abstract
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("paper")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    activeTab === "paper" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Methodology
                </button>
              </div>
            </div>
            <textarea
              id="gap-scope-select"
              value={projectContent}
              readOnly
              rows={2}
              className="w-full bg-muted/20 border border-border rounded-lg p-2 text-xs text-muted-foreground resize-none focus-visible:outline-none"
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-accent" />
              Identified Blind Spots & Trade-Offs
            </h4>
            <button
              type="button"
              onClick={handleDetectGaps}
              className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
            >
              Rescan Literature
            </button>
          </div>

          {gapsDetected && (
            <div className="space-y-2">
              {gapsDetected.map((gap, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-semibold text-foreground truncate mr-2">{gap.title}</h5>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${getSeverityColor(gap.severity)}`}>
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-1.5">
                    {gap.desc}
                  </p>
                  <div className="text-[11px] text-accent/90 bg-accent/10 px-2 py-1 rounded font-medium">
                    Novel Direction: {gap.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
