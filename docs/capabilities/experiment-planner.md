# 🧪 Experiment Planner Capability

## 1. What It Does
The **Experiment Planner** transforms abstract research ideas or paper findings into detailed, step-by-step 6-phase execution roadmaps. It provides baseline model selections, hyperparameter bounds, risk assessments, and practical execution details tailored to a chosen difficulty level.

---

## 2. How It Works

```
Topic & Difficulty Input ──> Pydantic Validation ──> Model Fallback Executor ──> Groq LLM ──> Structured 6-Phase Roadmap
```

1. **Request Intake**: Accepts a research topic string and target difficulty level (`Beginner`, `Intermediate`, `Advanced`) via `POST /api/plan-experiment`.
2. **Model Routing Cascade**: Executes through [`model_fallback.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/model_fallback.py). Targets primary model `openai/gpt-oss-120b`, automatically falling back to `llama-3.3-70b-versatile` if primary rate limits occur.
3. **Roadmap Generation**: Solved in [`generation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/generation.py) to generate structured phases:
   - Phase 1: Environment & Data Preparation
   - Phase 2: Baseline Architecture Implementation
   - Phase 3: Model Extensions & Loss Formulation
   - Phase 4: Training & Hyperparameter Sweep
   - Phase 5: Evaluation & Metrics Collection
   - Phase 6: Ablation Studies & Failure Mode Analysis

---

## 3. Example Usage

### Input Payload (`POST /api/plan-experiment`)
```json
{
  "topic": "Equivariant Graph Transformers for Protein Binding Site Prediction",
  "difficulty": "Advanced"
}
```

### Example Response Excerpt
```json
{
  "result": "# Phase 1: Environment & Data Preparation\n- Install PyTorch Geometric and OpenBabel\n- Download PDBbind v2020 refined dataset...\n\n# Phase 4: Training & Sweep\n- Primary Optimizer: AdamW (lr=3e-4, weight_decay=1e-2)\n- Batch Size: 32 graphs across 4x A100 GPUs..."
}
```

---

## 4. Key Implementation Details
- **Multi-Model Fallback Resilience**: Uses `execute_with_fallback` to ensure high availability even when primary heavy LLM models hit provider rate limits.
- **Agent Mode Integration**: Includes an inline CTA button (**"Plan Roadmap in Experiment Planner"**) within Agent Mode research direction cards, seamlessly triggering experiment plan generation from literature reviews.
- **Activity Logging**: Automatically logs execution events to the PostgreSQL `activities` table for dashboard metric tracking.
