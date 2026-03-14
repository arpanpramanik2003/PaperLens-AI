# Prototype Deployment Guide (Vercel + Render)

This guide is for deploying PaperLens AI as a lightweight prototype.

Recommended setup:

- Frontend: Vercel
- Backend: Render Web Service
- LLM provider: Groq API
- Vector store: current in-memory FAISS (for prototype)

## Is Deployment Possible?

Yes, this project is fully deployable with your current architecture.

For prototype usage with low traffic, Vercel + Render is a practical and cost-effective combination.

## Deployment Architecture

```text
User Browser
   |
   v
Vercel (React Frontend)
   |
   v
Render (FastAPI Backend)
   |
   +--> Groq API
   |
   +--> In-memory cache + FAISS index (per running instance)
```

## Before You Deploy

1. Confirm backend endpoints run locally from backend/app/main.py.
2. Confirm frontend uses VITE_API_URL.
3. Ensure your GROQ_API_KEY is valid.
4. Push latest code to GitHub.

## Deploy Backend on Render

Create a new Web Service on Render connected to your GitHub repository.

### Render service settings

- Runtime: Python
- Root directory: project root (do not change unless needed)
- Build command:

```bash
pip install -r backend/requirements.txt
```

Note:

- backend/requirements.txt is configured for CPU-only PyTorch using the PyTorch CPU wheel index.
- This avoids large NVIDIA CUDA package installs on Render.

- Start command:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Environment variables on Render

Set these in Render Dashboard:

- PYTHON_VERSION=3.10.14
- GROQ_API_KEY=your_key
- GROQ_MODEL=llama-3.1-8b-instant
- EMBEDDING_MODEL=all-MiniLM-L6-v2
- RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
- UPLOAD_FOLDER=uploads
- CHUNK_SIZE=1200
- CHUNK_OVERLAP=220
- TOP_K=5

Python version notes:

- This repo includes both .python-version and runtime.txt pinned to Python 3.10.14.
- Keeping PYTHON_VERSION on Render ensures the service does not silently move to Python 3.14.

### Verify backend

After deployment, check:

- GET /health returns status ok

Example:

```text
https://your-render-service.onrender.com/health
```

## Deploy Frontend on Vercel

Create a new Vercel project connected to the same GitHub repository.

### Vercel build settings

- Framework preset: Vite
- Root directory: frontend
- Build command: npm run build
- Output directory: dist

### Environment variable on Vercel

Set:

- VITE_API_URL=https://your-render-service.onrender.com

Redeploy after adding this variable.

## CORS for Production

Current backend CORS is permissive for local development.

For deployment, restrict allowed origins to your Vercel domain in backend/app/main.py.

Recommended production pattern:

- allow_origins: your exact Vercel URL(s)
- allow_methods: GET, POST
- allow_headers: required headers only

If you keep wildcard origins during prototype phase, it will still work, but it is less secure.

## Vector DB: Do You Need One for Prototype?

For your prototype, external vector DB is optional.

Current implementation already uses:

- FAISS index in memory
- in-memory document cache

This is okay for low usage demos, but note the trade-offs:

- data resets on backend restart/redeploy
- no shared state across multiple backend instances
- not ideal for long-term persistent documents

## Recommended Prototype Plan

Use this now:

- Vercel frontend
- Render backend
- current FAISS + in-memory cache

Move later (only if needed):

- Add persistent storage for uploaded files
- Add persistent vector store (Qdrant, pgvector, Pinecone, Weaviate)
- Add metadata database for document ownership and sessions

## Troubleshooting

### Frontend loads but API calls fail

- Check VITE_API_URL in Vercel
- Check Render backend URL is correct
- Check backend CORS policy

### 500 errors from backend

- Confirm GROQ_API_KEY is set on Render
- Inspect Render logs for model loading or dependency errors

### Slow first request

- sentence-transformers and reranker may require model load time
- Render free tier cold starts can add delay

### Uploaded paper not found later

- expected with current in-memory cache after restart

## Deployment Checklist

- Backend deploys on Render with health endpoint working
- Frontend deploys on Vercel and points to Render API
- Environment variables set correctly in both services
- File upload and stream analysis work in production
- Q and A works with document ID flow

## Optional Next Step

When you are ready, add a persistent vector and metadata layer for stability beyond prototype use.