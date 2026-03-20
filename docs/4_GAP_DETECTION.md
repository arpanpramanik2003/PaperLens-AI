# Gap Detection: Complete Workflow Documentation

**Purpose:** Analyze research papers or user-provided text to identify specific technical research gaps, weaknesses, and actionable research directions to bridge those gaps.

---

## Architecture Overview

```
User Input (Frontend)
    ├─ Upload Paper (PDF/DOCX)
    └─ OR Paste Text Directly
    
Backend Processing
    ├─ Parse/Summarize Input
    ├─ LLM Analyzes for Gaps
    └─ Returns 4-6 identify gaps with severity/suggestions
    
Output Visualization
    ├─ Gap Cards with Severity Badges
    ├─ Expandable Details
    └─ Actionable Research Directions
```

---

## 1. Frontend Request Lifecycle

**File:** `frontend/src/pages/GapDetection.tsx`

### 1.1 Input Collection
Two input modes:

**Mode A: File Upload**
```jsx
<input 
  type="file" 
  accept=".pdf,.docx"
  onChange={(e) => handleFileSelect(e.target.files[0])}
/>
```

**Mode B: Text Input**
```jsx
<textarea
  placeholder="Paste paper abstract or summary here..."
  value={textInput}
  onChange={(e) => setTextInput(e.target.value)}
  rows={6}
/>
```

### 1.2 Request Dispatch
```javascript
// Option A: File upload
const formData = new FormData();
formData.append("file", selectedFile);

// Option B: Text input
const formData = new FormData();
formData.append("text", textInput);

// Both use same endpoint
POST /api/detect-gaps
method: "POST"
body: formData (multipart)
```

### 1.3 Response Reception
```javascript
{
  "gaps": [
    {
      "title": "Limited Baseline Comparisons",
      "explanation": "Paper only compares against 2 baselines from 2019...",
      "severity": "medium",
      "suggestion": "Implement comparisons with recent SOTA methods..."
    },
    // ... 4-5 more gaps
  ]
}
```

### 1.4 Display
- Each gap rendered as an expandable card
- Severity badge (red=high, orange=medium, green=low)
- Title visible by default
- Click to expand for full explanation + suggestion
- Action buttons: "Research this gap", "Add to notes"

---

## 2. Backend Processing Pipeline

### 2.1 API Endpoint
**File:** `backend/app/api/routes.py` → `POST /detect-gaps`

```python
@router.post("/detect-gaps")
async def detect_gaps(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content_to_analyze = ""
    
    # Mode A: File uploaded
    if file and file.filename:
        ext = os.path.splitext(file.filename.lower())[1]
        if ext not in [".pdf", ".docx"]:
            return JSONResponse({"error": "Only PDF/DOCX"}, 400)
        
        path = os.path.join(settings.UPLOAD_FOLDER, file.filename)
        with open(path, "wb") as handle:
            shutil.copyfileobj(file.file, handle)
        
        if ext == ".pdf":
            pages = extract_pdf_pages(path, ...)
        else:
            pages = extract_docx_pages(path, ...)
        
        try:
            os.remove(path)
        except:
            pass
        
        if not pages:
            return JSONResponse({"error": "Could not extract"}, 400)
        
        chunks = chunk_text_semantic(pages)
        content_to_analyze = summarize_chunks(chunks)  # Condense to key points
    
    # Mode B: Text provided
    elif text:
        content_to_analyze = text
    
    else:
        return JSONResponse({"error": "No file or text"}, 400)
    
    # Call LLM gap detection
    from app.services.llm import detect_research_gaps
    gaps = detect_research_gaps(content_to_analyze)
    
    # Log activity
    db_activity = Activity(
        user_id=user_id,
        action_type="detect_gaps",
        metadata_json={"method": "file" if file else "text"}
    )
    db.add(db_activity)
    db.commit()
    
    return JSONResponse(gaps)
```

### 2.2 Input Condensing
**For file uploads:**
```python
content_to_analyze = summarize_chunks(chunks)
```

**Why summarize?**
- LLM context window limited (~2K tokens)
- Summarization extracts key information
- Preserves paper essence while reducing length
- Speeds up gap detection

**For text input:**
```python
content_to_analyze = text  # Used as-is
```

---

## 3. LLM Gap Detection

### 3.1 LLM Function
**File:** `backend/app/services/llm.py` → `detect_research_gaps()`

**LLM Provider:** Groq  
**Model:** `mixtral-8x7b-32768`  
**Response Format:** JSON with strict schema

**Prompt:**
```
You are an elite, highly critical research peer reviewer. Analyze the 
following summary of a research paper and identify 4 to 6 specific, 
technical research gaps.

For each gap, provide:
- title: A concise, impactful name
- explanation: Detailed explanation of weakness/missing element
- severity: One of "low", "medium", or "high"
- suggestion: Specific, actionable research direction to bridge gap

Respond strictly in JSON:
{
  "gaps": [
    {
      "title": "Gap Title",
      "explanation": "Why this is a problem...",
      "severity": "high",
      "suggestion": "How to address this gap..."
    }
  ]
}

Paper Summary:
{analysis_text}
```

### 3.2 Gap Quality Standards

**Example High-Quality Gap:**
```json
{
  "title": "Scalability to Long-Context Transformers",
  "explanation": "The proposed attention mechanism has O(n²) complexity with respect to sequence length. While the paper evaluates on sequences up to 2K tokens, modern applications (e.g., long-document understanding, video understanding) require 32K+ token contexts. At this scale, the method becomes memory-prohibitive and slow.",
  "severity": "high",
  "suggestion": "Design a sparse attention pattern that reduces complexity to O(n log n) or implement a hierarchical attention scheme. Benchmark against existing linear-attention methods (e.g., Linformer, Performer) on long-context tasks like ArXiv document understanding."
}
```

**Example Lower-Quality Gap (Vague):**
```json
{
  "title": "Generalization",
  "explanation": "The model might not generalize well.",
  "severity": "medium",
  "suggestion": "Test on more datasets."
}
```

**Criteria for Good Gaps:**
- ✅ Specific weakness identified (not vague)
- ✅ Technical depth demonstrated
- ✅ Severity justified (high = blocks adoption, medium = limits scope, low = marginal)
- ✅ Actionable suggestion with concrete next steps
- ✅ References to alternative approaches or benchmarks

### 3.3 Severity Classification

**HIGH:**
- Blocks practical deployment
- Fundamental limitation (e.g., O(n²) complexity)
- Safety/ethical concerns
- Missing comparison to standard baselines

**MEDIUM:**
- Limits scope or generalization
- Partial solution to stated problem
- Implementation details unclear
- Evaluated on limited domains

**LOW:**
- Minor improvements possible
- Edge case not addressed
- Documentation could be clearer
- Nice-to-have feature missing

### 3.4 JSON Schema Enforcement
```python
response = client.chat.completions.create(
    model=settings.MODEL_NAME,
    messages=[
        {
            "role": "system",
            "content": "You are a critical research reviewer designed to output structured JSON."
        },
        {"role": "user", "content": prompt}
    ],
    response_format={"type": "json_object"}
)

gaps_data = json.loads(response.choices[0].message.content)
return gaps_data
```

---

## 4. Data Processing Workflow

### 4.1 File → Text Extraction Path

```
PDF/DOCX File
    ↓
extract_pdf_pages() / extract_docx_pages()
    ↓
List[{"page": int, "text": str}]
    ↓
chunk_text_semantic()
    ↓
List[{"text": str, "page": int, ...}]
    ↓
summarize_chunks()
    ↓
"Paper introduces novel attention mechanism..."
```

### 4.2 Summarization Strategy
**File:** `backend/app/services/llm.py` → `summarize_chunks()`

```python
def summarize_chunks(chunks):
    summaries = []
    chunks = sample_chunks_evenly(chunks, 3)  # First, middle, end
    
    for chunk in chunks:
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[{
                "role": "system",
                "content": "Summarize academic text faithfully and concisely."
            }, {
                "role": "user",
                "content": f"Summarize:\n{chunk["text"]}"
            }]
        )
        summaries.append(response.choices[0].message.content)
    
    return " ".join(summaries)  # Concatenate summaries
```

**Why Sample Evenly?**
- Captures overview, middle discussion, conclusion
- Reduces redundancy
- Keeps total tokens under LLM context limit
- Takes ~30-50% of original document size

### 4.3 Text Input Path (Direct)

```
User Pastes Text
    ↓
store as content_to_analyze
    ↓
Pass directly to detect_research_gaps()
```

**No summarization needed:**
- Users typically paste abstracts (already condensed)
- Much shorter than full papers
- Direct analysis faster

---

## 5. Response Rendering & Interaction

### 5.1 Gap Card Component
```jsx
<div className="gap-card">
  <div className="flex items-start justify-between">
    <div>
      <h4 className="font-semibold">{gap.title}</h4>
      <p className="text-xs text-muted-foreground">{gap.severity}</p>
    </div>
    
    <div className={`severity-badge ${gap.severity}`}>
      {gap.severity === "high" && <AlertCircle className="w-4 h-4 text-red-500" />}
      {gap.severity === "medium" && <AlertCircle className="w-4 h-4 text-orange-500" />}
      {gap.severity === "low" && <CheckCircle className="w-4 h-4 text-green-500" />}
    </div>
  </div>
  
  <button className="mt-2 text-accent text-sm" onClick={toggleExpand}>
    {isExpanded ? "Hide details" : "Show details"}
  </button>
  
  {isExpanded && (
    <>
      <p className="mt-2 text-sm">{gap.explanation}</p>
      
      <div className="mt-3 p-3 rounded bg-secondary/30">
        <p className="text-xs uppercase text-muted-foreground mb-1">Research Direction</p>
        <p className="text-sm">{gap.suggestion}</p>
      </div>
    </>
  )}
</div>
```

### 5.2 Visual Hierarchy
- **Title:** Bold, immediately visible
- **Severity Badge:** Color-coded, icon-based
- **Expand Button:** Shows details only on click
- **Explanation:** Full context for gap
- **Suggestion:** Highlighted as actionable next steps

---

## 6. State Management (Frontend)

```javascript
const [inputMode, setInputMode] = useState("file");  // "file" | "text"
const [selectedFile, setSelectedFile] = useState(null);
const [textInput, setTextInput] = useState("");

const [analyzing, setAnalyzing] = useState(false);
const [gaps, setGaps] = useState([]);
const [displayed, setDisplayed] = useState(false);

const [expandedGapIndex, setExpandedGapIndex] = useState(null);  // Which gap expanded?
const [error, setError] = useState(null);
```

**UI Flow:**
1. User selects input mode (tab: File / Text)
2. User uploads file OR pastes text
3. Click "Detect Gaps" → `setAnalyzing(true)`
4. API call → `/api/detect-gaps`
5. Response received → `setGaps(data.gaps)`, `setDisplayed(true)`
6. User clicks gap → `setExpandedGapIndex(index)` for expand/collapse

---

## 7. Error Handling

| Scenario | Response | UX |
|----------|----------|-------|
| No file selected | 400 | "Please select a file" |
| Invalid file type | 400 | "Only PDF or DOCX allowed" |
| Corrupt PDF | 400 | "Could not extract text" |
| Empty text input | 400 | "Please enter text" |
| Parsing timeout | 504 | "Analysis took too long" |
| JSON parse error | 500 | "Gap detection failed" |
| Network error | N/A | "Network error, retry" |
| Auth required | 401 | Redirect to login |

---

## 8. Database Logging

```python
db_activity = Activity(
    user_id=user_id,
    action_type="detect_gaps",
    metadata_json={
        "method": "file" or "text",
        "gap_count": len(gaps),
        "severity_distribution": {
            "high": count,
            "medium": count,
            "low": count
        }
    }
)
db.add(db_activity)
db.commit()
```

**Analytics Enabled:**
- Gap detection popularity
- High vs. medium vs. low severity trends
- File vs. text input ratio
- Typical gap count per paper

---

## 9. Processing Performance

| Step | Time | Memory |
|------|------|--------|
| PDF Parse (10 pages) | 1-2s | 50MB |
| Chunking | 0.5s | 30MB |
| Summarization (3 chunks) | 2-3s | 80MB |
| Gap Detection LLM | 3-5s | 100MB |
| JSON Parse | <0.1s | 5MB |
| DB Write | <0.5s | 10MB |
| **Total** | **7-12s** | **275MB** |

**Optimization Opportunities:**
- Cache summaries for same file (SHA256 hash)
- Parallelize summarization of chunks
- Stream LLM response for perceived speed

---

## 10. Future Enhancements

1. **Gap Visualization:** Network graph showing how gaps relate to each other
2. **Literature Suggestions:** Link gaps to relevant papers from database
3. **Collaborative Gap Analysis:** Multiple reviewers rate/debate gaps
4. **Gap-to-Experiment Pipeline:** Convert gap suggestion into Experiment Plan
5. **Trend Analysis:** Track gaps across papers in a domain over time
6. **Automated Patch Suggestions:** For code-based papers, suggest fixes

---

## 11. Configuration

**Environment Variables:**

| Config | Default | Usage |
|--------|---------|-------|
| `MODEL_NAME` | "mixtral-8x7b-32768" | Groq LLM |
| `SUMMARIZATION_CHUNK_COUNT` | 3 | Chunks to sample for summary |
| `MIN_GAPS` | 4 | Minimum gaps per request |
| `MAX_GAPS` | 6 | Maximum gaps per request |
| `GAP_DETECTION_TIMEOUT` | 15 | Seconds before timeout |

---

## 12. Comparison: Gap Detection vs. Paper Analyzer

| Aspect | Paper Analyzer | Gap Detection |
|--------|---|---|
| **Input** | Full paper PDF/DOCX | Paper or abstract |
| **Output** | 6-section analysis | 4-6 gaps with severity |
| **Focus** | Summary/overview | Critical evaluation |
| **Use Case** | Understand paper | Identify future work |
| **Severity** | N/A | High/Med/Low |
| **Actionable** | Q&A Chat | Research direction |

---

## 13. Integration Workflow Example

```
User Journey:
1. Upload paper to Paper Analyzer
   → Get structured summary
2. Click "Analyze Gaps"
   → Sent to Gap Detection
   → Get 4-6 gaps identified
3. Click gap with "medium" severity
   → Read detailed explanation
   → Read suggestion for research
4. Click "Convert to Problem"
   → Open Problem Generator
   → Auto-fill domain/subdomain from gap
5. Generate ideas
   → Select one idea
   → Expand to Experiment Plan
   → Start research!
```

---

## 14. Summary

1. **User uploads paper or pastes text**
   → Frontend sends to `/api/detect-gaps`

2. **Backend extracts & condenses content**
   → For files: Parse → Chunk → Summarize
   → For text: Use as-is

3. **LLM analyzes for technical gaps**
   → Identifies 4-6 specific weaknesses
   → Assigns severity (high/med/low)
   → Suggests research directions

4. **JSON returned with structured gaps**
   → Each gap: title, explanation, severity, suggestion

5. **Frontend displays expandable gap cards**
   → Severity-coded badges
   → Expand for details
   → User can save/share findings

6. **Activity logged for analytics**
   → Tracks trend in research gaps

**Key Strengths:**
- Critical perspective (finds weaknesses)
- Severity-prioritized (focus on important gaps)
- Actionable suggestions (next research directions)
- Fast for abstracts (no summarization)
- Integrates with other tools

**Key Constraints:**
- LLM-generated (can miss real gaps or hallucinate)
- Severity is subjective (no ground truth)
- Limited to identified text (can't read figures/tables)
- Single pass analysis (no iterative refinement)
- Requires full paper for best results

---

## 15. Example: Full Gap Detection Output

```json
{
  "gaps": [
    {
      "title": "Limited Scalability to Longer Sequences",
      "explanation": "The proposed architecture has O(n²) attention complexity, limiting practical application to sequences under 2K tokens. Recent work (Performer, Linformer) achieves linear complexity, making this a significant limitation for long-document or video applications requiring 32K+ tokens.",
      "severity": "high",
      "suggestion": "Implement sparse attention patterns or propose a hierarchical approach. Benchmark against recent linear-attention methods on ArXiv document understanding and multi-modal tasks."
    },
    {
      "title": "Missing Baseline Comparisons with SOTA (2024)",
      "explanation": "Paper only compares against 2019-2021 baselines. Recent models (T5-v3, ELECTRA-v2) significantly outperform baselines chosen here, making relative performance claims questionable.",
      "severity": "high",
      "suggestion": "Re-benchmark against 2023-2024 SOTA models. Use established leaderboards (GLUE, SuperGLUE, MT-Bench) for transparent comparison."
    },
    {
      "title": "Insufficient Downstream Task Evaluation",
      "explanation": "Evaluation limited to 3 tasks (MNLI, QQP, MRPC). Real-world impact unknown on specialized domains (biomedical, legal, financial text).",
      "severity": "medium",
      "suggestion": "Extend evaluation to domain-specific benchmarks (PubMed, legal NER, financial sentiment). Report performance degradation curves."
    },
    {
      "title": "Lack of Interpretability Analysis",
      "explanation": "Paper doesn't explain what linguistic phenomena the model captures. No attention visualization or probing analysis provided.",
      "severity": "medium",
      "suggestion": "Conduct attention head visualization, probing tasks (POS tagging, dependency parsing), and create control experiments to understand what patterns are learned."
    }
  ]
}
```
