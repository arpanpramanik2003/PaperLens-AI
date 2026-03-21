import { motion } from "framer-motion";
import { BarChart3, BookOpen, ExternalLink, FileText, Sparkles } from "lucide-react";
import { ease } from "../shared";

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
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 opacity-5 blur-3xl"
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
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Citation Intelligence</span>
        </div>

        <div className="p-3 sm:p-4 flex-1 overflow-hidden flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Extracted", value: "23" },
              { label: "Processed", value: "23" },
              { label: "Matched", value: "19" },
              { label: "Missing", value: "4" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/30 bg-secondary/30 px-2 py-2">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0 flex-1">
            <div className="lg:col-span-3 min-h-0">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                <p className="text-xs font-semibold text-foreground">Top Cited References</p>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1 max-h-[170px] sm:max-h-[210px]">
                {topRefs.map((ref, idx) => (
                  <motion.div
                    key={ref.title}
                    className="rounded-lg border border-border/30 bg-card/60 p-2"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.15 + idx * 0.08 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-snug line-clamp-2">{ref.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap">
                        {ref.citations}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{ref.year} • Open in Semantic Scholar</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-accent">
                      <ExternalLink className="w-3 h-3" /> Link
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 min-h-0">
              <div className="rounded-lg border border-border/30 bg-card/60 p-2.5 h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs font-semibold text-foreground">AI Recommendations</p>
                </div>

                <div className="mb-2 rounded-md bg-secondary/40 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Paper Focus</p>
                  <p className="text-[11px] text-foreground/90 leading-relaxed line-clamp-3">
                    Brain tumor classification with lightweight CNNs and explainable transfer learning.
                  </p>
                </div>

                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Must Read</p>
                <div className="space-y-1.5">
                  {mustRead.map((title, idx) => (
                    <motion.div
                      key={title}
                      className="flex items-start gap-1.5 rounded-md border border-border/30 px-2 py-1.5"
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: 0.25 + idx * 0.08 }}
                    >
                      <FileText className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-foreground/90 leading-relaxed line-clamp-2">{title}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-accent"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3" />
                  Suggestions generated from citation signals
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
