# 🔍 Gap Detection Capability

## 1. What It Does
**Gap Detection** critically audits research manuscripts or text inputs to detect methodological flaws, unstated assumptions, missing baseline comparisons, and unaddressed limitations, assigning severity scores (Low/Medium/High) alongside actionable suggestions for improvement.

---

## 2. How It Works

```
Document / Text Input ──> Pinned LLM Route (llama-3.1-8b-instant) ──> Structured Gap Matrix (Severity + Actionable Remedy)
```

1. **Document Retrieval**: Accepts a document ID (`doc_id`) or raw text in [`generation.py`](file:///d:/Edutation(P)/Learning-code/paper_explainer/backend/app/services/llm_sections/generation.py).
2. **Pinned Lightweight Routing**: Pinned specifically to `llama-3.1-8b-instant` with a completion token cap (1200 tokens) to deliver high-speed analysis while avoiding TPM rate limits.
3. **Structured Audit Output**: Returns a JSON gap list (`DetectGapsResponse`) categorizing gaps by severity (High, Medium, Low) across 4 categories:
   - Methodological Flaws
   - Missing Literature & Baselines
   - Unstated Assumptions
   - Evaluation Weaknesses

---

## 3. Example Usage

### Input Request (`POST /api/detect-gaps`)
```json
{
  "doc_id": "a1f9c3e210ab"
}
```

### Example Response Payload
```json
{
  "overview": "The paper presents strong empirical results but lacks out-of-distribution evaluation.",
  "gaps": [
    {
      "category": "Evaluation Weaknesses",
      "severity": "High",
      "issue": "No evaluation performed under out-of-distribution domain shift.",
      "recommendation": "Evaluate model performance on WILDS dataset benchmarks."
    }
  ]
}
```

---

## 4. Key Implementation Details
- **Pinned Lightweight Architecture**: By pinning to `llama-3.1-8b-instant`, Gap Detection executes with sub-second latency and zero risk of heavy-model rate limiting.
- **TPM Safety Token Cap**: Caps completion tokens at 1200 to prevent provider-side 413 token-limit errors during long document audits.
