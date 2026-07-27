# 🧪 Experiment Planner — Complete Architecture & Execution Roadmap Documentation

<p align="center">
  <img src="https://img.shields.io/badge/Workflow-Experiment%20Planner-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Experiment Planner Workflow" />
  <img src="https://img.shields.io/badge/Model-GPT--OSS--120B%20%2B%20Llama%203.3%2070B-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="Groq Model Fallback" />
  <img src="https://img.shields.io/badge/UI_Icons-Lucide%20React-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Lucide React Icons" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
</p>

---

> [!IMPORTANT]
> **Staged Methodological Roadmaps**
> The **Experiment Planner** translates abstract research concepts or domain problem statements into concrete, multi-stage experimental execution roadmaps. Each generated plan provides a sequential step timeline complete with stage titles, Lucide icon taxonomy, detailed implementation guidance, quantifiable parameter configurations, and technical risk checkpoints.

---

## 🏗️ 1. Complete Architecture & System Data Flow

```mermaid
flowchart TD
    subgraph FrontendSurface ["💻 Frontend Surfaces"]
        UI1["🧪 Standalone Experiment Planner Page (ExperimentPlanner.tsx)"]
        UI2["🤖 Agent Mode CTA Button (AgentMode.tsx /api/plan-experiment)"]
    end

    subgraph FastAPIGateway ["⚡ FastAPI Endpoint Gateway (routes.py)"]
        EP["POST /api/plan-experiment"]
        LOG["DB Activity Logger (Activity Table)"]
    end

    subgraph LLMOrchestration ["🧠 LLM Model Fallback & Coercion Engine (generation.py)"]
        M1["Primary Model: openai/gpt-oss-120b"]
        M2["Fallback Model 1: llama-3.3-70b-versatile"]
        M3["Fallback Model 2: meta-llama/llama-4-scout-17b"]
        NORM1["_coerce_structured_params()"]
        NORM2["_coerce_structured_risk()"]
        NORM3["_infer_step_risk()"]
    end

    subgraph OutputRendering ["🎨 Render & Export Layers"]
        CARD["StepCard Component Timeline"]
        ICONS["Lucide Icon Taxonomy Engine"]
        EXPORT["Markdown & Clipboard Export"]
    end

    UI1 -->|JSON Payload: topic + difficulty| EP
    UI2 -->|JSON Payload: direction title| EP
    EP --> LOG
    EP --> M1
    M1 -->|Rate Limit / 429| M2
    M2 -->|Error Failover| M3
    M1 & M2 & M3 --> NORM1 & NORM2 & NORM3
    NORM1 & NORM2 & NORM3 --> CARD
    CARD --> ICONS & EXPORT
```

---

## 🔄 2. End-to-End Request & Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as ExperimentPlanner.tsx / AgentMode.tsx
    participant Route as routes.py (/api/plan-experiment)
    participant DB as PostgreSQL (Activity Log)
    participant Engine as generation.py (generate_experiment_plan)
    participant LLM as Groq Inference Engine

    User->>UI: Input Research Topic & Select Difficulty
    UI->>Route: POST /api/plan-experiment { topic, difficulty }
    Route->>DB: Record Activity (action_type: "plan_experiment")
    Route->>Engine: Call generate_experiment_plan(topic, difficulty)
    Engine->>LLM: Request JSON Completion (primary: gpt-oss-120b)
    alt Primary Success
        LLM-->>Engine: Raw Plan JSON Payload
    else Primary Rate Limit (429)
        Engine->>LLM: Fallback Request (llama-3.3-70b-versatile)
        LLM-->>Engine: Raw Plan JSON Payload
    end
    Engine->>Engine: Coerce & Normalize Params & Risk Checkpoints
    Engine-->>Route: Normalized Plan Object { steps: [...] }
    Route-->>UI: Return JSON Steps Response
    UI->>User: Render Visual Stage Timeline & Execution Cards
```

---

## 🎯 3. Difficulty-Driven Stage Scaffolding

The planner dynamically adjusts step count, depth, and operational complexity based on the requested difficulty tier:

| Difficulty Level | Step Count | Target Audience | Technical Depth & Included Modules |
|---|---|---|---|
| **Beginner** | 5 – 6 Steps | Students / Novice Researchers | Foundational data split, basic model baseline, standard loss metrics, and documentation. |
| **Intermediate** | 6 – 8 Steps | Applied ML Engineers | Advanced feature engineering, hyperparameter search, cross-validation, and ablation studies. |
| **Advanced** | 8 – 10 Steps | Senior AI Researchers | Custom architecture design, explainability (XAI), out-of-distribution robustness, deployment optimization, and ethical risk audits. |

---

## 🛠️ 4. Icon Taxonomy & Module Mapping

Every stage is tagged with a Lucide React icon name corresponding to standard ML operational modules:

```mermaid
mindmap
  root((Lucide Icon Taxonomy))
    Database["Database: Data Curation & Dataset Selection"]
    Cog["Cog: Feature Engineering & Preprocessing"]
    Cpu["Cpu / PenTool: Custom Architecture Design"]
    Play["Play: Model Training & Optimization"]
    Eye["Eye: Explainability (XAI) & Interpretability"]
    BarChart3["BarChart3: Evaluation & Ablation Studies"]
    Cloud["Cloud: Deployment, Quantization & Serving"]
    Shield["Shield: Ethical Audit & Risk Checkpoints"]
```

---

## 🧠 5. Dynamic Normalization & Coercion Engine (`generation.py`)

> [!TIP]
> **Eliminating Generic Prompt Fallbacks**
> To prevent generic text strings (such as *"Specify quantifiable configuration..."* or *"Missing recent preprints..."*), `generation.py` uses dynamic normalization functions that inspect stage titles and topics to generate concrete, stage-specific configurations:

```python
# Stage Parameter Coercion Engine
def _coerce_structured_params(title: str, topic: str, params: str) -> str:
    compact = re.sub(r"\s+", " ", (params or "")).strip()
    if len(compact.split()) >= 6 and "specify quantifiable" not in compact.lower():
        return compact

    t_lower = title.lower()
    if any(k in t_lower for k in ["dataset", "data", "collection"]):
        return f"Target split: 80% train / 10% val / 10% test; Stratified sampling for {topic}."
    if any(k in t_lower for k in ["preprocess", "feature", "conformation"]):
        return f"Normalization: Min-Max / Z-score; Feature dimension: 256; Scaling on {topic} data."
    if any(k in t_lower for k in ["model", "architecture", "encoder"]):
        return f"Architecture: Multi-layer network with self-attention; Hidden size: 512; Dropout: 0.15."
    if any(k in t_lower for k in ["train", "optimization", "loss"]):
        return f"Optimizer: AdamW (lr=3e-4, weight_decay=1e-2); Batch size: 64; Max epochs: 150."
    if any(k in t_lower for k in ["evaluation", "benchmark", "metric"]):
        return f"Primary metrics: Task accuracy, ROC-AUC / RMSE; Comparison against SOTA baselines."
    if any(k in t_lower for k in ["deploy", "scaling", "export"]):
        return f"Target latency: <50ms per inference; Quantization: INT8 / FP16; Platform: Docker ONNX."

    return f"Configuration for {title}: Hyperparameters, metrics, and threshold constraints for {topic}."
```

---

## 🎨 6. UI Render Engine & Card Component (`ExperimentPlanner.tsx`)

The frontend renders steps as an interactive visual timeline using Framer Motion animations:

### Step Card Render Schema
```typescript
interface PlanStep {
  num: number;
  title: string;
  iconName: string;
  details: string;
  params: string;
  risks: string;
}
```

```jsx
// Frontend Step Timeline Item Rendering
<div className="relative flex items-start gap-4">
  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-mono font-bold">
    <LucideIcon name={step.iconName} className="w-5 h-5 text-accent" />
  </div>

  <div className="flex-1 rounded-2xl border border-border/60 bg-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-mono text-accent uppercase font-bold">Stage #{step.num}</span>
      <h3 className="font-bold text-sm text-foreground">{step.title}</h3>
    </div>

    <p className="text-xs text-muted-foreground leading-relaxed">{step.details}</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/40 font-mono">
      <div className="bg-indigo-500/5 p-2 rounded border border-indigo-500/10 text-indigo-300">
        <strong>Parameters:</strong> {step.params}
      </div>
      <div className="bg-amber-500/5 p-2 rounded border border-amber-500/10 text-amber-300">
        <strong>Risk Checkpoint:</strong> {step.risks}
      </div>
    </div>
  </div>
</div>
```

---

## 📊 7. Analytics & Database Logging

Every plan generation event is stored in PostgreSQL via SQLAlchemy:

```python
db_activity = Activity(
    user_id=user_id,
    action_type="plan_experiment",
    metadata_json={
        "topic": topic,
        "difficulty": difficulty,
        "step_count": len(steps),
        "generated_at": datetime.utcnow().isoformat()
    }
)
db.add(db_activity)
db.commit()
```

---

## ⚠️ 8. Failure Modes & Error Recovery Matrix

| Failure Mode | Root Cause | Handling Strategy | User Feedback |
|---|---|---|---|
| **Primary Model Rate Limit (429)** | Groq daily TPM / TPD cap reached | Automatic failover to `llama-3.3-70b-versatile` | Transparent logging (`[MODEL-FALLBACK]`) |
| **Invalid JSON Output** | LLM prose contamination | Enforce `response_format={"type": "json_object"}` | Automatic json parse retry |
| **Unknown Icon Name** | LLM hallucinated icon string | Fallback icon resolver returns default `"Cog"` | Clean fallback rendering |
| **Short Params / Generic Strings** | LLM brevity | Handled by `_coerce_structured_params` | Concrete stage-specific parameters |

---

## 🔐 9. Safe Environment Setup

> [!WARNING]
> Keep API credentials in deployment environment variables and never commit raw keys to git repositories.

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
