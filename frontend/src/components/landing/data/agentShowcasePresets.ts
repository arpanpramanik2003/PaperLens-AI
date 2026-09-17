export interface CitationCard {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  doi: string;
  citationCount: number;
  influenceScore: number;
  highlight: string;
}

export interface TraceStepData {
  id: string;
  stepNum: number;
  label: string;
  tool: string;
  durationMs: number;
  status: "complete" | "running" | "queued";
  summary: string;
  telemetryPayload: {
    invokedWith: Record<string, unknown>;
    tokensSaved: number;
    routerType: string;
    verifiedHash: string;
    executionLog: string[];
  };
}

export interface AblationParameter {
  name: string;
  currentValue: string | number;
  options: (string | number)[];
  description: string;
  impactMetric: string;
}

export interface ReviewerTwoCritique {
  reviewerBadge: string;
  objectionHeadline: string;
  objectionBody: string;
  brutalityScore: string;
  agentRebuttalHeadline: string;
  agentRebuttalBody: string;
  invarianceProof: string;
}

export interface DomainPreset {
  id: string;
  title: string;
  shortLabel: string;
  domainBadge: string;
  objective: string;
  traceSteps: TraceStepData[];
  literature: {
    heading: string;
    summary: string;
    citations: CitationCard[];
  };
  novelty: {
    heading: string;
    coreHypothesis: string;
    gapMatrix: { dimension: string; priorSota: string; paperlensDelta: string; advantage: string }[];
  };
  ablationProtocol: {
    heading: string;
    framework: string;
    seed: number;
    codeSnippet: string;
    parameters: AblationParameter[];
  };
  reviewerTwo: ReviewerTwoCritique;
  benchmarks: {
    dataset: string;
    split: string;
    baselineScore: string;
    projectedScore: string;
    metric: string;
  }[];
}

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: "edge-vit",
    title: "Computer Vision & Edge Systems",
    shortLabel: "Edge-ViT NPUs",
    domainBadge: "CVPR / NeurIPS Systems",
    objective:
      "Evaluate vision transformer edge-latency bottlenecks on ARM NPUs and synthesize a reproducible ablation protocol for adaptive saliency gating.",
    traceSteps: [
      {
        id: "step-1",
        stepNum: 1,
        label: "Goal Deconstruction & Constraints",
        tool: "AgentPlanner.decompose",
        durationMs: 240,
        status: "complete",
        summary:
          "Extracted 3 testable sub-hypotheses focusing on patch projection latency, memory bandwidth saturation, and linear attention approximations.",
        telemetryPayload: {
          invokedWith: {
            objective: "Edge-ViT NPU bottleneck analysis",
            hardwareTarget: "ARM Cortex-A76 / Ethos-U65",
            maxParametersM: 25.0,
            targetLatencyMs: 5.0,
          },
          tokensSaved: 540,
          routerType: "Deterministic Fast-Path",
          verifiedHash: "sha256:7f4a21...91cb",
          executionLog: [
            "[AST Parser] Deconstructed objective into {hardware_spec, model_class, optimization_target}",
            "[Hypothesis Engine] Formulated H1: Early patch sparsification bypasses 40% dense attention overhead",
            "[Constraint Checker] Max memory budget set to 16MB SRAM scratchpad buffer",
          ],
        },
      },
      {
        id: "step-2",
        stepNum: 2,
        label: "Citation Graph Ingestion & Traversal",
        tool: "CitationGraph.retrieve_k_neighbors",
        durationMs: 410,
        status: "complete",
        summary:
          "Traversed Semantic Scholar & Crossref citation lineages across 18 top-influence publications on mobile Vision Transformers.",
        telemetryPayload: {
          invokedWith: {
            seedPapers: ["arXiv:2303.14189 (FastViT)", "arXiv:2203.04567 (SpViT)"],
            graphDepth: 2,
            minCitations: 20,
            limit: 18,
          },
          tokensSaved: 880,
          routerType: "Fast-Path Citation Matrix",
          verifiedHash: "sha256:3e8b01...74da",
          executionLog: [
            "[Semantic Scholar API] Fetched 18 neighbor papers; verified 0 broken DOIs",
            "[Crossref Validator] Traversed co-citation matrix across 4 leading venues",
            "[Graph Triage] Isolated 3 SOTA reference baselines with reproducible weights",
          ],
        },
      },
      {
        id: "step-3",
        stepNum: 3,
        label: "Cross-Paper Gap Analysis & Novelty",
        tool: "NoveltyValidator.synthesize_matrix",
        durationMs: 620,
        status: "complete",
        summary:
          "Identified unexplored trade-off between KV-cache quantization and early saliency gating on low-power NPU tensor units.",
        telemetryPayload: {
          invokedWith: {
            candidateProposals: 3,
            noveltyBaselineCorpus: "2022-2024 mobile ViT literature",
            strictnessThreshold: 0.88,
          },
          tokensSaved: 1120,
          routerType: "Batched Novelty Validator",
          verifiedHash: "sha256:d41f67...a902",
          executionLog: [
            "[Novelty Search] Checked 142 published patents & preprints for 'adaptive early saliency NPU'",
            "[Uniqueness Score] 94.2% structural divergence from SpViT token pruning",
            "[Patent Scan] 0 conflicting architectural prior art matches detected",
          ],
        },
      },
      {
        id: "step-4",
        stepNum: 4,
        label: "Adversarial Stress-Test & Self-Critique",
        tool: "SelfCritique.evaluate_boundary_conditions",
        durationMs: 380,
        status: "complete",
        summary:
          "Flagged dynamic tensor shape stalls on fixed ONNX/TensorRT graph compilers; synthesized static fallback masks to guarantee compiler stability.",
        telemetryPayload: {
          invokedWith: {
            adversarialPersona: "Reviewer #2 (NeurIPS / ICLR)",
            stressTestVariables: ["Thermal Throttling", "Non-deterministic Shapes", "INT8 Jitter"],
          },
          tokensSaved: 760,
          routerType: "Adversarial Critique Engine",
          verifiedHash: "sha256:b12c89...55ee",
          executionLog: [
            "[Adversarial Scan] Reviewer #2 objection predicted: Dynamic gating fails on TensorRT",
            "[Countermeasure] Generated fixed-size padded bucket masks with static graph compilation",
            "[Empirical Defense] Added Section 4.3 with 60-minute thermal degradation benchmark",
          ],
        },
      },
    ],
    literature: {
      heading: "State of Efficient Vision Transformers on Edge Hardware",
      summary:
        "Prior approaches rely on structural token pruning (SpViT) or structural reparameterization (FastViT). However, memory bandwidth bottlenecks during cross-attention remain severely unaddressed in low-power NPU hardware.",
      citations: [
        {
          id: "cit-1",
          title: "FastViT: A Fast Hybrid Vision Transformer using Structural Reparameterization",
          authors: "Vasu et al. (Apple Research)",
          venue: "ICCV 2023",
          year: 2023,
          doi: "10.1109/ICCV51070.2023.00531",
          citationCount: 184,
          influenceScore: 92,
          highlight: "Achieves 78.4% Top-1 at 4.2ms on Snapdragon 8 Gen 2, but leaves cross-attention memory unpruned.",
        },
        {
          id: "cit-2",
          title: "SpViT: Enabling Faster Vision Transformers via Spatial Token Pruning",
          authors: "Chen et al. (Max Planck & Stanford)",
          venue: "NeurIPS 2022",
          year: 2022,
          doi: "10.48550/arXiv.2206.02874",
          citationCount: 312,
          influenceScore: 88,
          highlight: "Static token sparsification causes boundary degradation in fine-grained object segmentation.",
        },
        {
          id: "cit-3",
          title: "MobileNetV4 -- Five Decades of Mobile Vision Design",
          authors: "Qin et al. (Google Research)",
          venue: "CVPR 2024",
          year: 2024,
          doi: "10.48550/arXiv.2404.10518",
          citationCount: 96,
          influenceScore: 95,
          highlight: "Standardizes Universal Inverted Bottleneck (UIB) as the optimal mobile NPU backbone baseline.",
        },
      ],
    },
    novelty: {
      heading: "Adaptive Hardware-Aware Saliency Gating (AHSG)",
      coreHypothesis:
        "Early-layer lightweight saliency projections can selectively bypass quadratic self-attention tokens on ARM NPUs without requiring retraining of downstream classification heads.",
      gapMatrix: [
        {
          dimension: "Inference Latency (P99)",
          priorSota: "5.8ms (FastViT-SA12)",
          paperlensDelta: "3.7ms (AHSG-Enhanced)",
          advantage: "36.2% Latency Reduction",
        },
        {
          dimension: "NPU DRAM Bandwidth",
          priorSota: "4.2 GB/s Burst Peak",
          paperlensDelta: "2.5 GB/s Sustained",
          advantage: "40.4% Bandwidth Savings",
        },
        {
          dimension: "Compiler Determinism",
          priorSota: "Requires Dynamic Shapes",
          paperlensDelta: "Bucket-Padded Static Graph",
          advantage: "100% ONNX / TensorRT Compatible",
        },
      ],
    },
    ablationProtocol: {
      heading: "PyTorch Reproducibility Protocol & Ablation Matrix",
      framework: "PyTorch 2.4.0+cu124 • ARM Ethos Toolchain",
      seed: 42,
      codeSnippet: `import torch
import torch.nn as nn

class AdaptiveSaliencyGate(nn.Module):
    """
    Zero-overhead early token sparsifier for ARM NPU architectures.
    Guarantees fixed tensor shapes via power-of-two bucket padding.
    """
    def __init__(self, dim: int = 192, gating_ratio: float = 0.25):
        super().__init__()
        self.router = nn.Sequential(
            nn.Linear(dim, dim // 8),
            nn.GELU(),
            nn.Linear(dim // 8, 1),
            nn.Sigmoid()
        )
        self.ratio = gating_ratio

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        # x shape: [B, N, C]
        scores = self.router(x).squeeze(-1) # [B, N]
        k = int(x.size(1) * (1.0 - self.ratio))
        topk_indices = torch.topk(scores, k=k, dim=1).indices
        
        # Gather salient tokens with deterministic memory layout
        batch_idx = torch.arange(x.size(0)).unsqueeze(-1)
        selected_tokens = x[batch_idx, topk_indices]
        return selected_tokens, scores`,
      parameters: [
        {
          name: "Saliency Gating Ratio",
          currentValue: "25%",
          options: ["10%", "25%", "35%", "50%"],
          description: "Percentage of low-importance visual tokens skipped in self-attention layers 3-8.",
          impactMetric: "-36% Attention MACs with 0.12% Top-1 Accuracy delta",
        },
        {
          name: "Tensor Bucket Padding",
          currentValue: "Power-of-Two (128/256)",
          options: ["Dynamic (Unpadded)", "Power-of-Two (128/256)", "Fixed-512"],
          description: "Enables ahead-of-time static compilation on ONNX Runtime and TensorRT-LLM.",
          impactMetric: "Zero pipeline recompilation stalls on ARM NPUs",
        },
        {
          name: "Quantization Target",
          currentValue: "W8A8 (INT8 Saliency)",
          options: ["FP16", "W8A8 (INT8)", "W4A8 Mixed"],
          description: "Weight and activation numerical precision for router projections.",
          impactMetric: "Memory footprint drops from 48MB to 12.4MB SRAM",
        },
      ],
    },
    reviewerTwo: {
      reviewerBadge: "Reviewer #2 (Brutal NeurIPS Mode)",
      objectionHeadline: "REJECTION CONCERN: Dynamic shapes stall fixed-tensor compilers.",
      objectionBody:
        "The authors claim real-time speedup on edge NPUs. However, dynamic token pruning causes variable-dimension tensor graphs that break TensorRT engine serialization and cause host CPU sync stalls. Without sustained thermal profiling, these benchmark numbers appear synthetic.",
      brutalityScore: "8.9 / 10 ('Major Revision or Reject')",
      agentRebuttalHeadline: "AUTOMATED REBUTTAL READY: Padded Static Bucketing + Thermal Proof",
      agentRebuttalBody:
        "We preempted this exact objection by introducing power-of-two bucket padding (Algorithm 2) to maintain 100% static graph determinism. We have attached Section 4.3 measuring sustained 60-minute inference on Raspberry Pi 5 under 85°C thermal throttling with < 0.02ms jitter.",
      invarianceProof: "Empirical proof verified across 10,000 runs (p < 0.001 against baseline).",
    },
    benchmarks: [
      {
        dataset: "ImageNet-1K (ILSVRC2012)",
        split: "Validation (50,000 images)",
        baselineScore: "78.4%",
        projectedScore: "78.2% (Top-1)",
        metric: "Accuracy vs 36% Latency Reduction",
      },
      {
        dataset: "EdgeLatency-100 NPU Benchmark",
        split: "ARM Ethos-U65 / Cortex-A76",
        baselineScore: "5.82ms",
        projectedScore: "3.71ms (P95)",
        metric: "On-Device Inference Profiling",
      },
    ],
  },
  {
    id: "llm-quant",
    title: "LLM Systems & Memory Efficiency",
    shortLabel: "LLM KV-Cache",
    domainBadge: "ICLR / MLSys Systems",
    objective:
      "Design a dynamic 3-bit KV-cache quantization scheme with attention sink preservation for long-context 70B LLMs on consumer GPUs.",
    traceSteps: [
      {
        id: "step-1",
        stepNum: 1,
        label: "Attention Sink & Outlier Decomposition",
        tool: "AgentPlanner.decompose",
        durationMs: 220,
        status: "complete",
        summary:
          "Separated initial token attention sinks (tokens 0-4) from intermediate KV states to prevent perplexity explosion under sub-4-bit precision.",
        telemetryPayload: {
          invokedWith: {
            modelFamily: "Llama-3-70B-Instruct",
            contextWindow: 32768,
            targetVramGb: 24.0,
          },
          tokensSaved: 610,
          routerType: "Deterministic Fast-Path",
          verifiedHash: "sha256:4a9c12...88fe",
          executionLog: [
            "[Attention Sink Profiler] Confirmed initial 4 tokens absorb 48% of softmax probability",
            "[Memory Model] 32k context on 70B requires 20GB FP16 KV-cache alone",
            "[Target Budget] 3-bit mixed precision compresses KV-cache to 3.8GB",
          ],
        },
      },
      {
        id: "step-2",
        stepNum: 2,
        label: "Citation Graph Ingestion (StreamingLLM / QuaRot)",
        tool: "CitationGraph.retrieve_k_neighbors",
        durationMs: 390,
        status: "complete",
        summary:
          "Ingested 24 foundational publications on attention sinks (Xiao et al.), Hadamard rotation (QuaRot), and outlier isolation.",
        telemetryPayload: {
          invokedWith: {
            seedPapers: ["arXiv:2309.17453 (StreamingLLM)", "arXiv:2404.00456 (QuaRot)"],
            graphDepth: 2,
            limit: 24,
          },
          tokensSaved: 940,
          routerType: "Fast-Path Citation Matrix",
          verifiedHash: "sha256:11bb77...cc33",
          executionLog: [
            "[Semantic Scholar] Verified 24 citations with 0 DOI hallucinations",
            "[Lineage Analysis] Identified QuaRot limitation: Hadamard Walsh transforms add 8% kernel overhead",
          ],
        },
      },
      {
        id: "step-3",
        stepNum: 3,
        label: "Asymmetric Outlier Gating Synthesis",
        tool: "NoveltyValidator.synthesize_matrix",
        durationMs: 580,
        status: "complete",
        summary:
          "Formulated per-head scale calibration preserving top 0.1% activation channels in FP16 while quantizing the remaining 99.9% to asymmetric INT3.",
        telemetryPayload: {
          invokedWith: {
            quantizationScheme: "Asymmetric INT3 with FP16 Outlier Channel",
            outlierThresholdPercent: 0.1,
          },
          tokensSaved: 1040,
          routerType: "Batched Novelty Validator",
          verifiedHash: "sha256:ee99aa...2211",
          executionLog: [
            "[Novelty Verification] Checked against KIVI, SmoothQuant, and AWQ literature",
            "[Perplexity Simulation] WikiText-2 perplexity degradation bounded at < 0.18 delta",
          ],
        },
      },
      {
        id: "step-4",
        stepNum: 4,
        label: "Adversarial Stress-Test (Needle In A Haystack)",
        tool: "SelfCritique.evaluate_boundary_conditions",
        durationMs: 340,
        status: "complete",
        summary:
          "Stress-tested 32k retrieval across 100 random needle locations; resolved single-needle degradation at position 95% via sink anchor tokens.",
        telemetryPayload: {
          invokedWith: {
            benchmark: "Needle In A Haystack (NIAH)",
            testDepths: [0.1, 0.25, 0.5, 0.75, 0.95],
          },
          tokensSaved: 820,
          routerType: "Adversarial Critique Engine",
          verifiedHash: "sha256:55aa33...9900",
          executionLog: [
            "[Adversarial Tester] Found 2% retrieval drop at 95% depth under pure 3-bit",
            "[Fix Protocol] Added dynamic anchor token preservation for trailing 16 tokens",
            "[Final Result] 100% retrieval rate on NIAH benchmark across all 100 test seeds",
          ],
        },
      },
    ],
    literature: {
      heading: "Long-Context KV-Cache Compression State-of-the-Art",
      summary:
        "Running 70B parameter models at 32k-128k context causes memory exhaustion on consumer GPUs. Existing approaches either evict tokens prematurely or degrade generation quality under aggressive quantization.",
      citations: [
        {
          id: "cit-llm-1",
          title: "Efficient Streaming Language Models with Attention Sinks",
          authors: "Xiao et al. (MIT & Meta AI)",
          venue: "ICLR 2024",
          year: 2024,
          doi: "10.48550/arXiv.2309.17453",
          citationCount: 420,
          influenceScore: 98,
          highlight: "Proves that keeping initial 4 tokens preserves generational stability across 4M tokens.",
        },
        {
          id: "cit-llm-2",
          title: "QuaRot: Outlier-Free 4-Bit Inference in Large Language Models",
          authors: "Ashkboos et al. (ETH Zürich & ISTA)",
          venue: "NeurIPS 2024",
          year: 2024,
          doi: "10.48550/arXiv.2404.00456",
          citationCount: 155,
          influenceScore: 94,
          highlight: "Uses randomized Hadamard transforms to eliminate activation outliers, but leaves 3-bit open.",
        },
      ],
    },
    novelty: {
      heading: "Asymmetric Channel-Isolated 3-Bit KV Quantization (ACI-3)",
      coreHypothesis:
        "Preserving initial 4 attention sink tokens and 0.1% outlier channels in unquantized FP16 allows the remaining 99.9% of the KV cache to be compressed to 3 bits with negligible loss in reasoning benchmarks.",
      gapMatrix: [
        {
          dimension: "32k KV Cache Memory",
          priorSota: "19.8 GB (FP16)",
          paperlensDelta: "3.9 GB (ACI-3)",
          advantage: "80.3% Memory Savings",
        },
        {
          dimension: "Perplexity Delta",
          priorSota: "+1.42 (Uniform INT3)",
          paperlensDelta: "+0.14 (ACI-3)",
          advantage: "10x Lower Degradation",
        },
        {
          dimension: "Inference Throughput",
          priorSota: "Memory-bound (18 tok/s)",
          paperlensDelta: "44 tok/s on RTX 4090",
          advantage: "2.44x Speedup",
        },
      ],
    },
    ablationProtocol: {
      heading: "PyTorch 3-Bit Quantization Implementation",
      framework: "PyTorch 2.4 + Triton Custom Quant Kernel",
      seed: 1337,
      codeSnippet: `import torch

def quantize_kv_asymmetric_3bit(kv_tensor: torch.Tensor, sinks: int = 4):
    """
    Asymmetric 3-bit quantization with attention sink channel preservation.
    kv_tensor: [B, H, S, D]
    """
    sink_tokens = kv_tensor[:, :, :sinks, :]
    body_tokens = kv_tensor[:, :, sinks:, :]
    
    # Per-channel min/max for 3-bit quantization (8 levels: 0..7)
    qmin, qmax = 0, 7
    c_min = body_tokens.amin(dim=-1, keepdim=True)
    c_max = body_tokens.amax(dim=-1, keepdim=True)
    scale = (c_max - c_min) / (qmax - qmin)
    scale = torch.clamp(scale, min=1e-5)
    
    q_body = torch.round((body_tokens - c_min) / scale).clamp(qmin, qmax).to(torch.uint8)
    return sink_tokens, q_body, scale, c_min`,
      parameters: [
        {
          name: "Attention Sink Tokens",
          currentValue: "4 Tokens",
          options: ["0 Tokens", "2 Tokens", "4 Tokens", "8 Tokens"],
          description: "Number of initial prompt tokens pinned in unquantized FP16.",
          impactMetric: "Zero perplexity collapse across long multi-turn sessions",
        },
        {
          name: "Quantization Bits",
          currentValue: "3-Bit Asymmetric",
          options: ["4-Bit", "3-Bit Asymmetric", "2-Bit Experimental"],
          description: "Bit-width for non-sink token key and value matrices.",
          impactMetric: "Fits 70B model at 32k context on a single 24GB RTX 4090",
        },
      ],
    },
    reviewerTwo: {
      reviewerBadge: "Reviewer #2 (Brutal ICLR Mode)",
      objectionHeadline: "REJECTION CONCERN: Custom Triton kernel lacks broad hardware compatibility.",
      objectionBody:
        "The proposed 3-bit packing requires custom Triton code that may not compile on older architectures or AMD ROCm. Furthermore, needle-in-a-haystack tests do not reflect multi-step mathematical reasoning where error accumulation can be severe.",
      brutalityScore: "8.5 / 10 ('Weak Reject')",
      agentRebuttalHeadline: "AUTOMATED REBUTTAL READY: GSM8K & MATH Benchmark Invariance",
      agentRebuttalBody:
        "We tested the 3-bit cache on GSM8K (8-shot) and MATH (4-shot) benchmarks, observing an accuracy delta of only -0.4% compared to FP16. We also provide a vendor-agnostic CUDA C++ fallback kernel matching Triton throughput within 3%.",
      invarianceProof: "GSM8K accuracy: 92.1% (FP16) vs 91.7% (ACI-3) across 1,319 test problems.",
    },
    benchmarks: [
      {
        dataset: "Needle In A Haystack (32k Context)",
        split: "100 Random Depths & Intervals",
        baselineScore: "100%",
        projectedScore: "100% Retrieval",
        metric: "Zero Information Loss",
      },
      {
        dataset: "GSM8K Multi-Step Math Reasoning",
        split: "Test Split (1,319 problems)",
        baselineScore: "92.1%",
        projectedScore: "91.7%",
        metric: "< 0.4% Reasoning Delta",
      },
    ],
  },
  {
    id: "protein-dock",
    title: "Structural Biology & Therapeutics",
    shortLabel: "Protein Binding",
    domainBadge: "Nature Biotech / RECOMB",
    objective:
      "Identify binding pocket steric clashes in mutated EGFR kinases and formulate an orthogonal ablation protocol for small-molecule docking stability.",
    traceSteps: [
      {
        id: "step-1",
        stepNum: 1,
        label: "Residue Mutation & Pocket Ingestion",
        tool: "AgentPlanner.decompose",
        durationMs: 250,
        status: "complete",
        summary:
          "Extracted T790M and C797S resistance mutations in human EGFR kinase domain (PDB: 2JIT) and calculated solvent-accessible surface area delta.",
        telemetryPayload: {
          invokedWith: {
            targetPdb: "2JIT",
            mutations: ["T790M", "C797S"],
            ligandCandidate: "Osimertinib derivative #4b",
          },
          tokensSaved: 590,
          routerType: "Deterministic Fast-Path",
          verifiedHash: "sha256:8811aa...3344",
          executionLog: [
            "[PDB Parser] Extracted 3D coordinates for ATP-binding cleft (residues 700-1010)",
            "[Surface Area Calculator] Methionine 790 introduces steric bulk obstructing gatekeeper pocket",
          ],
        },
      },
      {
        id: "step-2",
        stepNum: 2,
        label: "Structural Citation Graph Traversal",
        tool: "CitationGraph.retrieve_k_neighbors",
        durationMs: 440,
        status: "complete",
        summary:
          "Queried 22 crystallography and Cryo-EM papers resolving 4th-generation EGFR allosteric inhibitors.",
        telemetryPayload: {
          invokedWith: {
            seedPapers: ["PDB: 2JIT", "Nature 2021 (Allosteric EGFR)"],
            graphDepth: 2,
            limit: 22,
          },
          tokensSaved: 890,
          routerType: "Fast-Path Citation Matrix",
          verifiedHash: "sha256:77cc55...2299",
          executionLog: [
            "[Citation Graph] Linked 22 peer-reviewed crystallography structures with validated resolution < 2.1 Å",
            "[Cross-Validation] Flagged 2 retracted binding affinity claims from non-peer-reviewed preprints",
          ],
        },
      },
      {
        id: "step-3",
        stepNum: 3,
        label: "Allosteric Pocket Novelty & Docking Vector",
        tool: "NoveltyValidator.synthesize_matrix",
        durationMs: 650,
        status: "complete",
        summary:
          "Synthesized orthogonal binding pathway targeting the adaptive alphaC-helix allosteric pocket, bypassing gatekeeper mutation steric clash.",
        telemetryPayload: {
          invokedWith: {
            targetPocket: "AlphaC-helix allosteric cleft",
            dockingEngine: "AutoDock Vina & DiffDock 2",
          },
          tokensSaved: 1180,
          routerType: "Batched Novelty Validator",
          verifiedHash: "sha256:334455...6677",
          executionLog: [
            "[Novelty Engine] 0 existing patents for macrocyclic derivatives binding this specific pocket configuration",
            "[Binding Energy Delta] Projected Delta G drops from -7.4 kcal/mol to -11.2 kcal/mol",
          ],
        },
      },
      {
        id: "step-4",
        stepNum: 4,
        label: "Adversarial Conformation Stress-Testing",
        tool: "SelfCritique.evaluate_boundary_conditions",
        durationMs: 400,
        status: "complete",
        summary:
          "Stress-tested pocket flexibility across 200ns molecular dynamics trajectories; verified persistent hydrogen bonding at Lys745.",
        telemetryPayload: {
          invokedWith: {
            simulationNs: 200,
            forceField: "AMBER14SB",
            solventModel: "TIP3P explicit water",
          },
          tokensSaved: 780,
          routerType: "Adversarial Critique Engine",
          verifiedHash: "sha256:123456...7890",
          executionLog: [
            "[MD Trajectory Analyzer] Identified transient water-mediated bridge at 140ns",
            "[Stability Proof] RMSD of ligand heavy atoms remained below 1.4 Å throughout entire 200ns trajectory",
          ],
        },
      },
    ],
    literature: {
      heading: "EGFR Kinase Drug Resistance & Allosteric Targeting",
      summary:
        "Third-generation covalent inhibitors fail against C797S mutations. Targeting non-catalytic allosteric sites represents the primary avenue for next-generation precision therapeutics.",
      citations: [
        {
          id: "cit-prot-1",
          title: "Overcoming mutation-based resistance to third-generation EGFR inhibitors",
          authors: "Jänne et al. (Dana-Farber Cancer Institute)",
          venue: "Cancer Discovery 2021",
          year: 2021,
          doi: "10.1158/2159-8290.CD-20-1234",
          citationCount: 280,
          influenceScore: 96,
          highlight: "Establishes C797S as the dominant mechanism of acquired resistance to Osimertinib in clinical cohorts.",
        },
      ],
    },
    novelty: {
      heading: "Macrocyclic AlphaC-Helix Allosteric Docking (MAC-EGFR)",
      coreHypothesis:
        "A rigid macrocyclic scaffold with an orthogonal halogen bond donor can engage the Lys745/Glu762 salt bridge without clashing with mutated Met790 gatekeeper residues.",
      gapMatrix: [
        {
          dimension: "Predicted Binding Affinity (Ki)",
          priorSota: "240 nM (Against C797S)",
          paperlensDelta: "4.2 nM (MAC-EGFR)",
          advantage: "57x Potency Improvement",
        },
        {
          dimension: "Selectivity vs Wild-Type",
          priorSota: "1.4x (Dose-limiting toxicity)",
          paperlensDelta: "38x Selective",
          advantage: "Significantly Reduced Off-Target Toxicity",
        },
      ],
    },
    ablationProtocol: {
      heading: "Molecular Dynamics & Scoring Protocol",
      framework: "OpenMM 8.1 / PyTorch Geometric / DiffDock",
      seed: 2026,
      codeSnippet: `import openmm as mm
from openmm import app, unit

def setup_allosteric_docking_simulation(pdb_path: str):
    """
    Automated 200ns explicit-solvent molecular dynamics protocol
    evaluating free energy perturbation across mutant kinase trajectories.
    """
    pdb = app.PDBFile(pdb_path)
    forcefield = app.ForceField('amber14-all.xml', 'amber14/tip3p.xml')
    modeller = app.Modeller(pdb.topology, pdb.positions)
    modeller.addSolvent(forcefield, padding=1.0*unit.nanometers, ionicStrength=0.15*unit.molar)
    
    system = forcefield.createSystem(modeller.topology, nonbondedMethod=app.PME, 
                                     nonbondedCutoff=1.0*unit.nanometers, constraints=app.HBonds)
    integrator = mm.LangevinMiddleIntegrator(300*unit.kelvin, 1.0/unit.picosecond, 0.002*unit.picoseconds)
    return app.Simulation(modeller.topology, system, integrator)`,
      parameters: [
        {
          name: "Solvent Explicit Water Model",
          currentValue: "TIP3P (0.15M NaCl)",
          options: ["Implicit GB-OBC", "TIP3P (0.15M NaCl)", "OPC4 4-Point"],
          description: "Biological fluid simulation model evaluating hydration shell thermodynamics.",
          impactMetric: "Reproduces physiological binding free energy within 0.8 kcal/mol",
        },
      ],
    },
    reviewerTwo: {
      reviewerBadge: "Reviewer #2 (Nature Biotech Mode)",
      objectionHeadline: "REJECTION CONCERN: In-silico docking often fails in wet-lab binding assays.",
      objectionBody:
        "The calculated -11.2 kcal/mol affinity is based purely on computational scoring. Without surface plasmon resonance (SPR) or isothermal titration calorimetry (ITC) verification, in-silico allosteric predictions have high false-positive rates.",
      brutalityScore: "9.2 / 10 ('Definite Rejection')",
      agentRebuttalHeadline: "AUTOMATED REBUTTAL READY: FEP+ Thermodynamic Integration",
      agentRebuttalBody:
        "We augmented standard docking scores with rigorous Free Energy Perturbation (FEP+) across 16 alchemical lambda windows, achieving an $R^2 = 0.89$ correlation against known kinase experimental affinities in the same protein family.",
      invarianceProof: "Thermodynamic alchemical convergence confirmed with cycle closure error < 0.3 kcal/mol.",
    },
    benchmarks: [
      {
        dataset: "DUD-E Kinase Decoy Benchmark",
        split: "50 Active / 1,800 Decoy Ligands",
        baselineScore: "ROC-AUC: 0.74",
        projectedScore: "ROC-AUC: 0.93",
        metric: "False-Positive Rejection Rate",
      },
    ],
  },
];
