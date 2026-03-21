import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, FileText, Search } from "lucide-react";
import { benchmarksData, datasetsData, domainDescriptions, projectTitles } from "../constants";
import { ease } from "../shared";

export default function DatasetBenchmarkWindow() {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectPlan, setProjectPlan] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [datasets, setDatasets] = useState<typeof datasetsData>([]);
  const [benchmarks, setBenchmarks] = useState<typeof benchmarksData>([]);
  const domainDesc = domainDescriptions[Math.floor(Math.random() * domainDescriptions.length)];
  const defaultTitle = projectTitles[Math.floor(Math.random() * projectTitles.length)];

  const handleFindDatasets = () => {
    setProjectTitle(defaultTitle);
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
      onMouseEnter={handleFindDatasets}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 opacity-5 blur-3xl"
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
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Dataset Finder</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col">
          {!showResults ? (
            <motion.div
              className="space-y-3 mb-4"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Title</label>
                <input
                  type="text"
                  placeholder="Brain tumor"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Plan (Optional)</label>
                <textarea
                  placeholder="Paste your full project plan, methodology, objectives, and expected outcomes..."
                  value={projectPlan}
                  onChange={(e) => setProjectPlan(e.target.value)}
                  className="w-full bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 h-20 resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
              </div>

              <motion.button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-3.5 h-3.5" />
                Find Datasets & Benchmarks
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="mb-4 pb-4 border-b border-border/20"
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <p className="text-xs text-blue-400 font-semibold mb-1">DOMAIN UNDERSTANDING</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{domainDesc}</p>
              </motion.div>

              <motion.div
                className="mb-4 pb-4 border-b border-border/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Recommended Datasets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {datasets.map((dataset, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-secondary/30 border border-border/20 rounded p-2 hover:border-blue-500/30 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(dataset.rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">{dataset.rating}/5</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{dataset.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{dataset.desc}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {dataset.tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-secondary/50 border border-border/30 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <motion.button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" whileHover={{ x: 2 }}>
                        View details →
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }}>
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" />
                  Relevant Benchmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {benchmarks.map((benchmark, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-secondary/30 border border-border/20 rounded p-2 hover:border-blue-500/30 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(benchmark.rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">{benchmark.rating}/5</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{benchmark.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{benchmark.desc}</p>
                      <motion.button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" whileHover={{ x: 2 }}>
                        View benchmark details →
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
