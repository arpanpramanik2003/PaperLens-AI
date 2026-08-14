# 📊 Dataset & Benchmark Finder Capability

## 1. What It Does
The **Dataset & Benchmark Finder** analyzes project goals and research problem statements to recommend domain-specific datasets, standardized evaluation benchmarks, metrics, and baseline models required to validate experimental results.

---

## 2. How It Works

```
Project Title / Description ──> Model Fallback Executor ──> Matched Datasets, Benchmarks & Metrics Matrix
```

1. **Input Submission**: Accepts project titles or research descriptions via `POST /api/find-datasets-benchmarks`.
2. **Knowledge Retrieval**: Queries LLM knowledge bases in [`generation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/generation.py) using fallback execution (`openai/gpt-oss-120b` $\rightarrow$ `llama-3.3-70b-versatile`).
3. **Structured Mapping**: Formats recommendations into four structured categories:
   - Recommended Datasets (size, modality, access license)
   - Evaluation Benchmarks & Leaderboards
   - Key Quantitative Metrics (e.g. F1, AUROC, MAE)
   - SOTA Baseline Models to compare against

---

## 3. Example Usage

### Input Request (`POST /api/find-datasets-benchmarks`)
```json
{
  "project_title": "Graph Neural Networks for Small-Molecule Property Prediction",
  "project_plan": "Predicting blood-brain barrier permeability using 3D molecular conformers"
}
```

### Example Response Payload Excerpt
```json
{
  "datasets": [
    { "name": "BBBP (MoleculeNet)", "size": "2,039 molecules", "license": "Open Source" }
  ],
  "benchmarks": [
    { "name": "MoleculeNet Benchmark Suite", "metric": "ROC-AUC" }
  ],
  "technologies": [
    { "name": "PyTorch Geometric", "type": "Framework" }
  ]
}
```

---

## 4. Key Implementation Details
- **Cross-Capability Reusability**: Outputs can be saved directly to PostgreSQL `saved_items` or fed directly into the Experiment Planner capability.
- **Structured Schema Alignment**: Results adhere strictly to Pydantic schemas in `schemas.py` for consistent UI table rendering.
