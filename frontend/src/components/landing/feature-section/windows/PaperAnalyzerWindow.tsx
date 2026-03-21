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
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 opacity-5 blur-3xl"
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
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Paper Analyzer</span>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <motion.div
            className="flex-[0_0_42%] md:flex-1 min-h-0 md:border-r border-border/20 border-b md:border-b-0 p-3 sm:p-4 overflow-y-auto"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ANALYSIS RESULT</h4>
              </div>

              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "summary"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("summary")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className={`text-xs sm:text-sm font-semibold mb-2 transition-colors ${hoveredSection === "summary" ? "text-blue-300" : "text-blue-400"}`}>
                  Summary
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.summary}</p>
              </motion.div>

              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "problem"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("problem")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className={`text-xs sm:text-sm font-semibold mb-2 transition-colors ${hoveredSection === "problem" ? "text-blue-300" : "text-blue-400"}`}>
                  Problem Statement
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.problem}</p>
              </motion.div>

              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "methodology"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("methodology")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <h3 className={`text-xs sm:text-sm font-semibold mb-2 transition-colors ${hoveredSection === "methodology" ? "text-blue-300" : "text-blue-400"}`}>
                  Methodology
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{project.methodology}</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="flex-[0_0_58%] md:flex-1 min-h-0 flex flex-col p-3 sm:p-4 bg-secondary/20"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 text-blue-400" />
                Chat with Paper
              </h4>
              <span className="text-xs text-muted-foreground">This Document</span>
            </div>

            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto mb-3">
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="bg-blue-500/30 rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[70%]">
                  <p className="text-xs text-foreground">{question.q}</p>
                </div>
              </motion.div>

              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <div className="bg-secondary/50 rounded-lg px-3 py-2 max-w-[85%] sm:max-w-[70%]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{question.a}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about this paper..."
                className="flex-1 bg-secondary/50 border border-border/30 rounded px-2 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50"
                disabled
              />
              <motion.button
                className="bg-blue-500/80 hover:bg-blue-500 text-white rounded p-1.5 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3 h-3" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
