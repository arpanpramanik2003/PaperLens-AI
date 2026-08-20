import { motion } from "framer-motion";
import { Terminal, Code2, Layers, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";

interface ReasoningLoopFlowProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
}

const flowNodes = [
  {
    id: "step-1",
    num: "01",
    label: "Goal Ingestion",
    sublabel: "Decompose Objective",
    icon: Terminal,
    tool: "AgentPlanner.decompose",
    cx: 80,
    cy: 70,
  },
  {
    id: "step-2",
    num: "02",
    label: "Tool Dispatch",
    sublabel: "Query Citation Graph",
    icon: Code2,
    tool: "CitationGraph.retrieve",
    cx: 260,
    cy: 70,
  },
  {
    id: "step-3",
    num: "03",
    label: "Multi-Synthesis",
    sublabel: "Extract Novel Directions",
    icon: Layers,
    tool: "NoveltyValidator.synthesize",
    cx: 440,
    cy: 70,
  },
  {
    id: "step-4",
    num: "04",
    label: "Self-Critique",
    sublabel: "Stress-Test Confounders",
    icon: ShieldCheck,
    tool: "SelfCritique.evaluate",
    cx: 620,
    cy: 70,
  },
  {
    id: "step-5",
    num: "05",
    label: "Verified Output",
    sublabel: "Publication Dossier",
    icon: CheckCircle2,
    tool: "DossierCompiler.seal",
    cx: 800,
    cy: 70,
  },
];

export default function ReasoningLoopFlow({ activeStepId, onSelectStep }: ReasoningLoopFlowProps) {
  return (
    <div className="w-full bg-card/80 border-b border-border p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Interactive Architecture
          </span>
          <span className="text-[11px] font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
            Autonomous Closed-Loop
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Click any stage to inspect live telemetry & generated artifacts
        </p>
      </div>

      {/* Desktop & Tablet SVG Circuit (>=640px) */}
      <div className="hidden sm:block relative w-full overflow-x-auto">
        <div className="min-w-[840px] relative py-2">
          <svg
            viewBox="0 0 880 140"
            className="w-full h-auto overflow-visible select-none"
            aria-label="Agent Reasoning Loop Diagram"
          >
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.8" />
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
              d="M 80 70 L 800 70"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />

            {/* Active Highlight Stroke */}
            <path
              d="M 80 70 L 800 70"
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />

            {/* Animated Loopback Path (Node 4 -> Node 2: Adversarial Refinement Loop) */}
            <path
              d="M 620 50 C 620 12, 260 12, 260 50"
              fill="none"
              stroke="url(#loopbackGradient)"
              strokeWidth="2"
              strokeDasharray="6 4"
              markerEnd="url(#loopbackArrow)"
            />

            {/* Loopback Label */}
            <g transform="translate(440, 18)">
              <rect
                x="-85"
                y="-10"
                width="170"
                height="20"
                rx="10"
                fill="hsl(var(--card))"
                stroke="hsl(var(--warning) / 0.4)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.5"
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
                      r="28"
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
                    r="22"
                    fill="hsl(var(--card))"
                    stroke={isSelected ? "hsl(var(--accent))" : "hsl(var(--border))"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    className="transition-all duration-200 group-hover:stroke-accent"
                  />

                  {/* Node Badge */}
                  <foreignObject x="-14" y="-14" width="28" height="28" className="pointer-events-none">
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isSelected ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                    </div>
                  </foreignObject>

                  {/* Node Title & Subtitle */}
                  <text
                    y="36"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                    className="transition-colors group-hover:fill-foreground"
                  >
                    {node.label}
                  </text>
                  <text
                    y="49"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="400"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {node.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Mobile Stepper Flow (<640px) */}
      <div className="sm:hidden grid grid-cols-1 gap-2.5">
        {flowNodes.map((node, index) => {
          const isSelected = activeStepId === node.id || (node.id === "step-5" && activeStepId === "step-4");
          const Icon = node.icon;
          return (
            <button
              key={node.id}
              onClick={() => onSelectStep(node.id)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "bg-accent/10 border-accent/50 shadow-xs"
                  : "bg-muted/30 border-border hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isSelected
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>{node.num}. {node.label}</span>
                    {node.id === "step-4" && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-warning/15 text-warning">
                        ↻ Loop
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{node.sublabel}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{node.tool.split(".")[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
