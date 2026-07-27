# 💡 Problem Generator — Exhaustive Architecture & Ideation Workflow Guide

<p align="center">
  <img src="https://img.shields.io/badge/Workflow-Problem%20Generator-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Problem Generator Workflow" />
  <img src="https://img.shields.io/badge/Model-GPT--OSS--120B%20%2B%20Llama%203.3%2070B-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="Groq Model Fallback" />
  <img src="https://img.shields.io/badge/Expansion-2--Phase%20Ideation%20Brief-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Problem Expansion" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
</p>

---

> [!IMPORTANT]
> **What is the Problem Generator?**
> The **Problem Generator** helps researchers, students, and developers discover novel, high-impact research topics. Instead of giving generic ideas, it uses a **Two-Phase Workflow**:
>
> 1. **Phase 1 (High-Level Ideation)**: You enter a domain, subdomain, and complexity level. The system uses AI to generate 4 to 6 unique research ideas. Each idea comes with an impact rating (3 to 5 stars), tags, a core problem statement, and a proposed objective.
> 2. **Phase 2 (Deep Problem Expansion)**: When you click **"Use this idea"**, the system takes that specific idea and expands it into a step-by-step execution brief. This brief includes a detailed problem statement, a measurable objective, step-by-step execution tasks, dataset recommendations, evaluation metrics, and expected outcomes.

---

## 🏗️ 1. Complete System Architecture & Data Flow

Here is the high-level data flow diagram showing how user inputs move through the frontend, API gateway, LLM fallback engine, and output UI layers.

```mermaid
flowchart TD
    subgraph FrontendSurface ["💻 Frontend Gateway (ProblemGenerator.tsx)"]
        UI1["📁 Step 1: Input Domain, Subdomain & Complexity"]
        UI2["⚡ Step 2: Render 2-Column Idea Cards Grid"]
        UI3["👆 Step 3: Click 'Use This Idea' Button"]
        UI4["💬 Step 4: Open Floating Execution Brief Modal"]
    end

    subgraph FastAPIRoutes ["⚡ FastAPI Endpoint Gateway (routes.py)"]
        R1["POST /api/generate-problems"]
        R2["POST /api/expand-problem"]
        LOG1["Database Activity Logger (generate_problems)"]
        LOG2["Database Activity Logger (expand_problem)"]
    end

    subgraph LLMEngine ["🧠 LLM Fallback & Orchestration Engine (generation.py)"]
        M1["Primary LLM: openai/gpt-oss-120b"]
        M2["Fallback LLM 1: llama-3.3-70b-versatile"]
        M3["Fallback LLM 2: meta-llama/llama-4-scout-17b"]
        GEN["generate_research_problems()"]
        EXP["expand_problem_details()"]
    end

    subgraph ToolLayer ["🛠️ Agent Tool Integration (tools.py)"]
        T1["@tool('generate_problem')"]
        T2["Unique Title-Specific Objective Synthesizer"]
    end

    UI1 -->|JSON Request Payload| R1
    R1 --> LOG1
    R1 --> GEN
    GEN --> M1
    M1 -->|Rate Limit 429| M2 --> M3
    GEN --> UI2

    UI3 -->|JSON Request Payload| R2
    R2 --> LOG2
    R2 --> EXP
    EXP --> M1
    EXP --> UI4

    T1 --> T2 --> GEN
```

---

## 🔄 2. Complete Step-by-Step Execution Lifecycle

The following sequence diagram traces the complete lifecycle of a user request from the initial form submission to opening the detailed execution brief modal.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as ProblemGenerator.tsx
    participant Routes as routes.py
    participant DB as PostgreSQL (Activity Table)
    participant Engine as generation.py
    participant LLM as Groq LLM Provider

    User->>UI: 1. Fill out Domain, Subdomain & Complexity dropdown
    User->>UI: 2. Click "Generate Ideas" button
    UI->>Routes: 3. POST /api/generate-problems { domain, subdomain, complexity }
    Routes->>DB: 4. Log activity record (action_type: "generate_problems")
    Routes->>Engine: 5. Call generate_research_problems(domain, subdomain, complexity)
    Engine->>LLM: 6. Request JSON completion (primary: gpt-oss-120b)
    alt Primary Success
        LLM-->>Engine: Raw Ideas JSON [{ title, problem_statement, objective, rating, tags }]
    else Primary Rate Limit 429
        Engine->>LLM: Fallback completion (llama-3.3-70b-versatile)
        LLM-->>Engine: Raw Ideas JSON
    end
    Engine-->>Routes: Return formatted ideas list
    Routes-->>UI: Return { ideas: [...] }
    UI->>User: 7. Render idea cards in a 2-column grid

    User->>UI: 8. Click "Use this idea" on a selected card
    UI->>Routes: 9. POST /api/expand-problem { domain, subdomain, complexity, idea }
    Routes->>DB: 10. Log activity record (action_type: "expand_problem")
    Routes->>Engine: 11. Call expand_problem_details(domain, subdomain, complexity, idea)
    Engine->>LLM: 12. Request execution plan JSON (same core problem statement)
    LLM-->>Engine: Expanded Brief JSON { title, problem_statement, objective, step_by_step, metrics }
    Engine-->>Routes: Return detailed expansion object
    Routes-->>UI: Return expanded brief payload
    UI->>User: 13. Open floating execution brief modal with full roadmap
```

---

## 💻 3. Frontend Request Lifecycle & UI Components (`ProblemGenerator.tsx`)

### 3.1 Input Collection & Form Submission
The user enters three primary parameters:
1. **Domain**: The overarching computer science or AI field (e.g., *"Natural Language Processing"*, *"Computer Vision"*, *"Graph Neural Networks"*).
2. **Subdomain**: A focused sub-discipline (e.g., *"Multimodal Transformers"*, *"Medical Image Segmentation"*, *"De Novo Molecule Generation"*).
3. **Complexity Level**: Selectable via dropdown (`"low"`, `"medium"`, or `"high"`).

```tsx
// Frontend Input Form State in ProblemGenerator.tsx
const [domain, setDomain] = useState("");
const [subdomain, setSubdomain] = useState("");
const [complexity, setComplexity] = useState("medium");
const [loading, setLoading] = useState(false);
const [ideas, setIdeas] = useState<ProblemIdea[]>([]);

const handleGenerate = async () => {
  if (!domain.trim()) {
    toast.error("Please enter a domain.");
    return;
  }

  setLoading(true);
  try {
    const token = await getToken();
    const res = await fetch(`${API_BASE_URL}/api/generate-problems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domain: domain.trim(),
        subdomain: subdomain.trim(),
        complexity,
      }),
    });

    if (!res.ok) throw new Error("Failed to generate research problems.");
    const data = await res.json();
    setIdeas(data.ideas || []);
    toast.success("Generated novel research problems!");
  } catch (err: any) {
    toast.error(err.message || "Could not generate problems.");
  } finally {
    setLoading(false);
  }
};
```

---

### 3.2 Phase 1 API Request & Response Contract

#### Request (`POST /api/generate-problems`)
```json
{
  "domain": "Natural Language Processing",
  "subdomain": "Language Model Compression",
  "complexity": "high"
}
```

#### Response Payload
```json
{
  "ideas": [
    {
      "title": "Quantization-Aware Contrastive Distillation for Ultra-Low Precision LLMs",
      "problem_statement": "Extreme 2-bit quantization introduces severe signal degradation and perplexity spikes in large language models.",
      "objective": "Formulate a cross-entropy contrastive distillation framework to preserve attention representations under 2-bit uniform quantization.",
      "tags": ["LLM", "Quantization", "Distillation", "Efficiency"],
      "rating": 5
    },
    {
      "title": "Structure-Preserving Pruning for Multimodal Transformers",
      "problem_statement": "Standard magnitude pruning destroys cross-modal alignment layers in vision-language architectures.",
      "objective": "Design an optimal transport matrix pruning algorithm to maintain cross-attention weights while removing 40% parameters.",
      "tags": ["Multimodal", "Pruning", "Transformers"],
      "rating": 4
    }
  ]
}
```

---

### 3.3 Phase 2 Problem Expansion Request & Response Contract

When the user clicks **"Use this idea"** on an idea card, the frontend sends the selected idea to `/api/expand-problem`.

#### Request (`POST /api/expand-problem`)
```json
{
  "domain": "Natural Language Processing",
  "subdomain": "Language Model Compression",
  "complexity": "high",
  "idea": {
    "title": "Quantization-Aware Contrastive Distillation for Ultra-Low Precision LLMs",
    "problem_statement": "Extreme 2-bit quantization introduces severe signal degradation...",
    "objective": "Formulate a cross-entropy contrastive distillation framework...",
    "tags": ["LLM", "Quantization", "Distillation"],
    "rating": 5
  }
}
```

#### Response Payload (Detailed Brief)
```json
{
  "title": "Quantization-Aware Contrastive Distillation for Ultra-Low Precision LLMs",
  "problem_statement": "Extreme 2-bit quantization introduces severe signal degradation and perplexity spikes in large language models.",
  "objective": "Formulate a cross-entropy contrastive distillation framework to preserve attention representations under 2-bit uniform quantization.",
  "step_by_step": [
    {
      "step": 1,
      "title": "Quantization Noise Modeling",
      "details": "Inject simulated uniform 2-bit noise layers into LLaMA teacher model activations."
    },
    {
      "step": 2,
      "title": "Contrastive Attention Alignment",
      "details": "Minimize KL-divergence between teacher soft logits and student quantized representations."
    },
    {
      "step": 3,
      "title": "Benchmarking & Perplexity Audit",
      "details": "Evaluate zero-shot accuracy across MMLU, GSM8K, and HumanEval benchmarks."
    }
  ],
  "datasets": ["WikiText-103", "C4 Dataset", "MMLU Benchmark"],
  "evaluation_metrics": ["Perplexity (PPL)", "Zero-Shot Accuracy", "Memory Footprint (GB)"],
  "expected_outcomes": ["75% reduction in GPU VRAM with <1.5 perplexity degradation."]
}
```

---

## 🎯 4. Complexity & Impact Rating Scale

```mermaid
mindmap
  root((Problem Complexity Taxonomy))
    LowComplexity["Low Complexity: Incremental Enhancements"]
      LowDesc["Refines existing baselines in well-defined problem spaces."]
      LowRating["Impact Rating: 3 / 5 Stars"]
      LowEx["Example: 'Improved Data Augmentation for Image Classification'"]
    MediumComplexity["Medium Complexity: Novel Methodological Extensions"]
      MedDesc["Cross-domain transfer, novel attention layers, moderate technical risk."]
      MedRating["Impact Rating: 4 / 5 Stars"]
      MedEx["Example: 'Self-Supervised Domain Adaptation for Medical Imaging'"]
    HighComplexity["High Complexity: High-Impact SOTA Frontiers"]
      HighDesc["Cutting-edge frontiers, zero-shot transfer, physics-informed architectures."]
      HighRating["Impact Rating: 5 / 5 Stars"]
      HighEx["Example: 'SE(3)-Equivariant 3D Graph Neural Networks for Binding Affinity'"]
```

### Technical Requirements by Complexity Level

| Complexity Level | Impact Rating | Scope & Technical Depth | Target Output |
|---|---|---|---|
| **Low** | 3 / 5 Stars | Incremental improvements on existing baselines. Low technical risk. | Parameter tuning, simple data augmentation extensions, standard baseline comparisons. |
| **Medium** | 4 / 5 Stars | Novel architectural extensions or cross-domain transfers. Moderate risk. | Hybrid attention layers, contrastive feature probing, domain adaptation frameworks. |
| **High** | 5 / 5 Stars | Ambitious, cutting-edge SOTA research frontiers. High technical novelty. | Equivariant 3D GNNs, physics-informed GANs, zero-shot bioactivity transfer systems. |

---

## 🛠️ 5. Unique Objective Extraction Engine (`tools.py`)

> [!TIP]
> **Preventing Generic Fallback Text**
> In both standalone Problem Generator and Agent Mode, `generate_problem` extracts or synthesizes a **100% unique, title-tailored objective** for every generated card, eliminating generic template sentences like *"Develop an end-to-end framework resolving key bottlenecks in..."*:

```python
# Unique Objective Synthesizer in tools.py
p_title = item.get("title") or f"Novel Direction #{idx + 1}"
p_statement = item.get("problem_statement") or item.get("desc") or f"Key unexplored challenge in {target_domain}"
raw_obj = item.get("objective") or item.get("solution") or ""

# Guarantee 100% unique, title-specific objective
if not raw_obj or "resolving key bottlenecks in" in raw_obj.lower():
    p_objective = f"Design and implement a novel {p_title} model architecture to mitigate baseline failure modes and achieve SOTA accuracy for {target_domain}."
else:
    p_objective = raw_obj
```

---

## 🧠 6. Model Routing & Fallback System (`model_fallback.py`)

To ensure 99.9% uptime during high-traffic or provider rate-limit events, Problem Generation routes through Groq's multi-tier model fallback chain:

```python
# Model Routing in model_fallback.py
HEAVY_PRIMARY_MODEL = "openai/gpt-oss-120b"
HEAVY_FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct"
]
```

```mermaid
flowchart LR
    Req["Request: generate_research_problems()"] --> Primary["Primary Model: openai/gpt-oss-120b"]
    Primary -->|Success| Resp["Return Valid JSON"]
    Primary -->|Error / HTTP 429 Rate Limit| Fallback1["Fallback 1: llama-3.3-70b-versatile"]
    Fallback1 -->|Success| Resp
    Fallback1 -->|Error| Fallback2["Fallback 2: llama-4-scout-17b"]
    Fallback2 --> Resp
```

- **Observability**: Terminal logs automatically record model execution attempts:
  - `[MODEL-TRY] task=problem_generator route=primary model=openai/gpt-oss-120b`
  - `[MODEL-FALLBACK] task=problem_generator failed_model=... reason=HTTP 429`
  - `[MODEL-SUCCESS] task=problem_generator route=fallback model=llama-3.3-70b-versatile`

---

## 📊 7. Database Activity Logging & Analytics

Every problem generation and expansion call is logged to the `activities` table in PostgreSQL via SQLAlchemy:

```python
# Activity Logging in routes.py
db_activity = Activity(
    user_id=user_id,
    action_type="generate_problems",
    metadata_json={
        "domain": payload.domain,
        "subdomain": payload.subdomain,
        "complexity": payload.complexity,
        "ideas_count": len(ideas)
    }
)
db.add(db_activity)
db.commit()
```

---

## ⚠️ 8. Failure Modes & Error Recovery Matrix

| Scenario | Cause | System Action | User View / Recovery |
|---|---|---|---|
| **Rate Limit Exceeded (HTTP 429)** | Groq daily token cap reached | Automatic failover to `llama-3.3-70b-versatile` | Zero interruption; transparent execution |
| **Invalid JSON Response** | LLM output contained extra prose | Enforces `response_format={"type": "json_object"}` | Automatic JSON decode retry |
| **Missing Objective Field** | LLM returned raw title & desc only | `tools.py` title-specific objective synthesizer | Unique objective rendered on card |
| **Empty Expansion Steps** | LLM output truncated | `_supplemental_step_templates` fallback | 4+ execution steps guaranteed |

---

## 🔐 9. Security & Safe Environment Setup

> [!WARNING]
> Keep all API keys in environment files and never commit raw secrets to git repositories.

### Required Backend Environment Variables (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
CLERK_SECRET_KEY=sk_test_[CLERK_SECRET_KEY]
GROQ_API_KEY=gsk_[GROQ_API_KEY]
```

### Frontend Environment Variables (`frontend/.env.local`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[CLERK_PUB_KEY]
VITE_API_URL=http://localhost:8000
```
