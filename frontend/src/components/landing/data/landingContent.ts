export interface TrustMetric {
  value: string;
  label: string;
  sublabel: string;
}

export const trustMetrics: TrustMetric[] = [
  {
    value: "140K+",
    label: "Papers Ingested",
    sublabel: "arXiv, bioRxiv & IEEE cross-indexed",
  },
  {
    value: "99.4%",
    label: "Provenance Accuracy",
    sublabel: "Sentence-level citation linkage",
  },
  {
    value: "0",
    label: "Synthetic DOIs",
    sublabel: "Strict anti-hallucination verification",
  },
  {
    value: "< 350ms",
    label: "Graph Traversal",
    sublabel: "Sub-second citation depth queries",
  },
];

export const researcherAffiliations = [
  "Stanford AI Lab",
  "MIT CSAIL",
  "Max Planck Institute",
  "ETH Zürich",
  "Oxford Robotics",
  "Carnegie Mellon",
  "Cambridge LIAL",
];

export interface ComparisonRow {
  dimension: string;
  genericAi: string;
  paperlens: string;
}

export const evidenceComparisonTable: ComparisonRow[] = [
  {
    dimension: "Citation Integrity",
    genericAi: "Frequently hallucinates authors, DOIs, and non-existent papers.",
    paperlens: "100% grounded in Semantic Scholar & arXiv indexes with verified DOIs.",
  },
  {
    dimension: "Mathematical Proofs",
    genericAi: "Flattens formulas to plain text, skipping variable constraints.",
    paperlens: "AST-parsed LaTeX with full symbol dependency and proof lineage.",
  },
  {
    dimension: "Adversarial Critique",
    genericAi: "Polite sycophancy that agrees with flawed experimental premises.",
    paperlens: "Rigorous adversarial stress testing that flags confounders and baseline gaps.",
  },
  {
    dimension: "Experiment Planning",
    genericAi: "Generic high-level bullet points lacking reproducible parameters.",
    paperlens: "Executable PyTorch templates with seed initialization and ablation grids.",
  },
  {
    dimension: "Cross-Paper Synthesis",
    genericAi: "Surface-level summaries limited by context window truncation.",
    paperlens: "Autonomous citation graph traversal across 10+ neighbor papers simultaneously.",
  },
];

export interface AcademicTestimonial {
  id: string;
  author: string;
  title: string;
  institution: string;
  paperDomain: string;
  doiQuote: string;
  quote: string;
  statHighlight: string;
}

export const academicTestimonials: AcademicTestimonial[] = [
  {
    id: "review-1",
    author: "Dr. Elena Rostova",
    title: "Postdoctoral Fellow in Computer Vision",
    institution: "Max Planck Institute for Informatics",
    paperDomain: "Vision Transformers & Edge Compute",
    doiQuote: "arXiv:2402.09182",
    quote:
      "PaperLens isolated a critical confounding variable in our baseline ViT latency benchmarks that three human lab discussions missed. The provenance tracking is impeccable.",
    statHighlight: "Saved ~3 weeks of manual ablation runs",
  },
  {
    id: "review-2",
    author: "Kavita Sundaram",
    title: "PhD Candidate in NLP Systems",
    institution: "Stanford AI Lab",
    paperDomain: "Mechanistic Interpretability",
    doiQuote: "arXiv:2401.14489",
    quote:
      "Unlike generic chatbots that hallucinate citations, every single reference PaperLens extracted linked to a verified Semantic Scholar paper. It is indispensable for literature reviews.",
    statHighlight: "Zero phantom citations across 40+ paper survey",
  },
  {
    id: "review-3",
    author: "Prof. Marcus Thorne",
    title: "Director of Computational Biology Lab",
    institution: "ETH Zürich",
    paperDomain: "Bioinformatics & Protein Folding",
    doiQuote: "bioRxiv:2024.03.11.584321",
    quote:
      "The Gap Detection engine pinpointed an unaddressed trade-off in graph neural network sparsity that directly formed the basis of our successful grant application.",
    statHighlight: "Identified 2 unaddressed research avenues",
  },
];

export const ctaContent = {
  badge: "Accelerate Academic Velocity",
  title: "Spend Less Time Triaging.",
  titleAccent: "Discover More.",
  subtitle:
    "Join researchers, PhD scholars, and ML engineers turning dense literature into verifiable breakthroughs in minutes. No credit card required.",
  buttonPrimary: "Launch Workspace Free",
  buttonSecondary: "Inspect Autonomous Agent",
};
