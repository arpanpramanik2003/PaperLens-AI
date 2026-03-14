import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [docId, setDocId] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const hasAnalysis = analysisText.trim().length > 0;

  const stats = useMemo(
    () => [
      { label: "Summary", value: "PDF →" },
      { label: "Q&A", value: "Grounded" },
      { label: "Citations", value: "Chunks" }
    ],
    []
  );

  const formatFileName = (name) => {
    if (!name) return "";
    return name.length > 48 ? `${name.slice(0, 22)}…${name.slice(-20)}` : name;
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isAllowed = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx");

    if (!isAllowed) {
      setError("Only PDF or DOCX files are allowed.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setAnalysisText("");
    setMessages([]);
    setDocId(null);
    setFileMeta({ name: file.name, size: file.size });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBase}/api/analyze_stream`, {
        method: "POST",
        body: formData
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let headerProcessed = false;
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (!headerProcessed) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex !== -1) {
            const header = buffer.slice(0, newlineIndex);
            if (header.startsWith("__DOC_ID__:")) {
              setDocId(header.replace("__DOC_ID__:", "").trim());
            }
            buffer = buffer.slice(newlineIndex + 1);
            headerProcessed = true;
          } else {
            continue;
          }
        }

        if (buffer) {
          fullText += buffer;
          setAnalysisText(fullText);
          buffer = "";
        }
      }
    } catch (err) {
      setError(err.message || "Failed to analyze document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAsk = async () => {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    if (!docId) {
      setError("Please analyze a document first.");
      return;
    }

    setError("");
    setIsAsking(true);
    setIsTyping(true);
    setQuestion("");

    const newMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(newMessages);

    try {
      const response = await fetch(`${apiBase}/api/ask_stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: trimmed, doc_id: docId })
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answerText = "";

      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        answerText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { role: "assistant", text: answerText };
          return updated;
        });
      }
    } catch (err) {
      setError(err.message || "Failed to answer question.");
    } finally {
      setIsAsking(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 overflow-hidden px-4 py-10 sm:px-6">
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <div className="orb orb-three" aria-hidden="true" />

      <header className="glass-panel panel-lift fade-in rounded-3xl px-6 py-8 sm:px-10">
        <span className="chip">PaperLens AI</span>
        <h1 className="headline mt-4 text-3xl font-semibold text-[var(--accent-3)] sm:text-5xl">
          Decode research papers in minutes.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--ink-soft)] sm:text-lg">
          Upload a PDF or DOCX to get a structured summary, then ask questions grounded only in the paper.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="panel-lift rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3"
            >
              <div className="headline text-lg font-semibold text-[var(--accent-3)]">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--muted)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="glass-panel panel-lift fade-in grid gap-6 rounded-3xl p-6 lg:grid-cols-[1.1fr_0.9fr] sm:p-8">
        <div>
          <h2 className="headline text-2xl font-semibold text-[var(--accent-3)]">
            Drop your paper here
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            We generate a summary, highlight methods and results, and keep answers strictly grounded in your document.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-dashed border-[var(--panel-border)] bg-white/70 px-4 py-4">
            <input
              id="paperUpload"
              type="file"
              accept="application/pdf,.docx"
              onChange={handleUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Upload paper"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="paperUpload"
                className="btn-secondary inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--accent-3)]"
              >
                Choose file
              </label>
              <span className="text-sm text-[var(--muted)] break-words leading-5">
                {fileMeta ? formatFileName(fileMeta.name) : "No file chosen"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">PDF or DOCX recommended. Scanned PDFs may be blank.</p>
          </div>
          <p className="text-xs text-[var(--muted)]">Best with text-based PDFs. Scanned PDFs may be blank.</p>
          {fileMeta && (
            <div className="rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--ink-soft)]">
              <div className="font-semibold break-words leading-5">{formatFileName(fileMeta.name)}</div>
              <div>{(fileMeta.size / 1024).toFixed(2)} KB</div>
            </div>
          )}
        </div>
      </section>

      {isAnalyzing && (
        <div className="glass-panel fade-in flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--accent-3)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-3)] border-t-transparent" />
          Analyzing paper using AI...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {hasAnalysis && (
        <section className="glass-panel panel-lift fade-in rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="headline text-2xl font-semibold text-[var(--accent-3)]">AI Analysis</h2>
            <span className="text-xs text-[var(--muted)]">Document ID: {docId || "-"}</span>
          </div>
          <div className="markdown mt-4 text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisText}</ReactMarkdown>
          </div>
        </section>
      )}

      <section className="glass-panel panel-lift fade-in rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline text-2xl font-semibold text-[var(--accent-3)]">Ask Questions</h2>
          <span className="text-xs text-[var(--muted)]">Answers stay within the paper</span>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No questions yet. Ask about methodology, results, or limitations.</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-emerald-100/60 text-emerald-950"
                    : "bg-amber-100/60 text-[var(--ink-soft)]"
                }`}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.18em]">
                  {message.role === "user" ? "You" : "AI"}
                </span>
                <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-3)]">
              AI
              <span className="typing-dots" aria-label="AI is typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask PaperLens about the methodology, results, or limitations..."
            className="flex-1 rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={isAsking}
            className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white"
          >
            {isAsking ? "Answering..." : "Ask"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
