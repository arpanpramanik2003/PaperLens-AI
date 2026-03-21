# Dataset & Benchmark Finder: Complete Workflow Documentation

**Purpose:** Recommend high-fit datasets, evaluation benchmarks, and commonly used technologies for a given project title and/or project plan.

---

## Architecture Overview

```
User Input (Frontend)
    ├─ Project Title (optional)
    └─ Project Plan (optional)
            ↓
Backend Validation + LLM Recommendation
    ├─ Input sanitization (title/plan trim)
    ├─ JSON-only recommendation generation
    └─ Activity logging in database
            ↓
Output Visualization (Frontend)
    ├─ Domain summary
    ├─ Recommended datasets (4-6)
    ├─ Relevant benchmarks (3-5)
    ├─ Technologies stack (5-8)
    └─ Detailed modal per dataset/benchmark
```

---

## 1. Frontend Request Lifecycle

**File:** `frontend/src/pages/DatasetBenchmarkFinder.tsx`

### 1.1 Input Collection
- User can provide either:
  - `projectTitle` (single-line input), or
  - `projectPlan` (multi-line textarea), or both.
- Empty submission is blocked in UI:

```tsx
if (!projectTitle.trim() && !projectPlan.trim()) return;
```

### 1.2 Request Dispatch
When authenticated (`userId` available), frontend sends:

```javascript
POST /api/find-datasets-benchmarks
Content-Type: application/json

{
  "project_title": "Multimodal Brain Tumor Classification with Explainable AI",
  "project_plan": "...long project plan..."
}
```

### 1.3 Fallback Behavior (Unauthenticated)
If user is not signed in:
- API call is skipped.
- Mock data is returned after a short simulated delay (~1200ms).
- UI still renders full cards + details modal for demonstration.

### 1.4 Response Handling
Expected response fields:
- `domain_summary`
- `datasets`
- `benchmarks`
- `technologies`

State updates:

```tsx
setDomainSummary(data.domain_summary || "");
setDatasets(data.datasets || []);
setBenchmarks(data.benchmarks || []);
setTechnologies(data.technologies || []);
setGenerated(true);
```

Error handling:
- `res.ok === false` triggers throw.
- Frontend shows alert: `Failed to load dataset and benchmark recommendations.`

### 1.5 Output Rendering
After generation:
1. **Domain Understanding** card (short summary)
2. **Recommended Datasets** grid
3. **Relevant Benchmarks** grid
4. **Most Used Technologies in this Domain** grid

Each dataset/benchmark supports **View details** action that opens a modal with structured metadata.

---

## 2. Backend Endpoint & Validation

**File:** `backend/app/api/routes.py` → `POST /find-datasets-benchmarks`

### 2.1 Request Schema
**File:** `backend/app/models/schemas.py`

```python
class DatasetBenchmarkFinderRequest(BaseModel):
    project_title: Optional[str] = None
    project_plan: Optional[str] = None
```

### 2.2 Endpoint Flow

```python
@router.post("/find-datasets-benchmarks")
async def find_datasets_benchmarks(payload, user_id=Depends(get_current_user), db=Depends(get_db)):
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

### 2.3 Validation Rules
- At least one input must be present (`project_title` or `project_plan`).
- Both values are trimmed before validation.
- On invalid input, API returns HTTP `400` with explicit message.

### 2.4 Persistence / Audit Trail
- Every successful finder request logs one `Activity` row.
- `action_type` = `find_datasets_benchmarks`.
- Metadata stores:
  - `project_title` (string)
  - `has_project_plan` (boolean)

This supports dashboard analytics and feature usage tracking.

---

## 3. LLM Recommendation Engine

**File:** `backend/app/services/llm.py` → `generate_dataset_benchmark_finder(project_title, project_plan)`

### 3.1 LLM Invocation
- Uses configured model via `settings.MODEL_NAME`.
- Enforces JSON output with:

```python
response_format={"type": "json_object"}
```

- System instruction enforces strict JSON behavior:

```python
{"role": "system", "content": "You return strictly valid JSON for AI project dataset and benchmark recommendations."}
```

### 3.2 Prompt Contract
The prompt explicitly requests:
1. Domain summary
2. 4-6 datasets
3. 3-5 benchmarks
4. 5-8 technologies

And mandates a strict schema including nested `details` objects.

### 3.3 Output JSON Structure

```json
{
  "domain_summary": "1-2 line understanding",
  "datasets": [
    {
      "name": "Dataset name",
      "fit_score": 4.7,
      "short_description": "Why useful",
      "best_for": ["use-case 1", "use-case 2"],
      "details": {
        "modality": "Text/Image/Audio/Multimodal",
        "size": "Approx size",
        "license": "Known license",
        "tasks": ["task 1", "task 2"],
        "pros": ["pro 1", "pro 2"],
        "limitations": ["limitation 1", "limitation 2"],
        "source_hint": "Where usually available"
      }
    }
  ],
  "benchmarks": [
    {
      "name": "Benchmark name",
      "fit_score": 4.6,
      "short_description": "Why benchmark matches",
      "details": {
        "primary_metrics": ["metric 1", "metric 2"],
        "evaluation_protocol": "Protocol",
        "baselines": ["baseline 1", "baseline 2"],
        "what_good_looks_like": "Strong performance criteria",
        "pitfalls": ["pitfall 1", "pitfall 2"]
      }
    }
  ],
  "technologies": [
    {
      "name": "Technology",
      "category": "Framework/Library/Tool/MLOps",
      "reason": "Why used",
      "used_for": ["purpose 1", "purpose 2"]
    }
  ]
}
```

### 3.4 Practical Constraints from Prompt
- `fit_score` must be numeric in `1.0` to `5.0` range.
- Recommendations should be implementation-oriented, not generic.
- No markdown or extra prose outside JSON.

---

## 4. UI Rendering & Details Modal

**File:** `frontend/src/pages/DatasetBenchmarkFinder.tsx`

### 4.1 Dataset/Benchmark Cards
Each card typically displays:
- Name
- Fit score badge
- Short description
- Top tags / use-cases (`best_for` for datasets)
- Action button to open details

### 4.2 Technology Cards
Technology entries render:
- Name + category chip
- Why it is used in domain (`reason`)
- Practical usage tags (`used_for`)

### 4.3 Details Modal
The modal supports both datasets and benchmarks using shared rendering logic:
- Section title toggles by `activeType` (`dataset` / `benchmark`)
- Displays summary, fit score, best-for tags, and dynamic `details` key-value blocks
- Handles scalar and array values gracefully

---

## 5. Data & Type Model

### 5.1 Frontend Type

```ts
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

### 5.2 Backend Activity Logging Type
`Activity.metadata_json` includes structured request metadata for finder usage metrics.

---

## 6. Error Handling & Reliability

### 6.1 Frontend
- Prevents empty requests early.
- Catches network/API errors and surfaces user alert.
- Uses loading + generated flags to avoid stale UI states.

### 6.2 Backend
- Returns `400` for missing title+plan.
- Wraps endpoint in `try/except` and returns `500` for unexpected errors.
- Logs successful usage only after recommendation generation.

### 6.3 JSON Robustness
- LLM output is parsed via `json.loads(...)`.
- Strict JSON mode significantly reduces malformed responses.

---

## 7. End-to-End Sequence

1. User enters title/plan and clicks **Find Datasets & Benchmarks**.
2. Frontend posts payload to `/api/find-datasets-benchmarks`.
3. Backend validates inputs and calls `generate_dataset_benchmark_finder`.
4. LLM returns strict JSON recommendations.
5. Backend logs finder activity to DB and returns response.
6. Frontend renders domain summary + datasets + benchmarks + technologies.
7. User opens details modal for deeper implementation-level metadata.

---

## 8. Notes for Future Improvement

- Add server-side schema validation for LLM response (Pydantic model) before returning to frontend.
- Add retry/fallback logic when JSON is malformed or partially missing keys.
- Add optional region/license filtering for production-grade dataset selection.
- Add persistence of selected dataset/benchmark to user workspace for downstream planning workflows.
