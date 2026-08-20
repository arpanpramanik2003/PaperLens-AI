import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, FileText, Search } from "lucide-react";
import { benchmarksData, datasetsData, domainDescriptions, projectTitles } from "../constants";
import { ease } from "../shared";

export default function DatasetBenchmarkWindow() {
  const [projectTitle, setProjectTitle] = useState("Brain Tumor Classification with CNNs");
  const [projectPlan, setProjectPlan] = useState("");
  const [showResults, setShowResults] = useState(true);
  const [datasets, setDatasets] = useState<typeof datasetsData>(datasetsData.slice(0, 3));
  const [benchmarks, setBenchmarks] = useState<typeof benchmarksData>(benchmarksData.slice(0, 3));
  const domainDesc = domainDescriptions[0];

  const handleFindDatasets = () => {
    const selectedDatasets = [...datasetsData].sort(() => Math.random() - 0.5).slice(0, 3);
    const selectedBenchmarks = [...benchmarksData].sort(() => Math.random() - 0.5).slice(0, 3);
    setDatasets(selectedDatasets);
    setBenchmarks(selectedBenchmarks);
    setShowResults(true);
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
          <span className="text-xs font-medium text-muted-foreground ml-2">PaperLens AI — Dataset Finder</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          {!showResults ? (
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="project-title-input" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Project Title</label>
                <input
                  id="project-title-input"
                  type="text"
                  placeholder="Brain tumor classification"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-accent"
                />
              </div>

              <div>
                <label htmlFor="project-plan-input" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Project Plan (Optional)</label>
                <textarea
                  id="project-plan-input"
                  placeholder="Paste your full project plan, methodology, objectives, and expected outcomes..."
                  value={projectPlan}
                  onChange={(e) => setProjectPlan(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-accent h-20 resize-none"
                />
                <div className="mt-2 flex justify-end" aria-hidden="true">
                  <div className="w-2.5 h-2.5 rounded-full bg-success" />
                </div>
              </div>

              <motion.button
                onClick={handleFindDatasets}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-3.5 h-3.5" />
                Find Datasets & Benchmarks
              </motion.button>
            </div>
          ) : (
            <>
              <div className="mb-4 pb-4 border-b border-border">
                <h3 className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">Domain Understanding</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{domainDesc}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-border">
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  Recommended Datasets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {datasets.map((dataset, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-lg p-2.5 hover:border-accent/40 transition-colors shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${i < Math.floor(dataset.rating) ? "text-warning" : "text-muted/60"}`}>
                              ★
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-auto">{dataset.rating}/5</span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{dataset.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{dataset.desc}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {dataset.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted/60 border border-border rounded text-muted-foreground font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded">
                        View details →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-accent" />
                  Relevant Benchmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {benchmarks.map((benchmark, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-lg p-2.5 hover:border-accent/40 transition-colors shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${i < Math.floor(benchmark.rating) ? "text-warning" : "text-muted/60"}`}>
                              ★
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-auto">{benchmark.rating}/5</span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{benchmark.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{benchmark.desc}</p>
                      </div>
                      <button className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded">
                        View benchmark details →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
