import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { detectedGaps, projectDescriptions } from "../constants";
import { ease } from "../shared";

export default function GapDetectionWindow() {
  const [activeTab, setActiveTab] = useState<"project" | "paper">("project");
  const [gapsDetected, setGapsDetected] = useState<typeof detectedGaps | null>(null);
  const projectContent = projectDescriptions[Math.floor(Math.random() * projectDescriptions.length)];

  const handleDetectGaps = () => {
    const randomGaps = [...detectedGaps].sort(() => Math.random() - 0.5).slice(0, 5);
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
      onMouseEnter={handleDetectGaps}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Gap Detection</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
            <button
              onClick={() => setActiveTab("project")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "project"
                  ? "bg-accent/15 border border-accent/40 text-accent shadow-sm"
                  : "bg-secondary/70 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Project Plan
            </button>
            <button
              onClick={() => setActiveTab("paper")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "paper"
                  ? "bg-accent/15 border border-accent/40 text-accent shadow-sm"
                  : "bg-secondary/70 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Upload Paper
            </button>
          </div>

          <div className="mb-4 p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed min-h-24">
            {projectContent}
            <div className="mt-3 flex justify-end">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
          </div>

          <motion.button
            onClick={handleDetectGaps}
            className="mb-4 bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full shadow-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-3.5 h-3.5" />
            Detect Gaps
          </motion.button>

          {gapsDetected && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-semibold">{gapsDetected.length} gaps identified</span>
                <button className="text-xs text-success hover:text-success/80 font-medium flex items-center gap-1 transition-colors">
                  <FileText className="w-3 h-3" />
                  Copy Report
                </button>
              </div>

              <div className="space-y-3">
                {gapsDetected.map((gap, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-card border border-border rounded-lg p-3 hover:border-accent/40 transition-colors shadow-xs"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-foreground flex-1">{gap.title}</h4>
                      <span className={`text-xs font-semibold flex-shrink-0 ${getSeverityColor(gap.severity)}`}>{gap.severity}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{gap.desc}</p>
                    <p className="text-xs text-foreground/90 italic leading-relaxed pl-3 border-l-2 border-accent/60">{gap.action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
