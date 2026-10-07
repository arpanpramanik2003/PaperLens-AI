import { motion } from "framer-motion";
import { BarChart3, BookOpen, Sparkles } from "lucide-react";
import { ease } from "../workstationData";

const topRefs = [
  { title: "Densely Connected Convolutional Networks", year: 2016, citations: 42165 },
  { title: "MobileNets: Efficient CNNs for Mobile Vision", year: 2017, citations: 24300 },
  { title: "mixup: Beyond Empirical Risk Minimization", year: 2017, citations: 11456 },
];

const mustRead = [
  "Densely Connected Convolutional Networks",
  "MobileNets: Efficient CNNs for Mobile Vision",
  "mixup: Beyond Empirical Risk Minimization",
];

export default function CitationIntelligenceWindow() {
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
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Citation Intelligence</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                Highly Influential References
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">Sorted by Citations</span>
            </div>

            <div className="space-y-2">
              {topRefs.map((ref, i) => (
                <div
                  key={ref.title}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 mr-3">
                    <span className="text-[11px] font-mono text-muted-foreground w-4 text-right flex-shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{ref.title}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">{ref.year}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-semibold text-accent">
                      {ref.citations.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">citations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/70 pt-3">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              AI Recommended Prioritized Reading
            </h3>
            <div className="space-y-1.5">
              {mustRead.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-muted-foreground p-1.5 rounded hover:bg-muted/40 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
