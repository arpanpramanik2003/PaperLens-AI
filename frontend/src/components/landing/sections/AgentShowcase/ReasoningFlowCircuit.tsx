import { motion } from "framer-motion";
import {
  Terminal,
  Code2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ReasoningFlowCircuitProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
  isRunning?: boolean;
}

interface FlowNode {
  id: string;
  num: string;
  label: string;
  sublabel: string;
  icon: typeof Terminal;
  cx: number;
  cy: number;
  stageName: string;
}

const FLOW_NODES: FlowNode[] = [
  {
    id: "step-1",
    num: "01",
    label: "Goal Ingestion",
    sublabel: "Deconstruct Objective",
    icon: Terminal,
    cx: 80,
    cy: 65,
    stageName: "AST Deconstruction",
  },
  {
    id: "step-2",
    num: "02",
    label: "Citation Search",
    sublabel: "Query Citation Graph",
    icon: Code2,
    cx: 260,
    cy: 65,
    stageName: "Semantic Scholar Lineage",
  },
  {
    id: "step-3",
    num: "03",
    label: "Multi-Synthesis",
    sublabel: "Synthesize Novelty",
    icon: Layers,
    cx: 440,
    cy: 65,
    stageName: "Novelty Matrix Delta",
  },
  {
    id: "step-4",
    num: "04",
    label: "Self-Critique",
    sublabel: "Stress-Test Confounders",
    icon: ShieldCheck,
    cx: 620,
    cy: 65,
    stageName: "Adversarial Reviewer #2",
  },
  {
    id: "step-5",
    num: "05",
    label: "Verified Output",
    sublabel: "Publication Dossier",
    icon: CheckCircle2,
    cx: 800,
    cy: 65,
    stageName: "Cryptographic Provenance",
  },
];

export default function ReasoningFlowCircuit({
  activeStepId,
  onSelectStep,
  isRunning = false,
}: ReasoningFlowCircuitProps) {
  const activeIndex = FLOW_NODES.findIndex((n) => n.id === activeStepId);
  const safeIndex = activeIndex === -1 ? 2 : activeIndex;

  return (
    <div className="w-full bg-card/90 border-b border-border/70 dark:border-white/10 p-4 sm:p-5 overflow-hidden select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Multi-Step Reasoning Circuit
          </span>
          <span className="text-[11px] font-mono text-accent bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-semibold">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {isRunning ? "Autonomous Loop Executing..." : "Autonomous Closed-Loop"}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent inline" />
          Click any stage to inspect live telemetry & verified proofs
        </p>
      </div>

      {/* Desktop & Tablet SVG Circuit (>=640px) */}
      <div className="hidden sm:block relative w-full overflow-x-auto">
        <div className="min-w-[840px] relative py-1">
          <svg
            viewBox="0 0 880 130"
            className="w-full h-auto overflow-visible"
            aria-label="Agent Reasoning Loop Circuit"
          >
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
              </linearGradient>

              <linearGradient id="loopbackGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
              </linearGradient>

              <marker
                id="circuitArrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--accent))" />
              </marker>

              <marker
                id="loopbackArrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
              </marker>

              {/* Glowing Particle Filter */}
              <filter id="circuitGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Wire Pipeline */}
            <path
              d="M 80 65 L 800 65"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2.5"
            />

            {/* Completed / Active Flow Wire */}
            <path
              d={`M 80 65 L ${Math.min(800, 80 + safeIndex * 180)} 65`}
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Animated Flowing Data Packets along Active Segment */}
            {isRunning && (
              <motion.circle
                r="4.5"
                fill="#38bdf8"
                filter="url(#circuitGlow)"
                animate={{
                  cx: [80, Math.min(800, 80 + safeIndex * 180)],
                  cy: [65, 65],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Animated Loopback Path (Stage 4 -> Stage 2: Adversarial Refinement Loop) */}
            <path
              d="M 620 48 C 620 10, 260 10, 260 48"
              fill="none"
              stroke="url(#loopbackGradient)"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#loopbackArrow)"
            />

            {/* Loopback Interactive Capsule Badge */}
            <g
              transform="translate(440, 16)"
              className="cursor-pointer group"
              onClick={() => onSelectStep("step-4")}
            >
              <rect
                x="-95"
                y="-10"
                width="190"
                height="20"
                rx="10"
                fill="hsl(var(--card))"
                stroke="#f59e0b"
                strokeWidth="1.2"
                className="transition-all group-hover:fill-amber-500/10 shadow-xs"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#f59e0b"
                fontFamily="monospace"
              >
                ↻ Adversarial Refine Loop
              </text>
            </g>

            {/* Circuit Nodes */}
            {FLOW_NODES.map((node, idx) => {
              const isSelected = activeStepId === node.id || (node.id === "step-5" && activeStepId === "step-4");
              const isPast = idx < safeIndex;
              const Icon = node.icon;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.cx}, ${node.cy})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectStep(node.id)}
                >
                  {/* Outer Pulsing Aura when active */}
                  {isSelected && (
                    <circle
                      r="26"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                      className="animate-ping"
                      style={{ transformOrigin: "0 0" }}
                    />
                  )}

                  {/* Main Node Background Disk */}
                  <circle
                    r="22"
                    fill="hsl(var(--card))"
                    stroke={
                      isSelected
                        ? "hsl(var(--accent))"
                        : isPast
                        ? "#10b981"
                        : "hsl(var(--border))"
                    }
                    strokeWidth={isSelected ? "2.5" : "2"}
                    className="transition-all duration-200 group-hover:stroke-accent shadow-sm"
                  />

                  {/* Inner Status Aura */}
                  {isSelected && (
                    <circle
                      r="16"
                      fill="hsl(var(--accent))"
                      fillOpacity="0.12"
                    />
                  )}

                  {/* Icon or Step Number */}
                  <g transform="translate(-8, -8)">
                    <Icon
                      width="16"
                      height="16"
                      className={`transition-colors ${
                        isSelected
                          ? "text-accent"
                          : isPast
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </g>

                  {/* Step Number Tag */}
                  <g transform="translate(10, -14)">
                    <circle r="7" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill="hsl(var(--foreground))"
                      fontFamily="monospace"
                    >
                      {node.num}
                    </text>
                  </g>

                  {/* Top Pointer Needle when Selected */}
                  {isSelected && (
                    <polygon
                      points="0,-27 -5,-33 5,-33"
                      fill="#f59e0b"
                    />
                  )}

                  {/* Primary Node Label */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isSelected ? "700" : "600"}
                    fill={isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                    className="transition-colors group-hover:fill-foreground"
                  >
                    {node.label}
                  </text>

                  {/* Subtitle / Action Label */}
                  <text
                    x="0"
                    y="48"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill="hsl(var(--muted-foreground))"
                    fontFamily="monospace"
                    opacity="0.8"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Mobile Responsive Step Track (<640px) */}
      <div className="sm:hidden grid grid-cols-2 gap-2 mt-2">
        {FLOW_NODES.slice(0, 4).map((node) => {
          const isSelected = activeStepId === node.id;
          const Icon = node.icon;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectStep(node.id)}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                isSelected
                  ? "bg-accent/10 border-accent text-accent font-semibold shadow-xs"
                  : "bg-card border-border/70 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold truncate leading-tight">{node.label}</div>
                <div className="text-[9px] font-mono text-muted-foreground truncate">{node.sublabel}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
