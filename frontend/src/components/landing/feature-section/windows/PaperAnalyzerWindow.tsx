import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap } from "lucide-react";
import { randomProjects, randomQuestions } from "../constants";
import { ease } from "../shared";

export default function PaperAnalyzerWindow() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [project, setProject] = useState(randomProjects[Math.floor(Math.random() * randomProjects.length)]);
  const [question, setQuestion] = useState(randomQuestions[Math.floor(Math.random() * randomQuestions.length)]);

  const handleCardHover = () => {
    setProject(randomProjects[Math.floor(Math.random() * randomProjects.length)]);
    setQuestion(randomQuestions[Math.floor(Math.random() * randomQuestions.length)]);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleCardHover}
    >
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Paper Analyzer</span>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-[0_0_42%] md:flex-1 min-h-0 md:border-r border-border border-b md:border-b-0 p-3 sm:p-4 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analysis Result</h4>
              </div>

              <div
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  hoveredSection === "summary"
                    ? "bg-accent/10 border-accent/40 shadow-xs"
                    : "bg-muted/30 border-border/60 hover:bg-muted/60"
                }`}
                onMouseEnter={() => setHoveredSection("summary")}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <h3 className={`text-xs font-semibold mb-1 transition-colors ${hoveredSection === "summary" ? "text-accent" : "text-foreground"}`}>
                  Summary
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.summary}</p>
              </div>

              <div
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  hoveredSection === "problem"
                    ? "bg-accent/10 border-accent/40 shadow-xs"
                    : "bg-muted/30 border-border/60 hover:bg-muted/60"
                }`}
                onMouseEnter={() => setHoveredSection("problem")}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <h3 className={`text-xs font-semibold mb-1 transition-colors ${hoveredSection === "problem" ? "text-accent" : "text-foreground"}`}>
                  Problem Statement
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.problem}</p>
              </div>

              <div
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  hoveredSection === "methodology"
                    ? "bg-accent/10 border-accent/40 shadow-xs"
                    : "bg-muted/30 border-border/60 hover:bg-muted/60"
                }`}
                onMouseEnter={() => setHoveredSection("methodology")}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <h3 className={`text-xs font-semibold mb-1 transition-colors ${hoveredSection === "methodology" ? "text-accent" : "text-foreground"}`}>
                  Methodology
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.methodology}</p>
              </div>
            </div>
          </div>

          <div className="flex-[0_0_58%] md:flex-1 min-h-0 flex flex-col p-3 sm:p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-accent" />
                Chat with Paper
              </h4>
              <span className="text-[11px] text-muted-foreground">This Document</span>
            </div>

            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto mb-3">
              <div className="flex justify-end">
                <div className="bg-accent/15 border border-accent/25 rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[80%]">
                  <p className="text-xs text-foreground font-medium">{question.q}</p>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[80%] shadow-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{question.a}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about this paper..."
                className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                disabled
              />
              <button
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg p-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
