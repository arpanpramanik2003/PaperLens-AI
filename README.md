# PaperLens AI 🔬

**Transforming dense research papers into actionable insights using Hybrid RAG and Advanced LLMs.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/LLM-Groq-F55036?style=for-the-badge)](https://groq.com)

---

## 🌟 Overview

PaperLens AI is a premium research intelligence platform designed for academics, engineers, and life-long learners. It bridges the gap between complex technical documents and rapid understanding by leveraging a high-performance **Hybrid RAG** (Retrieval-Augmented Generation) pipeline.

Unlike basic document viewers, PaperLens AI analyzes, critiques, and assists in the creative research process—helping you spot gaps, plan experiments, and generate next-generation problem statements.

---

## 🚀 Key Modules

| Module | Description |
| :--- | :--- |
| **📄 Paper Analyzer** | Extract methodology, metrics, and core findings with 1-click structured deep-dives. |
| **🔍 Gap Detection** | Identify what a paper *didn't* solve and find competitive research opportunities. |
| **💡 Problem Generator** | Brainstorm high-impact research ideas based on established domains and sub-domains. |
| **🧪 Experiment Planner** | Transition from theory to practice with AI-generated datasets, models, and evaluation strategies. |
| **💬 Contextual Chat** | Interrogate your document with a chatbot that cites exact page numbers and paragraphs. |

---

## 🛠 Tech Stack

### Frontend (User Interface)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **Animations**: Framer Motion
- **State/Data**: React Query (TanStack)
- **Icons**: Lucide React

### Backend (Logic & AI)
- **Engine**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0
- **LLM**: Groq (Llama 3.1/3.3 models)
- **RAG Pipeline**: 
  - **Vector Store**: FAISS (for sub-second semantic search)
  - **Embeddings**: Sentence-Transformers (`all-MiniLM-L6-v2`)
  - **Retrieval**: Hybrid Search (FAISS + BM25) + Cross-Encoder Reranking
  - **Parsing**: `pdfplumber` & `python-docx`

### Infrastructure
- **Auth**: Clerk (Identity Management & MFA)
- **Database**: PostgreSQL (hosted on Supabase)
- **Hosting**: Render (Backend) & Vercel (Frontend)

---

## 🏗 System Architecture

```mermaid
graph TD
    User((User)) -->|Interact| Frontend[React 19 Frontend]
    Frontend -->|Authenticate| Clerk[Clerk Auth]
    Frontend -->|REST API| Backend[FastAPI Backend]
    
    subgraph "Backend Processing"
    Backend -->|Metadata| DB[(PostgreSQL / Supabase)]
    Backend -->|Text Extraction| Parser[pdfplumber / docx]
    Parser -->|Context| RAG[Hybrid RAG Engine]
    RAG -->|Vector Search| FAISS[FAISS Vector Store]
    RAG -->|Reranking| CrossEncoder[Scientific Reranker]
    RAG -->|Prompt| LLM[Groq Llama 3.1]
    end
    
    LLM -->|Streamed Response| Frontend
```

---

## 📥 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Accounts for: [Clerk](https://clerk.com), [Supabase](https://supabase.com), and [Groq](https://groq.com).

### 2. Environment Setup

**Backend (`/backend/.env`):**
```env
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
CLERK_SECRET_KEY=sk_test_...
GROQ_API_KEY=gsk_...
```

**Frontend (`/frontend/.env.local`):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

### 3. Installation

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment

For a detailed walkthrough, see [DEPLOYMENT_GUIDE.md](file:///C:/Users/Arpan%20Pramanik/.gemini/antigravity/brain/6beca744-e7ae-4bc2-97c0-6638e5dfd5cd/deployment_guide.md).

- **Backend**: Deployed to **Render** via `render.yaml`.
- **Frontend**: Deployed to **Vercel** with automatic SPA routing.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for the research community.
