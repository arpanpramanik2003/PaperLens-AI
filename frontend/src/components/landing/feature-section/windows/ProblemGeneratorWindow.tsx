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
      <div className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Problem Generator</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mb-5 pb-5 border-b border-border">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Domain</label>
                  <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium truncate">
                    {selectedDomain}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Subdomain</label>
                  <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-medium truncate">
                    {selectedSubdomain}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Complexity</label>
                  <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors">
                    <span>Medium</span>
                    <span className="text-muted-foreground text-[10px]">▼</span>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleGenerateIdeas}
                className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Ideas
              </motion.button>
            </div>
          </div>

          <div className="space-y-3">
            {ideas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-3 hover:border-accent/40 transition-all duration-200 shadow-xs"
              >
                <div className="flex items-center gap-1 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < idea.rating ? "text-warning" : "text-muted/60"}`}>
                      ★
                    </span>
                  ))}
                </div>

                <h4 className="text-xs font-semibold text-foreground mb-1">{idea.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{idea.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-muted/60 border border-border rounded text-muted-foreground font-mono">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                >
                  Use this idea →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
