# Experiment Planner: Complete Workflow Documentation

**Purpose:** Generate step-by-step AI/ML experiment execution plans based on research topic and difficulty level.

---

## Architecture Overview

```
User Input (Frontend)
    ├─ Topic (e.g., "Neural Architecture Search")
    └─ Difficulty: Beginner / Intermediate / Advanced
    
Backend LLM Generation
    ├─ JSON Schema Enforcement
    ├─ Structured Step Generation
    └─ Icon/Module Mapping
    
Output Visualization
    ├─ Card-based Step Layout
    ├─ Icon + Title + Details
    ├─ Risk Assessment
    └─ Hyperparameter Guidance
```

---

## 1. Frontend Request Flow

**File:** `frontend/src/pages/ExperimentPlanner.tsx`

### 1.1 Input Collection
- User enters research topic (text input)
- User selects difficulty level (dropdown):
  - Beginner: 5-6 steps, foundational concepts
  - Intermediate: 6-8 steps, advanced techniques
  - Advanced: 8-10 steps, state-of-the-art methods
- Click "Generate Plan" button

### 1.2 Request Dispatch
```javascript
POST /api/plan-experiment
{
  "topic": "Efficient Vision Transformers",
  "difficulty": "Advanced"
}
```

### 1.3 Response Reception
```javascript
{
  "steps": [
    {
      "num": 1,
      "title": "Dataset Selection & Curation",
      "iconName": "Database",
      "details": "Select benchmark vision datasets (ImageNet-1K, COCO, or custom)...",
      "params": "Batch size: 128-256, Resolution: 224x224",
      "risks": "Insufficient diversity may limit model generalization"
    },
    // ... more steps
  ]
}
```

### 1.4 Rendering
- Each step rendered as an expandable card
- Icon loaded from Lucide React library
- Timeline visualization (step 1 → 2 → ... → N)
- Optional: Copy plan to clipboard, save as PDF

---

## 2. Data Retrieval & LLM Request

### 2.1 API Endpoint
**File:** `backend/app/api/routes.py` → `POST /plan-experiment`

```python
@router.post("/plan-experiment")
async def plan_experiment(payload: ExperimentPlanRequest, ...):
    topic = payload.topic
    difficulty = payload.difficulty
    plan = generate_experiment_plan(topic, difficulty)
    
    db_activity = Activity(
        user_id=user_id,
        action_type="plan_experiment",
        metadata_json={"topic": topic, "difficulty": difficulty}
    )
    db.add(db_activity)
    db.commit()
    
    return JSONResponse(plan)
```

### 2.2 LLM Call Architecture
**File:** `backend/app/services/llm_sections/generation.py` → `generate_experiment_plan()`

**LLM Provider:** Groq  
**Model Routing (April 2026):**
- Primary: `openai/gpt-oss-120b`
- Fallbacks: `llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`
- Fallback logic: tries next model if primary is unavailable/rate-limited
**Response Format:** Strict JSON schema

**Prompt Structure:**
```
You are an expert AI researcher. Generate a highly constructive, rich, and 
technical AI/ML experiment execution plan for the topic: "{topic}" at a 
{difficulty} difficulty level.

JSON Schema:
{
  "steps": [
    {
      "num": 1,
      "title": "Stage Title",
      "iconName": "IconName",  // Must be valid Lucide React icon
      "details": "Deeply technical strategy description.",
      "params": "Specific metrics, hyperparams, or dataset identifiers",
      "risks": "Nuanced technical risks or edge cases"
    }
  ]
}

Step count by difficulty:
- Beginner: 5-6 steps
- Intermediate: 6-8 steps  
- Advanced: 8-10 steps

Encouraged Modules (especially for Advanced):
- Dataset Selection & Curation → Icon: Database
- Advanced Preprocessing / Feature Engineering → Icon: Cog
- Custom Model Architecture Design → Icon: Cpu or PenTool
- Training Logic & Optimization → Icon: Play
- Explainable AI (XAI) / Interpretability → Icon: Eye
- Robust Evaluation & Ablation → Icon: BarChart3
- Deployment, Scaling & Monitoring → Icon: Cloud
- Ethical Review / Bias Mitigation → Icon: Shield
```

---

## 3. Data Processing

### 3.1 Prompt Engineering
**Dynamic Topic Integration:**
```python
prompt = f"""
Generate plan for: "{topic}" at {difficulty} level.

Response MUST be JSON matching exact structure with:
- num: Sequential step number
- title: Concise module name
- iconName: Valid Lucide icon name
- details: 2-3 paragraphs of technical depth
- params: Specific values, ranges, or hyperparameters
- risks: Edge cases, failure modes, mitigation strategies
"""
```

### 3.2 JSON Schema Enforcement
```python
response = create_completion_with_fallback(
  llm_client=client,
  task_name="experiment_planner",
  primary_model="openai/gpt-oss-120b",
  fallback_models="llama-3.3-70b-versatile,meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[
        {
            "role": "system",
            "content": "You are a senior AI researcher designed to return perfect JSON structures."
        },
        {"role": "user", "content": prompt}
    ],
    response_format={"type": "json_object"}  # Enforce JSON output
)

result = json.loads(response.choices[0].message.content)
```

**Why JSON Mode?**
- Eliminates parsing ambiguity
- Guarantees all steps follow schema
- Frontend can directly render without post-processing
- Easier to validate step count matches difficulty
- Model fallback prints terminal traces (`[MODEL]` / `[MODEL-FALLBACK]`) for observability.

### 3.3 Content Quality Standards

**For Each Step:**

| Field | Requirements | Example |
|-------|--------------|---------|
| `num` | 1-N sequential | 3 |
| `title` | Concise, action-oriented | "Custom Model Architecture Design" |
| `iconName` | Valid Lucide React icon | "Cpu", "PenTool", "Database" |
| `details` | 3-5 sentences, domain-specific | "Design CNN backbone with residual blocks..." |
| `params` | Specific hyperparameters/ranges | "Learning rate: 1e-3, Epochs: 100-200" |
| `risks` | 2-3 common failure modes | "Overfitting on small datasets..." |

### 3.4 Difficulty-Driven Scaffolding

**Beginner (5-6 steps):**
- Dataset curation
- Basic preprocessing
- Simple model architecture
- Standard training loop
- Evaluation metrics
- Documentation

**Intermediate (6-8 steps):**
- ^ + Advanced preprocessing
- ^ + Custom model design
- ^ + Optimization strategies
- ^ + Ablation studies

**Advanced (8-10 steps):**
- ^ + All of intermediate
- ^ + Explainability/XAI
- ^ + Deployment & scaling
- ^ + Ethical review
- ^ + Hardware considerations

---

## 4. Response Handling & Visualization

### 4.1 Frontend Processing
```javascript
const data = await res.json();  // Already parsed JSON
setSteps(data.steps);

return data.steps.map((step) => (
  <StepCard
    key={step.num}
    step={step}
    icon={getIcon(step.iconName)}  // Lucide React dynamic icon
  />
));
```

### 4.2 StepCard Component
```jsx
<div className="relative flex items-start gap-4">
  {/* Timeline connector */}
  <div className="absolute left-5 top-14 h-24 w-[2px] bg-border" />
  
  {/* Step card */}
  <div className="rounded-lg border p-4">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
        {Icon && <Icon className="w-5 h-5 text-accent" />}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Step {step.num}</p>
        <h3 className="font-semibold">{step.title}</h3>
      </div>
    </div>
    
    <p className="text-sm prose">{step.details}</p>
    
    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
      <div>
        <p className="font-mono text-muted-foreground">Params</p>
        <p>{step.params}</p>
      </div>
      <div>
        <p className="font-mono text-muted-foreground">Risks</p>
        <p>{step.risks}</p>
      </div>
    </div>
  </div>
</div>
```

### 4.3 Visual Hierarchy
- **Timeline:** Vertical line connecting all steps
- **Icons:** Color-coded, large, easy to scan
- **Typography:** Title > Details > Metadata (params/risks)
- **Color Coding:** Each step gets unique icon color
- **Expandable:** Click to reveal full details or collapse

---

## 5. Data Storage & Analytics

### 5.1 Database Logging
```python
db_activity = Activity(
    user_id=user_id,
    action_type="plan_experiment",
    metadata_json={
        "topic": the_topic,
        "difficulty": difficulty,
        "step_count": len(steps),
        "generated_at": timestamp
    }
)
db.add(db_activity)
db.commit()
```

**Analytics Enabled:**
- Most popular topics
- Difficulty distribution
- User engagement patterns
- Topic trends over time

### 5.2 Caching
**Currently disabled** - Each request generates new plan  
**Rationale:** LLM responses vary; re-requesting same topic may yield improved plans

**Future Enhancement:** Debate between:
- Caching for performance (quick future requests)
- Re-generating for innovation (always fresh ideas)

---

## 6. Failure Modes & Error Handling

| Scenario | Root Cause | Response | Recovery |
|----------|-----------|----------|----------|
| Invalid JSON | LLM hallucination | `json.JSONDecodeError` | Retry with stricter prompt |
| Wrong field types | Schema mismatch | `KeyError` accessing field | Validate against schema |
| Missing `iconName` | Invalid Lucide icon | Frontend fallback icon | Check valid icon list |
| Step count mismatch | LLM ignores difficulty | Accept as-is | Log warning in analytics |
| Empty `details` | Model brevity | Show placeholder | Reprompt for elaboration |
| Timeout (>10s) | LLM slow | `504 Timeout` → Frontend error | Show "Generation timeout" |

---

## 7. Configuration & Customization

**Environment Variables:**

| Config | Default | Usage |
|--------|---------|-------|
| `MODEL_NAME` | "llama-3.1-8b-instant" | Groq LLM model to use |
| `GENERATE_PLAN_TIMEOUT` | 10 | Seconds before timeout |
| `MAX_RETRIES` | 2 | JSON parse retry attempts |
| `TEMPERATURE` | 0.7 | LLM creativity (0.0-1.0) |

**Example Advanced Topic:**
```
Topic: "Efficient Transformers with Sparse Attention"
Difficulty: Advanced

Output Steps:
1. Literature Review & Sparse Attention Mechanisms (Icon: Search)
2. Dataset Preparation & Tokenization (Icon: Database)
3. Custom CUDA Kernel Development (Icon: Cpu)
4. Model Architecture with Attention Patterns (Icon: PenTool)
5. Training with Gradient Checkpointing (Icon: Play)
6. Inference Optimization & Quantization (Icon: Zap)
7. Comparison vs. Dense Attention Baselines (Icon: BarChart3)
8. Deployment & Production Monitoring (Icon: Cloud)
9. Ablation Studies on Attention Sparsity (Icon: Activity)
```

---

## 8. Performance Characteristics

| Operation | Time | Memory | Notes |
|-----------|------|--------|-------|
| LLM Plan Generation | 2-5s | 100MB | Groq API latency |
| JSON Parsing | <0.1s | 5MB | Python json library |
| Database Write | <0.5s | 10MB | Activity logging |
| **Total Latency** | **2-6s** | **115MB** | Dominated by LLM |

**Optimization Opportunities:**
- Implement response streaming for perceived faster UX
- Cache plans by topic + difficulty (with refresh option)
- Pre-generate templates for common topics

---

## 9. Integration Examples

### 9.1 Frontend Integration
```typescript
const handleGeneratePlan = async (topic: string, difficulty: string) => {
  setLoading(true);
  try {
    const response = await fetch("/api/plan-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, difficulty })
    });
    
    const data = await response.json();
    setSteps(data.steps);
    setShowPlan(true);
  } catch (error) {
    toast.error("Failed to generate plan");
  } finally {
    setLoading(false);
  }
};
```

### 9.2 Exporting Plan
```javascript
// Convert steps to markdown or PDF
const exportMarkdown = (steps) => {
  return steps.map(s => `
## ${s.num}. ${s.title}

${s.details}

**Parameters:** ${s.params}  
**Risks:** ${s.risks}
  `).join("\n\n");
};
```

---

## 10. Future Enhancements

1. **Multi-Domain Support:** Extend beyond AI/ML to other research domains
2. **Collaborative Planning:** Multiple users contributing to single plan
3. **Progress Tracking:** UI to mark completed steps, attach results
4. **Peer Validation:** Community rating/reviewing of plans
5. **Integration with Paper Analyzer:** Reference analyzed papers in plan steps
6. **Real Experiment Data:** Link generated plans to actual experiment results

---

## 11. Summary

1. **User inputs topic + difficulty** → Frontend sends to `/api/plan-experiment`
2. **Backend calls Groq LLM** with JSON schema enforcement
3. **LLM generates N steps** with icons, parameters, and risk assessment
4. **JSON parsed and validated** → Step count matches difficulty level
5. **Steps rendered as timeline** → Expandable cards with visual hierarchy
6. **Activity logged** → For analytics and user history
7. **User can review/export** → Save as markdown, PDF, or copy

**Key Strengths:**
- Structured, reproducible plans with consistent formatting
- Rich technical guidance (params, risks, rationale)
- Difficulty-driven scaffolding ensures appropriate complexity
- JSON schema eliminates parsing ambiguity

**Key Constraints:**
- LLM-generated (can hallucinate hyperparameters)
- No validation that steps are actually feasible
- Single plan per request (no iterative refinement UI)
- No integration with actual experiment tools yet
