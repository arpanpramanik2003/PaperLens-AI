export interface CitationInspectorTarget {
  id: string;
  marker: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  doi: string;
  citationCount: number;
  keyFinding: string;
}

export const samplePaperCitations: Record<string, CitationInspectorTarget> = {
  "fastvit2023": {
    id: "fastvit2023",
    marker: "[12]",
    title: "FastViT: A Fast Hybrid Vision Transformer Using Structural Reparameterization",
    authors: "Vasu et al.",
    venue: "ICCV",
    year: 2023,
    doi: "10.1109/ICCV51070.2023.00531",
    citationCount: 148,
    keyFinding: "Reparameterization cuts memory latency on mobile GPUs by 38% at 81.2% Top-1 ImageNet.",
  },
  "spvit2022": {
    id: "spvit2022",
    marker: "[24]",
    title: "SpViT: Enabling Faster Vision Transformers via Structural Pruning",
    authors: "Kong et al.",
    venue: "NeurIPS",
    year: 2022,
    doi: "10.48550/arXiv.2112.13876",
    citationCount: 96,
    keyFinding: "Uniform token pruning degrades boundary localization in dense object detection.",
  },
  "mobilenetv4": {
    id: "mobilenetv4",
    marker: "[31]",
    title: "MobileNetV4 — Universal Models for the Mobile Ecosystem",
    authors: "Qin et al.",
    venue: "CVPR",
    year: 2024,
    doi: "10.48550/arXiv.2404.10518",
    citationCount: 52,
    keyFinding: "UIB (Universal Inverted Bottleneck) maximizes hardware efficiency across CPU, DSP & NPU.",
  },
};

export interface EquationInspectorTarget {
  id: string;
  latex: string;
  name: string;
  description: string;
  terms: { symbol: string; meaning: string }[];
}

export const sampleEquations: Record<string, EquationInspectorTarget> = {
  "saliency-gate": {
    id: "saliency-gate",
    name: "Early Saliency Routing Head",
    latex: "\\mathcal{G}(x_i) = \\sigma\\left( \\mathbf{W}_2 \\cdot \\text{GELU}(\\mathbf{W}_1 x_i + b_1) \\right) \\odot \\mathbb{I}_{\\tau}",
    description: "Evaluates token saliency at layer 3 to bypass dense self-attention for redundant background patches.",
    terms: [
      { symbol: "x_i", meaning: "Token embedding of patch i from layer l" },
      { symbol: "\\sigma", meaning: "Sigmoid gating activation" },
      { symbol: "\\mathbb{I}_{\\tau}", meaning: "Indicator mask passing tokens with score > threshold \\tau" },
      { symbol: "\\mathbf{W}_1, \\mathbf{W}_2", meaning: "Low-rank bottleneck projection matrices (rank=16)" },
    ],
  },
};

export interface ReviewerTwoFeedback {
  type: "reviewer-two" | "copilot";
  headline: string;
  body: string;
  severity: "critical" | "moderate" | "actionable";
  recommendation: string;
}

export const reviewerCritiques: {
  copilot: ReviewerTwoFeedback;
  reviewerTwo: ReviewerTwoFeedback;
} = {
  copilot: {
    type: "copilot",
    headline: "Cache Warmup Latency Guard",
    body: "Initial latency measurements on ARM Cortex-A76 show 1.4ms variance during early cold runs. We added an automated 50-batch warmup phase to standardize measurement percentiles.",
    severity: "actionable",
    recommendation: "Report both P50 and P99 latency alongside mean throughput.",
  },
  reviewerTwo: {
    type: "reviewer-two",
    headline: "Reviewer #2 Stress Test (NeurIPS Style)",
    body: "The authors boast a '32% latency reduction', yet fail to report performance on fixed-graph compilers (TensorRT/ONNX) where dynamic token counts cause graph recompilation stalls! Reject unless verified with fixed shape masking.",
    severity: "critical",
    recommendation: "Add Section 4.4 showing static INT4 attention mask ablations on fixed TensorRT engines.",
  },
};
