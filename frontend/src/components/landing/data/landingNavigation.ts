export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Agent Mode", href: "#agent-mode" },
  { label: "Workstation", href: "#features" },
  { label: "Pipeline", href: "#how-it-works" },
  { label: "Academic Rigor", href: "#evidence" },
  { label: "About", href: "#about" },
];

export interface FooterCapability {
  label: string;
  href: string;
  isAccent?: boolean;
}

export const footerCapabilities: FooterCapability[] = [
  { label: "Paper Analyzer", href: "/dashboard/analyzer" },
  { label: "Autonomous Agent Mode", href: "/agent", isAccent: true },
  { label: "Experiment & Ablation Planner", href: "/dashboard/planner" },
  { label: "Problem Statement Generator", href: "/dashboard/generator" },
  { label: "Gap Detection Engine", href: "/dashboard/gaps" },
  { label: "Dataset & Benchmark Finder", href: "/dashboard/dataset-benchmarks" },
  { label: "Citation Intelligence Graph", href: "/dashboard/citation-intelligence" },
];
