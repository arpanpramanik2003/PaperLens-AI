# 💡 Problem Generator Capability

## 1. What It Does
The **Problem Generator** is a two-stage scientific ideation engine that identifies novel, high-impact research problems within a specified domain and expands high-potential surface ideas into comprehensive execution briefs.

---

## 2. How It Works

```
Stage 1: Domain/Subdomain Input ──> POST /api/generate-problems ──> 3 Surface Research Problem Ideas
                                                                                   │
Stage 2: Selected Problem Idea  ──> POST /api/expand-problem    ──> Deep Brief (Methodology, Novelty, Failure Modes)
```

1. **Stage 1 Ideation (`POST /api/generate-problems`)**: Takes domain, subdomain, and complexity inputs in [`generation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/generation.py) to produce 3 distinct research problems with novelty scores (1–10) and technical challenges.
2. **Stage 2 Expansion (`POST /api/expand-problem`)**: Accepts a selected surface idea from Stage 1 and generates a full execution brief, covering technical formulation, theoretical motivation, computational complexity, and risk mitigations.
3. **LLM Routing**: Primary route `openai/gpt-oss-120b` with fallback to `llama-3.3-70b-versatile`.

---

## 3. Example Usage

### Stage 1 Input (`POST /api/generate-problems`)
```json
{
  "domain": "Computer Vision",
  "subdomain": "Medical Image Segmentation",
  "complexity": "High"
}
```

### Stage 1 Output Sample
```json
{
  "problems": [
    {
      "title": "Zero-Shot 3D MRI Segmentation via Spatial Foundation Models",
      "novelty_score": 9,
      "core_challenge": "High memory footprint of 3D volumetric attention mechanisms"
    }
  ]
}
```

---

## 4. Key Implementation Details
- **Two-Stage Progressive Disclosure**: Prevents LLM context bloat by generating surface ideas first, allowing the user to select which idea warrants a heavy expansion pass.
- **Bookmarks Integration**: Generated problem briefs can be persisted directly to PostgreSQL via `POST /api/save-item`.
