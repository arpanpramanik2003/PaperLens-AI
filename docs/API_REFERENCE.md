# PaperLens AI API Reference

Base URL (local): `http://localhost:8000`

Most `/api/*` endpoints require:

`Authorization: Bearer <Clerk JWT>`

## Health

### `GET /health`
- Auth: No
- Response:
```json
{ "status": "ok" }
```

## Auth Check

### `GET /api/test-auth`
- Auth: Yes
- Response:
```json
{ "message": "You are fully authenticated!", "user_id": "..." }
```

## Dashboard

### `GET /api/dashboard`
- Auth: Yes
- Response:
```json
{
  "stats": [
    { "label": "Papers Analyzed", "value": "2", "icon": "FileText", "change": "" }
  ],
  "recentPapers": [
    { "title": "paper.pdf", "date": "2 hours ago", "status": "Analyzed" }
  ]
}
```

## Analyze Document (non-stream)

### `POST /api/analyze`
- Auth: Yes
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: PDF or DOCX
- Success response:
```json
{
  "result": "# Markdown analysis...",
  "doc_id": "12charhash"
}
```
- Error examples:
  - `400` invalid file type / extraction failure
  - `413` over size/page/char limits (`code: PAPER_TOO_LENGTHY`)

## Analyze Document (stream)

### `POST /api/analyze_stream`
- Auth: Yes
- Content-Type: `multipart/form-data`
- Stream (`text/plain`):
  - First emitted line: `__DOC_ID__:<doc_id>`
  - Remaining stream: incremental analysis text

## Ask Question (non-stream)

### `POST /api/ask`
- Auth: Yes
- JSON body:
```json
{ "question": "What metrics are reported?", "doc_id": "12charhash" }
```
- Response:
```json
{ "answer": "..." }
```

## Ask Question (stream)

### `POST /api/ask_stream`
- Auth: Yes
- JSON body same as `/api/ask`
- Stream response: incremental text tokens

## Experiment Planner

### `POST /api/plan-experiment`
- Auth: Yes
- JSON body:
```json
{ "topic": "Fine-tuning BERT", "difficulty": "advanced" }
```
- Response shape:
```json
{
  "steps": [
    {
      "num": 1,
      "title": "Dataset Selection",
      "iconName": "Database",
      "details": "...",
      "params": "...",
      "risks": "..."
    }
  ]
}
```

## Problem Generator

### `POST /api/generate-problems`
- Auth: Yes
- JSON body:
```json
{ "domain": "NLP", "subdomain": "Sentiment", "complexity": "high" }
```
- Response shape:
```json
{
  "ideas": [
    {
      "title": "...",
      "desc": "...",
      "tags": ["NLP", "LLM"],
      "rating": 4
    }
  ]
}
```

## Gap Detection

### `POST /api/detect-gaps`
- Auth: Yes
- Content-Type: `multipart/form-data`
- Supported input modes:
  - `file` (PDF/DOCX)
  - `text` (plain text input)
- Response shape:
```json
{
  "gaps": [
    {
      "title": "...",
      "explanation": "...",
      "severity": "low|medium|high",
      "suggestion": "..."
    }
  ]
}
```

## Documents

### `GET /api/documents`
- Auth: Yes
- Response:
```json
[
  { "id": "12charhash", "filename": "paper.pdf" }
]
```

## Limits and Controls

Config-driven backend controls:

- Upload size: `MAX_UPLOAD_MB`
- Page limit: `MAX_PAGES`
- Character limit: `MAX_TOTAL_CHARS`
- Chunk cap: `MAX_CHUNKS`
- Retrieval depth: `TOP_K`

If limit errors occur, API typically returns `413` with an explanatory `error` message.
