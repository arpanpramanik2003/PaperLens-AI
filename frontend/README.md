# Frontend Guide

This is the React and Vite frontend for PaperLens AI. It handles file upload, streamed analysis rendering, and follow-up chat interactions against the backend API.

## Stack

- React 19
- Vite 8
- Tailwind CSS
- react-markdown
- remark-gfm

## Responsibilities

- render the PaperLens AI landing and interaction UI
- upload PDF and DOCX files to the backend
- stream analysis output into the page as it arrives
- send user questions tied to the active document ID
- render markdown analysis and chat responses

## Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

## Environment Variables

Create frontend/.env and set:

```env
VITE_API_URL=http://localhost:8000
```

If omitted, the app defaults to http://localhost:8000.

## Run

```powershell
cd frontend
npm run dev
```

Common scripts:

- npm run dev
- npm run build
- npm run preview
- npm run lint

## User Flow

1. The user uploads a PDF or DOCX document.
2. The frontend posts the file to /api/analyze_stream.
3. The backend streams a document ID header and markdown analysis text.
4. The frontend stores the document ID in state.
5. The user asks follow-up questions.
6. The frontend posts the question and document ID to /api/ask_stream.
7. The streamed answer is appended to the conversation UI.

## Notes

- The question input is disabled only by request state, so the backend must still validate document availability.
- The analysis and Q and A panels are rendered from client state without persistence.
- The UI expects plain text streaming responses rather than server-sent events.
