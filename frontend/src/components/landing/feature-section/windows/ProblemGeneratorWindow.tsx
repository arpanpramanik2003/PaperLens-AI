import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { domains, researchIdeas, subdomains } from "../constants";
import { ease } from "../shared";

export default function ProblemGeneratorWindow() {
  const [ideas, setIdeas] = useState(researchIdeas.slice(0, 2));
  const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
  const selectedSubdomain = subdomains[selectedDomain as keyof typeof subdomains][0];

  const handleGenerateIdeas = () => {
    const shuffled = [...researchIdeas].sort(() => Math.random() - 0.5);
    setIdeas(shuffled.slice(0, 2));
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleGenerateIdeas}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 opacity-5 blur-3xl"
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
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Problem Generator</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <motion.div
            className="mb-6 pb-6 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Domain</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground">
                    {selectedDomain}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subdomain</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground">
                    {selectedSubdomain}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Complexity</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors">
                    <span>Medium</span>
                    <span className="text-muted-foreground">▼</span>
                  </div>
                </div>
              </div>

              <motion.button
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Ideas
              </motion.button>
            </div>
          </motion.div>

          <div className="space-y-3">
            {ideas.map((idea, idx) => (
              <motion.div
                key={idx}
                className="bg-secondary/30 border border-border/20 rounded-lg p-3 hover:border-amber-500/50 hover:bg-secondary/50 transition-all duration-200"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < idea.rating ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                      ★
                    </span>
                  ))}
                </div>

                <h4 className="text-xs font-semibold text-foreground mb-1">{idea.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{idea.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-secondary/50 border border-border/30 rounded text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <motion.button
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  whileHover={{ x: 3 }}
                >
                  Use this idea →
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
