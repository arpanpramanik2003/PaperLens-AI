import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Quote,
  Calculator,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { samplePaperCitations, sampleEquations } from "../../data/interactiveDemoData";
import KeyCap from "../../ui/KeyCap";

export default function HeroInteractiveLens() {
  const [activeInspectType, setActiveInspectType] = useState<"citation" | "equation" | null>("equation");
  const [selectedCitationId, setSelectedCitationId] = useState<string>("fastvit2023");

  const citation = samplePaperCitations[selectedCitationId] || samplePaperCitations["fastvit2023"];
  const equation = sampleEquations["saliency-gate"];

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 sm:mt-14 relative z-20">
      {/* Decorative hairline glow border behind card */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-accent/20 via-border/40 to-transparent blur-md opacity-40 dark:opacity-60 -z-10" />

      <div className="academic-card rounded-2xl overflow-hidden border border-border/80 dark:border-white/12 bg-card shadow-academic-lg">
        {/* Terminal / Academic Viewer Header */}
        <div className="px-4 py-3 border-b border-border/70 dark:border-white/10 bg-muted/40 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="font-mono font-medium text-muted-foreground ml-1.5 hidden sm:inline">
              arXiv:2403.18921v2 [cs.CV]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Evidence Lens Active</span>
            </span>
            <span className="hidden sm:inline-flex text-[11px] text-muted-foreground items-center gap-1 font-mono">
              Hover to inspect <KeyCap>⌥</KeyCap>
            </span>
          </div>
        </div>

        {/* Paper Content & Lens Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70 dark:divide-white/10">
          {/* Left: Interactive Manuscript Excerpt (7 Cols) */}
          <div className="lg:col-span-7 p-5 sm:p-7 bg-background/50 space-y-4">
            <div className="border-b border-border/50 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Conference Manuscript • NeurIPS 2024 (Oral)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug mt-1">
                Adaptive Hardware-Aware Saliency Gating in Vision Transformers
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Y. Chen, M. Zhang, S. Thorne — Stanford AI Lab & Max Planck
              </p>
            </div>

            {/* Simulated Dual-Column Paper Body */}
            <div className="space-y-3 text-xs leading-relaxed text-foreground/85">
              <p>
                Dense vision transformers incur high latency on edge hardware due to redundant background patch computations. Unlike static token pruning schemes like SpViT{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCitationId("spvit2022");
                    setActiveInspectType("citation");
                  }}
                  className={`inline-flex items-center font-mono font-semibold px-1 py-0.5 rounded transition-colors ${
                    activeInspectType === "citation" && selectedCitationId === "spvit2022"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40"
                      : "text-accent hover:bg-accent/10"
                  }`}
                  title="Inspect citation [24]"
                >
                  [24]
                </button>
                , we propose dynamic saliency gating guided by early-exit projections.
              </p>

              {/* Equation Box (Clickable / Hoverable) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveInspectType("equation")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveInspectType("equation");
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer font-mono text-xs sm:text-[13px] ${
                  activeInspectType === "equation"
                    ? "bg-accent/10 border-accent/40 shadow-xs ring-1 ring-accent/30"
                    : "bg-muted/30 border-border/70 hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-accent">
                    <Calculator className="w-3 h-3" /> Eq. 3 — Saliency Gate
                  </span>
                  <span className="font-mono text-[10px]">Click to deconstruct AST</span>
                </div>
                <div className="text-center py-1.5 font-bold text-foreground overflow-x-auto">
                  𝒢(xᵢ) = σ(W₂ · GELU(W₁xᵢ + b₁)) ⊙ 𝕀_τ
                </div>
              </div>

              <p>
                When evaluated against SOTA FastViT{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCitationId("fastvit2023");
                    setActiveInspectType("citation");
                  }}
                  className={`inline-flex items-center font-mono font-semibold px-1 py-0.5 rounded transition-colors ${
                    activeInspectType === "citation" && selectedCitationId === "fastvit2023"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40"
                      : "text-accent hover:bg-accent/10"
                  }`}
                  title="Inspect citation [12]"
                >
                  [12]
                </button>{" "}
                and MobileNetV4{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCitationId("mobilenetv4");
                    setActiveInspectType("citation");
                  }}
                  className={`inline-flex items-center font-mono font-semibold px-1 py-0.5 rounded transition-colors ${
                    activeInspectType === "citation" && selectedCitationId === "mobilenetv4"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40"
                      : "text-accent hover:bg-accent/10"
                  }`}
                  title="Inspect citation [31]"
                >
                  [31]
                </button>
                , our architecture reduces inference latency by 32% on NVIDIA Jetson Orin Nano with &lt; 0.4% Top-1 ImageNet accuracy degradation.
              </p>
            </div>
          </div>

          {/* Right: Live Lens Inspector Dossier (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-white/10 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  {activeInspectType === "equation" ? "Equation Deconstruction" : "Citation Provenance"}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  AST Verified
                </span>
              </div>

              <AnimatePresence mode="wait">
                {activeInspectType === "equation" ? (
                  <motion.div
                    key="equation"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {equation.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        {equation.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Symbolic Breakdown
                      </div>
                      {equation.terms.map((term, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 border border-border/60 text-xs"
                        >
                          <code className="font-mono text-[11px] font-bold text-accent min-w-[28px]">
                            {term.symbol}
                          </code>
                          <span className="text-[11px] text-muted-foreground leading-tight">
                            {term.meaning}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Proof invariant confirmed across dimensions (B, N, C)</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={citation.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          {citation.marker}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {citation.venue} {citation.year}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground mt-1.5 leading-snug">
                        {citation.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {citation.authors} • {citation.citationCount} citations
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs leading-relaxed space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Core Finding Extracted
                      </div>
                      <p className="text-foreground/90 text-xs">
                        "{citation.keyFinding}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
                      <span>DOI: {citation.doi}</span>
                      <span className="text-accent flex items-center gap-0.5">
                        Verified <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Switch Buttons */}
            <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                Switch Target:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveInspectType("equation")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeInspectType === "equation"
                      ? "bg-accent text-accent-foreground shadow-2xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  Equation AST
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInspectType("citation");
                    setSelectedCitationId("fastvit2023");
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeInspectType === "citation"
                      ? "bg-accent text-accent-foreground shadow-2xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  Citations (3)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
