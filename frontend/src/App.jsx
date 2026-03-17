import { useEffect, useMemo, useState } from "react";
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
  const [activeAnalyzeStep, setActiveAnalyzeStep] = useState(0);

  const lengthyPaperMessage = "Paper is too lengthy for this deployment. Please upload a shorter paper (around 10-11 pages).";

  const analyzeSteps = useMemo(
    () => [
      "Uploading file",
      "Extracting text",
      "Building chunks",
      "Generating AI analysis"
    ],
    []
  );

  const hasAnalysis = analysisText.trim().length > 0;

  const stats = useMemo(
    () => [
      { label: "Summaries", value: "Structured" },
      { label: "Answers", value: "Grounded" },
      { label: "Evidence", value: "Cited" }
    ],
    []
  );

  useEffect(() => {
    if (!isAnalyzing) {
      setActiveAnalyzeStep(0);
      return;
    }

    setActiveAnalyzeStep(0);

    const interval = setInterval(() => {
      setActiveAnalyzeStep((prev) => {
        if (prev >= analyzeSteps.length - 1) {
          return prev;
        }

        return prev + 1;
      });
    }, 1700);

    return () => clearInterval(interval);
  }, [isAnalyzing, analyzeSteps.length]);

  const parseApiError = (rawText) => {
    if (!rawText) {
      return { message: "Server error", code: "" };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        message: parsed.error || parsed.message || "Server error",
        code: parsed.code || ""
      };
    } catch {
      return { message: rawText, code: "" };
    }
  };

  const toUserFriendlyAnalyzeError = (err) => {
    if (!err) {
      return "Failed to analyze document.";
    }

    const message = String(err.message || "");

    if (err.code === "PAPER_TOO_LENGTHY") {
      return message || lengthyPaperMessage;
    }

    const normalized = message.toLowerCase();

    if (normalized.includes("failed to fetch")) {
      return lengthyPaperMessage;
    }

    if (normalized.includes("too lengthy") || normalized.includes("too large") || normalized.includes("413")) {
      return message;
    }

    return message || "Failed to analyze document.";
  };

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
        const parsedError = parseApiError(errorText);
        const apiError = new Error(parsedError.message || "Server error");
        apiError.code = parsedError.code;
        throw apiError;
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
      setError(toUserFriendlyAnalyzeError(err));
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
        <div className="flex items-center gap-3">
            <div className="logo-badge" aria-hidden="true">
              <img src="/favicon.svg" alt="" className="logo-mark" />
            </div>
            <div>
              <span className="chip">PaperLens AI</span>
              <p className="mt-2 text-sm text-[var(--muted)]">Research paper analysis and grounded Q&amp;A</p>
            </div>
        </div>
        <h1 className="headline mt-4 text-3xl font-semibold text-[var(--accent-3)] sm:text-5xl">
          Research paper intelligence, in minutes.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--ink-soft)] sm:text-lg">
          Upload a PDF or DOCX to get a structured summary and ask evidence-grounded questions from your document.
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
          {fileMeta && (
            <div className="rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--ink-soft)]">
              <div className="font-semibold break-words leading-5">{formatFileName(fileMeta.name)}</div>
              <div>{(fileMeta.size / 1024).toFixed(2)} KB</div>
            </div>
          )}
        </div>
      </section>

      {isAnalyzing && (
        <div className="glass-panel fade-in rounded-2xl px-4 py-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--accent-3)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-3)] border-t-transparent" />
            Processing your paper...
          </div>
          <div className="mt-3 space-y-2">
            {analyzeSteps.map((step, index) => {
              const isDone = index < activeAnalyzeStep;
              const isActive = index === activeAnalyzeStep;

              return (
                <div
                  key={step}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all ${
                    isDone
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : isActive
                        ? "border-[var(--accent-2)] bg-white text-[var(--accent-3)]"
                        : "border-[var(--panel-border)] bg-white/70 text-[var(--muted)]"
                  }`}
                >
                  <span>{step}</span>
                  {isDone ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Done</span>
                  ) : isActive ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-2)]" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[var(--panel-border)]" />
                  )}
                </div>
              );
            })}
          </div>
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
          <div>
            <h2 className="headline text-2xl font-semibold text-[var(--accent-3)]">Ask Questions</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">Answers are strictly grounded in your uploaded paper</p>
          </div>
          {docId && (
            <span className="chip">Paper loaded</span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 min-h-[120px] max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-white/60 p-4 backdrop-blur-sm">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="text-2xl" aria-hidden="true">💬</span>
              <p className="text-sm font-semibold text-[var(--accent-3)]">No questions yet</p>
              <p className="text-xs text-[var(--muted)]">Try asking about methodology, results, limitations, or key findings.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    message.role === "user"
                      ? "bg-[var(--accent-3)] text-white"
                      : "bg-[var(--accent-2)] text-white"
                  }`}
                >
                  {message.role === "user" ? "U" : "AI"}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-[var(--accent-3)] text-white"
                      : "rounded-tl-sm bg-white text-[var(--ink-soft)] border border-[var(--panel-border)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex flex-row gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-2)] text-xs font-bold text-white">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-[var(--panel-border)] bg-white px-4 py-3 shadow-sm">
                <span className="typing-dots" aria-label="AI is typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--panel-border)] bg-white/80 px-3 py-2 shadow-sm focus-within:border-[var(--accent-2)] focus-within:ring-2 focus-within:ring-[var(--accent-2)]/20 transition-all">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !isAsking) {
                event.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask about methodology, results, limitations… (Enter to send)"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-[var(--muted)]"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={isAsking || !question.trim()}
            className="btn-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send question"
          >
            {isAsking ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.116A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-right text-xs text-[var(--muted)]">Press Enter to send</p>
      </section>
    </div>
  );
}

export default App;
