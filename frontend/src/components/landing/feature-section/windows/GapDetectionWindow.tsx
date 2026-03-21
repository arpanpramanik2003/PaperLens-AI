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
        return "text-red-400";
      case "High":
        return "text-yellow-400";
      case "Medium":
        return "text-blue-400";
      default:
        return "text-green-400";
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
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Gap Detection</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          <motion.div
            className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <motion.button
              onClick={() => setActiveTab("project")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "project"
                  ? "bg-blue-500/30 border border-blue-500/50 text-blue-300"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Project Plan
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("paper")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "paper"
                  ? "bg-blue-500/30 border border-blue-500/50 text-blue-300"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Upload Paper
            </motion.button>
          </motion.div>

          <motion.div
            className="mb-4 p-3 bg-secondary/20 border border-border/20 rounded text-xs text-muted-foreground leading-relaxed min-h-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {projectContent}
            <div className="mt-3 flex justify-end">
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </motion.div>

          <motion.button
            className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-3.5 h-3.5" />
            Detect Gaps
          </motion.button>

          {gapsDetected && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-wrap items-center gap-2 justify-between py-2 border-b border-border/20">
                <span className="text-xs text-muted-foreground font-semibold">{gapsDetected.length} gaps identified</span>
                <motion.button className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors" whileHover={{ scale: 1.05 }}>
                  <FileText className="w-3 h-3" />
                  Copy Report
                </motion.button>
              </div>

              <div className="space-y-3">
                {gapsDetected.map((gap, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-secondary/30 border border-border/20 rounded-lg p-3 hover:border-green-500/30 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-foreground flex-1">{gap.title}</h4>
                      <span className={`text-xs font-semibold flex-shrink-0 ${getSeverityColor(gap.severity)}`}>{gap.severity}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{gap.desc}</p>
                    <p className="text-xs text-blue-300 italic leading-relaxed pl-3 border-l-2 border-blue-500/50">{gap.action}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
