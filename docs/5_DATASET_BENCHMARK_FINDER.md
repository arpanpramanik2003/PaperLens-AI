# 📊 Dataset & Benchmark Finder — Complete Architecture & Normalization Workflow Guide

<p align="center">
  <img src="https://img.shields.io/badge/Workflow-Dataset%20Finder-indigo?style=for-the-badge&logo=probot&logoColor=white" alt="Dataset Finder Workflow" />
  <img src="https://img.shields.io/badge/Model-GPT--OSS--120B%20%2B%20Llama%203.3%2070B-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="Groq Model Fallback" />
  <img src="https://img.shields.io/badge/Data_Layer-Normalized%20Schemas-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Normalized Schemas" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React TypeScript" />
</p>

---

> [!IMPORTANT]
> **Intelligent Asset & Benchmark Matching**
> The **Dataset & Benchmark Finder** evaluates project titles and experimental plans to recommend SOTA datasets, evaluation benchmark suites, primary evaluation metrics, and domain-specific technologies. It features automatic **Data Normalization** that maps nested LLM properties (`details.modality`, `details.tasks`, `details.primary_metrics`) into clean top-level attributes for consistent card and modal rendering across both the main page and Agent Mode.

---

## 🏗️ 1. Complete Architecture & System Data Flow

```mermaid
flowchart TD
    subgraph FrontendSurface ["💻 Frontend Surfaces"]
        UI1["📊 Standalone Dataset Finder Page (DatasetBenchmarkFinder.tsx)"]
        UI2["🤖 Agent Mode Tool Call (find_datasets in tools.py)"]
    end

    subgraph FastAPIGateway ["⚡ FastAPI Endpoint Gateway (routes.py)"]
        EP["POST /api/find-datasets-benchmarks"]
        LOG["Database Activity Logger (Activity Table)"]
    end

    subgraph LLMOrchestration ["🧠 LLM Model Fallback Engine (generation.py)"]
        M1["Primary Model: openai/gpt-oss-120b"]
        M2["Fallback Model 1: llama-3.3-70b-versatile"]
        M3["Fallback Model 2: meta-llama/llama-4-scout-17b"]
        GEN["generate_dataset_benchmark_finder()"]
    end

    subgraph NormalizationLayer ["🛠️ Data Normalization Layer (tools.py / AgentMode.tsx)"]
        NORM1["Extract modality -> type / format"]
        NORM2["Extract tasks -> tasks string"]
        NORM3["Extract primary_metrics -> metrics string"]
        NORM4["Extract fit_score (1.0 - 5.0) & recommendation"]
    end

    subgraph OutputRendering ["🎨 Render & Modal Layers"]
        CARD1["Dataset Recommendation Cards Grid"]
        CARD2["Benchmark Suite Cards Grid"]
        CARD3["Domain Technology Stack Cards Grid"]
        MODAL["Interactive Details Modal"]
    end

    UI1 -->|JSON Payload: project_title + project_plan| EP
    UI2 -->|Agent Mode tool call| GEN
    EP --> LOG & GEN
    GEN --> M1
    M1 -->|Rate Limit / 429| M2 --> M3
    M1 & M2 & M3 --> NormalizationLayer
    NormalizationLayer --> CARD1 & CARD2 & CARD3 --> MODAL
```

---

## 🔄 2. End-to-End Request & Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as DatasetBenchmarkFinder.tsx / AgentMode.tsx
    participant Route as routes.py (/api/find-datasets-benchmarks)
    participant DB as PostgreSQL (Activity Log)
    participant Engine as generation.py
    participant Normalizer as tools.py / AgentMode.tsx
    participant LLM as Groq Inference Engine

    User->>UI: 1. Input Project Title and/or Project Plan
    UI->>Route: 2. POST /api/find-datasets-benchmarks { project_title, project_plan }
    Route->>DB: 3. Log activity record (action_type: "find_datasets_benchmarks")
    Route->>Engine: 4. Call generate_dataset_benchmark_finder()
    Engine->>LLM: 5. JSON Completion (primary: gpt-oss-120b)
    alt Primary Success
        LLM-->>Engine: Raw Finder JSON { domain_summary, datasets, benchmarks, technologies }
    else Primary Rate Limit 429
        Engine->>LLM: Fallback Completion (llama-3.3-70b-versatile)
        LLM-->>Engine: Raw Finder JSON
    end
    Engine-->>Route: Return raw JSON recommendations
    Route-->>Normalizer: 6. Normalize nested details into top-level properties
    Normalizer-->>UI: 7. Return fully populated payload
    UI->>User: 8. Render Datasets, Benchmarks, Technologies & Details Modal
```

---

## 📊 3. Data Normalization Architecture (`tools.py`)

> [!NOTE]
> **Why Data Normalization is Necessary**
> The raw LLM generator returns dataset properties inside a nested `details` object (`details.modality`, `details.tasks`, `details.primary_metrics`). To guarantee 100% full content visibility without empty fields on frontend cards, `tools.py` normalizes all dataset items into top-level attributes:

```python
# Data Normalization Routine in tools.py
normalized_datasets = []
for item in raw_datasets:
    if isinstance(item, dict):
        details = item.get("details") or {}
        name = item.get("name") or "Benchmark Dataset"
        desc = item.get("short_description") or item.get("description") or details.get("short_description") or f"Standard benchmark dataset for {target_topic}."
        
        # Normalize modality / format
        modality = item.get("type") or item.get("format") or details.get("modality") or details.get("type") or "Multi-modal records & features"
        modality_str = ", ".join([str(m) for m in modality]) if isinstance(modality, list) else str(modality)

        # Normalize tasks
        tasks = item.get("tasks") or details.get("tasks") or ["Classification", "Representation Learning"]
        tasks_str = ", ".join([str(t) for t in tasks]) if isinstance(tasks, list) else str(tasks)

        # Normalize primary metrics
        metrics = item.get("metrics") or details.get("metrics") or details.get("primary_metrics") or ["ROC-AUC", "F1-Score", "RMSE"]
        metrics_str = ", ".join([str(m) for m in metrics]) if isinstance(metrics, list) else str(metrics)

        fit_score = item.get("fit_score") or details.get("fit_score") or 4.8
        recommendation = item.get("recommendation") or f"SOTA Benchmark for {target_topic}"

        normalized_datasets.append({
            "name": name,
            "short_description": desc,
            "type": modality_str,
            "format": modality_str,
            "tasks": tasks_str,
            "metrics": metrics_str,
            "fit_score": fit_score,
            "recommendation": recommendation,
            "details": details,
        })
```

---

## 💻 4. Backend Endpoint & Validation (`routes.py`)

### 4.1 Request Payload Schema (`schemas.py`)
```python
class DatasetBenchmarkFinderRequest(BaseModel):
    project_title: Optional[str] = None
    project_plan: Optional[str] = None
```

### 4.2 API Endpoint Handler
```python
@router.post("/find-datasets-benchmarks")
async def find_datasets_benchmarks(
    payload: DatasetBenchmarkFinderRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project_title = (payload.project_title or "").strip()
    project_plan = (payload.project_plan or "").strip()

    if not project_title and not project_plan:
        return JSONResponse({"error": "Please provide project title or project plan."}, status_code=400)

    recommendations = generate_dataset_benchmark_finder(project_title, project_plan)

    db_activity = Activity(
        user_id=user_id,
        action_type="find_datasets_benchmarks",
        metadata_json={
            "project_title": project_title,
            "has_project_plan": bool(project_plan),
        }
    )
    db.add(db_activity)
    db.commit()

    return JSONResponse(recommendations)
```

---

## 🎯 5. LLM Prompt Contract & Response Schema

The recommendation engine (`generation.py`) enforces strict JSON output matching the following production schema:

```json
{
  "domain_summary": "Multimodal medical imaging intelligence for brain tumor segmentation and classification.",
  "datasets": [
    {
      "name": "BraTS 2024 (Brain Tumor Segmentation Challenge)",
      "fit_score": 4.9,
      "short_description": "Primary benchmark for multi-parametric MRI brain tumor sub-region segmentation.",
      "best_for": ["Glioma Sub-region Segmentation", "Multi-modal MRI Fusion"],
      "details": {
        "modality": "Multi-parametric MRI (T1, T1Gd, T2, FLAIR)",
        "size": "2,000+ patient MRI volumes",
        "license": "Research Use Only",
        "tasks": ["Segmentation", "Survival Prediction"],
        "pros": ["SOTA Benchmark", "Annotated by Neuroradiologists"],
        "limitations": ["Scanner distribution shift across institutions"],
        "source_hint": "Synapse / RSNA"
      }
    }
  ],
  "benchmarks": [
    {
      "name": "BraTS Evaluation Protocol",
      "fit_score": 4.8,
      "short_description": "Standardized Lesion Dice score and Hausdorff 95% distance evaluation.",
      "details": {
        "primary_metrics": ["Dice Similarity Coefficient (DSC)", "Hausdorff Distance 95% (HD95)"],
        "evaluation_protocol": "Patient-wise 5-fold cross-validation",
        "baselines": ["nnU-Net", "Swin UNETR"],
        "what_good_looks_like": "Mean Dice > 0.90 on Enhancing Tumor (ET) sub-regions",
        "pitfalls": ["Overfitting to single hospital scanner protocols"]
      }
    }
  ],
  "technologies": [
    {
      "name": "PyTorch",
      "category": "Framework",
      "reason": "Standard deep learning library for medical vision models.",
      "used_for": ["Model Training", "Custom Loss Implementation"]
    },
    {
      "name": "MONAI (Medical Open Network for AI)",
      "category": "Library",
      "reason": "Specialized domain utilities for 3D medical image transforms.",
      "used_for": ["3D Image Augmentation", "Sliding Window Inference"]
    }
  ]
}
```

---

## 🎨 6. UI Render Engine & Details Modal (`DatasetBenchmarkFinder.tsx`)

The frontend renders datasets, benchmarks, and technologies in responsive card grids:

```tsx
// Frontend Type Definition
type FinderItem = {
  name: string;
  fit_score?: number;
  short_description?: string;
  best_for?: string[];
  category?: string;
  reason?: string;
  used_for?: string[];
  details?: Record<string, any>;
};
```

```jsx
// Dataset Card JSX Rendering
<div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm hover:border-cyan-500/30 transition-all">
  <div className="flex items-start justify-between gap-2">
    <h3 className="text-sm font-semibold text-foreground">{dataset.name}</h3>
    {typeof dataset.fit_score === "number" && (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold">
        {dataset.fit_score.toFixed(1)}/5 Fit
      </span>
    )}
  </div>

  <p className="text-xs text-muted-foreground leading-relaxed">{dataset.short_description}</p>

  <div className="flex flex-wrap gap-1.5">
    {(dataset.best_for || []).slice(0, 3).map((useCase) => (
      <span key={useCase} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
        {useCase}
      </span>
    ))}
  </div>

  <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1.5" onClick={() => openDetails("dataset", dataset)}>
    View Details <ArrowRight className="w-3 h-3" />
  </Button>
</div>
```

---

## ⚠️ 7. Failure Modes & Error Recovery Matrix

| Scenario | Root Cause | Handling Strategy | User Interface Feedback |
|---|---|---|---|
| **Empty Inputs** | Title and Plan both blank | Blocked client-side and validated `400 Bad Request` | Toast error: *"Please provide project title or project plan."* |
| **Primary Rate Limit (429)** | Groq daily TPM cap hit | Automatic failover to `llama-3.3-70b-versatile` | Terminal logging (`[MODEL-FALLBACK]`) |
| **Nested Field Mismatch** | LLM returned nested `details` | Handled by `tools.py` normalization loop | 100% non-empty cards and modals |
| **Unauthenticated Request** | User not logged in | Client-side fallback generates demo dataset cards | Demonstrates full features without error |

---

## 🔐 8. Safe Environment Setup

> [!WARNING]
> Keep API credentials in environment files and never commit raw secrets to git repositories.

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
