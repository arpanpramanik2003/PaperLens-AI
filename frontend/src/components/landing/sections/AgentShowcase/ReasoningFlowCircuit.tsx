import { motion } from "framer-motion";
import { Terminal, Code2, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ReasoningFlowCircuitProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
}

const flowNodes = [
  {
    id: "step-1",
    num: "01",
    label: "Goal Ingestion",
    sublabel: "Deconstruct Objective",
    icon: Terminal,
    tool: "AgentPlanner.decompose",
    cx: 80,
    cy: 65,
  },
  {
    id: "step-2",
    num: "02",
    label: "Citation Search",
    sublabel: "Query Citation Graph",
    icon: Code2,
    tool: "CitationGraph.retrieve",
    cx: 260,
    cy: 65,
  },
  {
    id: "step-3",
    num: "03",
    label: "Multi-Synthesis",
    sublabel: "Synthesize Novelty",
    icon: Layers,
    tool: "NoveltyValidator.synthesize",
    cx: 440,
    cy: 65,
  },
  {
    id: "step-4",
    num: "04",
    label: "Self-Critique",
    sublabel: "Stress-Test Confounders",
    icon: ShieldCheck,
    tool: "SelfCritique.evaluate",
    cx: 620,
    cy: 65,
  },
  {
    id: "step-5",
    num: "05",
    label: "Verified Output",
    sublabel: "Publication Dossier",
    icon: CheckCircle2,
    tool: "DossierCompiler.seal",
    cx: 800,
    cy: 65,
  },
];

export default function ReasoningFlowCircuit({
  activeStepId,
  onSelectStep,
}: ReasoningFlowCircuitProps) {
  return (
    <div className="w-full bg-card/90 border-b border-border/70 dark:border-white/10 p-4 sm:p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Multi-Step Reasoning Circuit
          </span>
          <span className="text-[11px] font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
            Autonomous Closed-Loop
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-mono">
          Click any stage to inspect live telemetry & verified proofs
        </p>
      </div>

      {/* Desktop & Tablet SVG Circuit (>=640px) */}
      <div className="hidden sm:block relative w-full overflow-x-auto">
        <div className="min-w-[840px] relative py-1">
          <svg
            viewBox="0 0 880 130"
            className="w-full h-auto overflow-visible select-none"
            aria-label="Agent Reasoning Loop Circuit"
          >
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--evidence, 158 75% 40%))" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="loopbackGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
              </linearGradient>

              <marker
                id="arrowhead"
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
                <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--warning))" />
              </marker>
            </defs>

            {/* Base Horizontal Connection Pipeline */}
            <path
              d="M 80 65 L 800 65"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />

            {/* Active Highlight Stroke */}
            <path
              d="M 80 65 L 800 65"
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />

            {/* Animated Loopback Path (Node 4 -> Node 2: Adversarial Refinement Loop) */}
            <path
              d="M 620 48 C 620 12, 260 12, 260 48"
              fill="none"
              stroke="url(#loopbackGradient)"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#loopbackArrow)"
            />

            {/* Loopback Label */}
            <g transform="translate(440, 16)">
              <rect
                x="-85"
                y="-9"
                width="170"
                height="18"
                rx="9"
                fill="hsl(var(--card))"
                stroke="hsl(var(--warning) / 0.4)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="hsl(var(--warning))"
                fontFamily="monospace"
              >
                ↻ Adversarial Refine Loop
              </text>
            </g>

            {/* Flow Nodes */}
            {flowNodes.map((node) => {
              const isSelected = activeStepId === node.id || (node.id === "step-5" && activeStepId === "step-4");
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

                  {/* Node Background Circle */}
                  <circle
                    r="20"
                    fill="hsl(var(--card))"
                    stroke={isSelected ? "hsl(var(--accent))" : "hsl(var(--border))"}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    className="transition-all duration-200 group-hover:stroke-accent/70"
                  />

                  {/* Number Badge */}
                  <circle
                    cx="14"
                    cy="-14"
                    r="8"
                    fill={isSelected ? "hsl(var(--accent))" : "hsl(var(--muted))"}
                  />
                  <text
                    x="14"
                    y="-11"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill={isSelected ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))"}
                    fontFamily="monospace"
                  >
                    {node.num}
                  </text>

                  {/* Icon Render */}
                  <foreignObject x="-10" y="-10" width="20" height="20">
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                    </div>
                  </foreignObject>

                  {/* Labels */}
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="hsl(var(--foreground))"
                    className="select-none"
                  >
                    {node.label}
                  </text>
                  <text
                    x="0"
                    y="44"
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="hsl(var(--muted-foreground))"
                    fontFamily="monospace"
                    className="select-none"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Mobile Flow (Row of Pills) */}
      <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
        {flowNodes.map((node) => {
          const isSelected = activeStepId === node.id;
          const Icon = node.icon;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectStep(node.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "bg-muted/40 border border-border/60 text-muted-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{node.num}</span>
              <span>{node.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
