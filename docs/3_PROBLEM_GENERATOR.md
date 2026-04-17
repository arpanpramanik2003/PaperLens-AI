# Problem Generator: Complete Workflow Documentation

**Purpose:** Generate novel, impactful research problem statements based on domain, subdomain, and complexity level. Allow users to expand selected problems into detailed step-by-step execution briefs.

---

## Architecture Overview

```
User Input (Frontend)
    ├─ Domain (e.g., "Natural Language Processing")
    ├─ Subdomain (e.g., "Multimodal Transformers")
    └─ Complexity: Low / Medium / High
    
LLM Ideation Phase
    ├─ Generate 4-6 novel research problems
    ├─ Assign impact ratings (3-5)
    └─ Add relevant tags
    
Problem Expansion Phase
    ├─ User selects "Use this idea"
    ├─ LLM expands same problem into detailed brief
    └─ Shows step-by-step execution plan
    
Output Display
    ├─ Grid of idea cards (initial view)
    └─ Floating modal with detailed expansion
```

---

## 1. Frontend Request Lifecycle

**File:** `frontend/src/pages/ProblemGenerator.tsx`

### 1.1 Input Collection
```jsx
<Input 
  placeholder="e.g., Natural Language Processing" 
  value={domain}
  onChange={(e) => setDomain(e.target.value)}
/>

<Input 
  placeholder="e.g., Sentiment Analysis" 
  value={subdomain}
  onChange={(e) => setSubdomain(e.target.value)}
/>

<Select value={complexity} onValueChange={setComplexity}>
  <SelectItem value="low">Low</SelectItem>
  <SelectItem value="medium">Medium</SelectItem>
  <SelectItem value="high">High</SelectItem>
</Select>

<Button onClick={handleGenerate}>Generate Ideas</Button>
```

### 1.2 Problem Generation Request
```javascript
POST /api/generate-problems
{
  "domain": "Natural Language Processing",
  "subdomain": "Language Model Compression",
  "complexity": "high"
}
```

### 1.3 Response Reception (Initial)
```javascript
{
  "ideas": [
    {
      "title": "Efficient Knowledge Distillation for LLMs",
      "desc": "Develop a framework for compressing large language models...",
      "tags": ["Compression", "Distillation", "LLM"],
      "rating": 5
    },
    // ... 4-5 more ideas
  ]
}
```

### 1.4 Idea Card Display
- Each idea rendered as a card in 2-column grid
- Shows: Title, brief description, tags, star rating
- Button: "Use this idea" (initially non-functional, now wired)

### 1.5 Expansion Phase
- User clicks "Use this idea" on a card
- Frontend calls `/api/expand-problem` with same domain/subdomain/complexity + selected idea
- Loading state: Button changes to "Loading details..."
- Success: Floating modal appears with full detailed breakdown

---

## 2. Initial Problem Generation

### 2.1 API Endpoint
**File:** `backend/app/api/routes.py` → `POST /generate-problems`

```python
@router.post("/generate-problems")
async def generate_problems(payload: ProblemGeneratorRequest, ...):
    ideas = generate_research_problems(
        payload.domain,
        payload.subdomain,
        payload.complexity
    )
    
    db_activity = Activity(
        user_id=user_id,
        action_type="generate_problems",
        metadata_json={
            "domain": payload.domain,
            "subdomain": payload.subdomain,
            "complexity": payload.complexity
        }
    )
    db.add(db_activity)
    db.commit()
    
    return JSONResponse(ideas)
```

### 2.2 LLM Generation: `generate_research_problems()`
**File:** `backend/app/services/llm_sections/generation.py`

**LLM Provider:** Groq  
**Model Routing (April 2026):**
- Primary: `openai/gpt-oss-120b`
- Fallbacks: `llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`
- Automatic fallback on model errors/rate limits
**Response Format:** JSON with strict schema

**Prompt:**
```
You are a visionary AI research lead. Generate absolute top-tier, novel, and 
highly impactful research ideas for the domain: "{domain}" and subdomain: 
"{subdomain}" at a {complexity} complexity level.

Respond strictly in JSON format:
{
  "ideas": [
    {
      "title": "Title of the research problem",
      "desc": "A deep, constructive, and technical description of the gap...",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "rating": 5
    }
  ]
}

Guidelines:
- Generate 4 to 6 unique ideas
- Ratings: 3-5 based on difficulty + impact
- Tags: Specific & technical (e.g., "NLP", "XAI", "Optimization")
- Descriptions: Constructive, rich, problem-focused
```

### 2.3 Content Quality Standards

**For Each Problem:**

| Field | Requirements | Example |
|-------|--------------|---------|
| `title` | Concise, impactful | "Efficient Knowledge Distillation for LLMs" |
| `desc` | 3-5 sentences, gap identification | "Current distillation methods... This work proposes..." |
| `tags` | 2-4 specific tags | ["Compression", "Distillation", "Efficiency"] |
| `rating` | 3-5 (int) | 4 (high impact, medium difficulty) |

**Rating Scale:**
- 3: Feasible, incremental, lower risk
- 4: Impactful, moderate difficulty, good research value
- 5: Ambitious, challenging, high novelty

### 2.4 Complexity-Driven Ideation

**Low Complexity:**
- Incremental improvements on existing methods
- Well-defined problem spaces
- Lower technical barrier to entry
- Examples: "Improved data augmentation for [task]"

**Medium Complexity:**
- Novel architecture or approach
- Requires multiple baselines
- Some technical risk
- Examples: "Cross-domain transfer learning framework"

**High Complexity:**
- Cutting-edge, unexplored areas
- Multiple research phases
- High technical depth
- Examples: "Unified framework for multimodal + reasoning"

---

## 3. Problem Expansion (Detail Generation)

### 3.1 Expansion Endpoint
**File:** `backend/app/api/routes.py` → `POST /expand-problem`

```python
@router.post("/expand-problem")
async def expand_problem(payload: ProblemDetailRequest, ...):
    details = expand_problem_details(
        payload.domain,
        payload.subdomain,
        payload.complexity,
        payload.idea,  # Full idea dict from initial generation
    )
    
    db_activity = Activity(
        user_id=user_id,
        action_type="expand_problem",
        metadata_json={"title": payload.idea.get("title", "")}
    )
    db.add(db_activity)
    db.commit()
    
    return JSONResponse(details)
```

### 3.2 LLM Expansion: `expand_problem_details()`
**File:** `backend/app/services/llm_sections/generation.py`

**Model Routing:** Same heavy model chain as problem generation.

**Key Constraint:**  
"Keep the SAME core problem statement; do not invent a different problem."

**Prompt:**
```
You are an expert AI research mentor.

Given an EXISTING research problem idea, expand it into a practical, 
step-by-step execution brief.

Important: Keep the SAME core problem statement as provided.

Original Idea:
- Title: {title}
- Description: {description}
- Tags: {tags}

Respond strictly in JSON:
{
  "title": "Original problem title",
  "problem_statement": "Refined one-paragraph statement (same problem)",
  "objective": "Primary measurable objective",
  "step_by_step": [
    {
      "step": 1,
      "title": "Step title",
      "details": "What to do in this step"
    }
  ],
  "datasets": ["Dataset/tool 1"],
  "evaluation_metrics": ["Metric 1"],
  "expected_outcomes": ["Outcome 1"]
}

Guidelines:
- Generate 6 to 8 steps
- Each step: clear and actionable
- Datasets: Only technically relevant
- Metrics: Aligned with problem domain
- Outcomes: Specific and measurable
```

### 3.3 Expansion Output Structure

```python
{
  "title": "Efficient Knowledge Distillation for LLMs",
  
  "problem_statement": 
    "Current large language models face deployment constraints due to "
    "size and latency. This work proposes a novel distillation framework "
    "that maintains reasoning capability while reducing parameters by 70%.",
  
  "objective":
    "Achieve <10% accuracy drop vs. baseline while reducing model size "
    "from 7B to 2B parameters",
  
  "step_by_step": [
    {
      "step": 1,
      "title": "Literature Review & Baseline Selection",
      "details": "Survey existing distillation techniques..."
    },
    {
      "step": 2,
      "title": "Teacher Model Selection & Analysis",
      "details": "Choose a strong 7B teacher LLM..."
    },
    // ... 6-8 total steps
  ],
  
  "datasets": ["OpenWebText", "MMLU", "HellaSwag"],
  
  "evaluation_metrics": [
    "Accuracy on downstream tasks",
    "Inference latency (ms/token)",
    "Memory footprint (GB)"
  ],
  
  "expected_outcomes": [
    "2B model with 92% of teacher accuracy",
    "3-5x faster inference",
    "Production-ready compression pipeline"
  ]
}
```

---

## 4. Data Retrieval & Processing

### 4.1 Context Enrichment
When expanding a problem, the LLM receives:
- **Domain context:** Field-specific knowledge from domain string
- **Subdomain focus:** Narrowed technical area
- **Complexity signal:** Difficulty level affects step count and depth
- **Original idea:** Title + description + tags to anchor expansion
- **Implicit experience:** LLM trained on research papers/projects

### 4.2 Step Number Scaling by Complexity

**Low Complexity:**
- 5-6 steps
- Each step broad, easier to execute
- Example: Dataset → Baseline → Eval → Report

**Medium Complexity:**
- 6-7 steps
- Include preprocessing, ablation
- Example: Dataset → Preprocessing → Model → Train → Evaluate → Ablate

**High Complexity:**
- 7-8 steps
- Include architecture design, optimization, deployment
- Example: Literature → Datasets → Design → Implement → Train → Eval → Ablate → Deploy

### 4.3 JSON Schema Enforcement
```python
response = create_completion_with_fallback(
  llm_client=client,
  task_name="problem_expansion",
  primary_model="openai/gpt-oss-120b",
  fallback_models="llama-3.3-70b-versatile,meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[{
        "role": "system",
        "content": "You expand research problems into detailed plans. Return strict JSON."
    }, {
        "role": "user",
        "content": prompt
    }],
    response_format={"type": "json_object"}
)

result = json.loads(response.choices[0].message.content)
```

---

## 5. Frontend Display & Interaction

### 5.1 Initial Grid View (Ideas)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {ideas.map((idea, i) => (
    <motion.div className="rounded-xl border bg-card p-5">
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star 
            key={j} 
            className={j < idea.rating ? "fill-accent" : "text-border"}
          />
        ))}
      </div>
      
      {/* Title & Description */}
      <h3 className="text-sm font-semibold mb-2">{idea.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{idea.desc}</p>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {idea.tags.map(tag => (
          <span key={tag} className="text-[10px] bg-secondary px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
      
      {/* Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleUseIdea(idea, i)}
        disabled={expandingIdeaIndex === i}
      >
        {expandingIdeaIndex === i ? "Loading..." : "Use this idea"}
      </Button>
    </motion.div>
  ))}
</div>
```

### 5.2 Floating Modal View (Expanded Detail)
```jsx
{selectedIdea && selectedIdeaDetails && (
  <motion.div
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    onClick={() => setExpandedIdeaIndex(null)}
  >
    <motion.div
      className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl bg-card p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedIdeaDetails.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            Detailed problem brief
          </p>
        </div>
        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => setExpandedIdeaIndex(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {/* Problem Statement */}
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">
            Problem Statement
          </p>
          <p className="text-sm text-foreground/90">
            {selectedIdeaDetails.problem_statement}
          </p>
        </div>
        
        {/* Objective */}
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">
            Objective
          </p>
          <p className="text-sm text-foreground/90">
            {selectedIdeaDetails.objective}
          </p>
        </div>
        
        {/* Step-by-Step */}
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">
            Step-by-Step Plan
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm">
            {selectedIdeaDetails.step_by_step.map((step) => (
              <li key={step.step}>
                <span className="font-medium">{step.title}:</span>
                {" "}{step.details}
              </li>
            ))}
          </ol>
        </div>
        
        {/* 3-Column Grid: Datasets, Metrics, Outcomes */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">
              Datasets/Tools
            </p>
            <ul className="list-disc pl-4 text-xs">
              {selectedIdeaDetails.datasets.map(d => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">
              Metrics
            </p>
            <ul className="list-disc pl-4 text-xs">
              {selectedIdeaDetails.evaluation_metrics.map(m => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">
              Expected Outcomes
            </p>
            <ul className="list-disc pl-4 text-xs">
              {selectedIdeaDetails.expected_outcomes.map(o => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
```

---

## 6. State Management

**Frontend State Variables:**
```javascript
const [domain, setDomain] = useState("");
const [subdomain, setSubdomain] = useState("");
const [complexity, setComplexity] = useState("medium");
const [ideas, setIdeas] = useState([]);  // Initial 4-6 ideas

const [ideaDetails, setIdeaDetails] = useState({});  // Per-idea expansion
const [expandedIdeaIndex, setExpandedIdeaIndex] = useState(null);  // Which modal open?
const [expandingIdeaIndex, setExpandingIdeaIndex] = useState(null);  // Loading?
const [loading, setLoading] = useState(false);  // Generate button loading
const [generated, setGenerated] = useState(false);  // Show grid?
```

**UI Logic:**
- Click "Generate Ideas" → Fetch initial ideas, show grid
- Click "Use this idea" → Fetch expansion, show modal, store in `ideaDetails`
- Click X or background → Hide modal
- Re-clicking same card → Reshow modal (cached expansion)

---

## 7. Demo Mode (Unauthenticated Users)

When `userId` is null:
```javascript
const buildDemoDetails = (idea) => ({
  title: idea.title,
  problem_statement: idea.desc,
  objective: "Build and validate a reproducible solution pipeline...",
  step_by_step: [
    { step: 1, title: "Scope the problem", details: "Define..." },
    // ... 6 demo steps
  ],
  datasets: ["Domain benchmark"],
  evaluation_metrics: ["Primary task metric"],
  expected_outcomes: ["Validated improvement"]
});
```

Demo users see hardcoded expansion structure instead of LLM-generated.

---

## 8. Database Logging

```python
Activity(
    user_id=user_id,
    action_type="generate_problems",
    metadata_json={
        "domain": domain,
        "subdomain": subdomain,
        "complexity": complexity,
        "idea_count": len(ideas)
    }
)

Activity(
    user_id=user_id,
    action_type="expand_problem",
    metadata_json={
        "idea_title": idea_title,
        "domain": domain,
        "step_count": len(steps)
    }
)
```

**Analytics Enabled:**
- Popular domains/subdomains
- Complexity distribution
- Expansion adoption rate
- User research patterns

---

## 9. Failure Modes & Recovery

| Scenario | Root Cause | UX | Recovery |
|----------|-----------|----|-----------  |
| Invalid JSON response | LLM hallucination | "Failed to generate" | Retry generation |
| Missing fields in expansion | Incomplete LLM output | Modal shows partial data | User manually fills |
| Timeout on expansion | Slow LLM | "Loading..." gets stuck | 10s timeout → error |
| Empty ideas list | LLM refuses | Blank grid | Show demo ideas |
| Session expires during expansion | Auth loss | "Unauthorized" | Redirect to login |

---

## 10. Performance Characteristics

| Operation | Time | Memory |
|-----------|------|--------|
| Generate 4-6 ideas | 3-5s | 100MB |
| Expand problem to details | 2-4s | 80MB |
| JSON parse (both) | <0.2s | 10MB |
| DB write (both ops) | <0.5s | 10MB |
| **Total per flow** | **5-9s** | **200MB** |

---

## 11. Configuration

**Environment Variables:**

| Config | Default | Usage |
|--------|---------|-------|
| `MODEL_NAME` | "llama-3.1-8b-instant" | General/default model in other modules |
| `IDEA_SEED` | 42 | Reproducibility |
| `MIN_IDEAS` | 4 | Minimum ideas per request |
| `MAX_IDEAS` | 6 | Maximum ideas per request |

Note:
- Current generation path model routing is hardcoded in `llm_sections/generation.py` to heavy model + fallback chain.
- `[MODEL]` and `[MODEL-FALLBACK]` traces are printed to terminal during execution.

---

## 12. Future Enhancements

1. **Collaborative Refinement:** Users critique ideas → LLM regenerates
2. **Link to Papers:** Suggest related papers from Paper Analyzer
3. **Experiment Integration:** Link problem to Experiment Planner
4. **Impact Scoring:** Peer rating of problems before/after execution
5. **Multi-Stage Expansion:** Generate hypotheses → Methods → Eval strategy separately
6. **Topic Recommendations:** Based on analyzed papers → Suggest novel problem areas

---

## 13. Summary

1. **User inputs domain + subdomain + complexity**
   → Frontend sends to `/api/generate-problems`

2. **LLM generates 4-6 novel research problems**
   → Each with title, description, tags, rating

3. **Grid displays all ideas as clickable cards**
   → User selects one to expand

4. **Frontend calls `/api/expand-problem` with selected idea**
   → LLM expands same problem into detailed execution brief

5. **Floating modal shows step-by-step plan**
   → Expanded to 6-8 steps with datasets, metrics, outcomes

6. **Activity logged for analytics**
   → Tracks popular domains, complexity trends

**Key Strengths:**
- Preserves original problem intent during expansion
- Difficulty-scaled complexity
- Floating modal UX (non-invasive, clean)
- Caching of expanded details

**Key Constraints:**
- LLM-generated (can be speculative)
- No validation domain/subdomain are real AI fields
- No integration with external research tools yet
- Single expansion per problem (no iterative refinement)
