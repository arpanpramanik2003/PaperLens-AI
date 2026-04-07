import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, BarChart3, ExternalLink, SearchX, Sparkles, FileText, Loader2, CheckCircle2, BookOpen, Clock3, XCircle, BookmarkPlus } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { showSaveErrorToast, showSaveSignInToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

type CitationEntry = {
  reference_index: number;
  reference_text: string;
  matched: boolean;
  paper_id: string | null;
  title: string | null;
  year: number | null;
  citation_count: number;
  url: string | null;
  venue: string | null;
  authors: string[];
};

type CitationReport = {
  total_references_extracted: number;
  references_processed: number;
  matched_count: number;
  missing_count: number;
  references: CitationEntry[];
  top_cited: CitationEntry[];
  project_title?: string;
  basic_details?: string;
  discovery_profile?: {
    intent_summary?: string;
    core_terms?: string[];
    method_terms?: string[];
    domain_terms?: string[];
    task_terms?: string[];
    must_include_terms?: string[];
    search_queries?: string[];
    llm_used?: boolean;
    topic_preset?: string;
  };
  search_queries_used?: string[];
};

type TopicPreset =
  | "auto"
  | "plant_pathology"
  | "agricultural_disease"
  | "medical_imaging"
  | "medical_diagnosis"
  | "remote_sensing"
  | "climate_earth_observation";

const topicPresetOptions: Array<{ value: TopicPreset; label: string; description: string }> = [
  { value: "auto", label: "Auto detect", description: "Let the planner infer the best domain preset" },
  { value: "plant_pathology", label: "Plant pathology", description: "Crop disease, leaf blight, and agricultural vision" },
  { value: "agricultural_disease", label: "Agricultural disease", description: "Crop health, field diagnosis, and disease monitoring" },
  { value: "medical_imaging", label: "Medical imaging", description: "Radiology, MRI, CT, ultrasound, and biomedical imaging" },
  { value: "medical_diagnosis", label: "Medical diagnosis", description: "Clinical diagnosis support and decision systems" },
  { value: "remote_sensing", label: "Remote sensing", description: "Satellite imagery, earth observation, and aerial analysis" },
  { value: "climate_earth_observation", label: "Climate / Earth observation", description: "Weather, climate analysis, and environmental monitoring" },
];

const topicPresetInferenceRules: Array<{ value: Exclude<TopicPreset, "auto">; terms: string[] }> = [
  {
    value: "plant_pathology",
    terms: ["plant pathology", "plant disease", "crop disease", "leaf blight", "leaf disease"],
  },
  {
    value: "agricultural_disease",
    terms: ["agricultural disease", "crop health", "disease monitoring", "field diagnosis"],
  },
  {
    value: "medical_imaging",
    terms: ["medical imaging", "biomedical imaging", "radiology", "mri", "ct scan", "ultrasound"],
  },
  {
    value: "medical_diagnosis",
    terms: ["medical diagnosis", "clinical diagnosis", "diagnostic support", "disease diagnosis"],
  },
  {
    value: "remote_sensing",
    terms: ["remote sensing", "satellite imagery", "earth observation", "aerial imagery"],
  },
  {
    value: "climate_earth_observation",
    terms: ["climate", "earth observation", "environmental monitoring", "weather"],
  },
];

type CitationRecommendations = {
  paper_focus?: string;
  must_read?: Array<{
    title?: string;
    why_read?: string;
    priority?: "high" | "medium" | string;
  }>;
  reading_path?: string[];
  coverage_gaps?: string[];
  next_search_queries?: string[];
};

type ProgressState = {
  current: number;
  total: number;
  extracted: number;
  matchedCount: number;
  latestTitle: string | null;
  latestRef: string;
  lastResult: "matched" | "miss" | null;
};

export default function CitationIntelligence() {
  const { getToken, userId } = useAuth();

  const [mode, setMode] = useState<"upload" | "discover">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [basicDetails, setBasicDetails] = useState("");
  const [topicPreset, setTopicPreset] = useState<TopicPreset>("auto");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<CitationReport | null>(null);
  const [resultMode, setResultMode] = useState<"upload" | "discover" | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [recommendations, setRecommendations] = useState<CitationRecommendations | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // SSE real-time progress
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processStepsByMode = {
    upload: [
      "Uploading file",
      "Extracting references section",
      "Parsing bibliography entries",
      "Matching with Semantic Scholar",
      "Ranking by citation count",
    ],
    discover: [
      "Understanding project context",
      "Searching Semantic Scholar",
      "Collecting 30+ related papers",
      "Ranking by citation and year",
      "Generating AI reading recommendations",
    ],
  } as const;

  const processSteps = processStepsByMode[mode];

  const inferredTopicPreset = useMemo<TopicPreset | null>(() => {
    if (mode !== "discover") return null;

    const normalizedText = `${projectTitle} ${basicDetails}`.toLowerCase();
    for (const preset of topicPresetInferenceRules) {
      if (preset.terms.some((term) => normalizedText.includes(term))) {
        return preset.value;
      }
    }

    return null;
  }, [basicDetails, mode, projectTitle]);

  const effectiveTopicPreset = topicPreset === "auto" ? inferredTopicPreset : topicPreset;

  const modeIntro = {
    upload: {
      title: "Paper-based citation analysis",
      description: "Upload a research paper to extract its references, match them with Semantic Scholar, and rank citations for faster literature review.",
      points: [
        "Extract references directly from uploaded PDF/DOCX",
        "Match references with Semantic Scholar metadata",
        "Filter by newest, oldest, and citation impact",
      ],
    },
    discover: {
      title: "Project-domain paper discovery",
      description: "Share a project title with optional context to discover 30+ relevant papers, then prioritize what to read using citation-based ranking and AI guidance.",
      points: [
        "Searches related papers for your project domain",
        "Returns structured references with citation counts",
        "Generates AI recommendations on what to read first",
      ],
    },
  } as const;

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStep((prev) => (prev < processSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => window.clearInterval(timer);
  }, [loading, processSteps.length]);

  const getYear = (value: number | null) => (typeof value === "number" ? value : null);

  const sortedTopCited = useMemo(() => {
    if (!report) return [];

    const items = [...report.top_cited];

    if (sortOrder === "highest") {
      items.sort((a, b) => b.citation_count - a.citation_count);
      return items;
    }

    if (sortOrder === "lowest") {
      items.sort((a, b) => a.citation_count - b.citation_count);
      return items;
    }

    items.sort((a, b) => {
      const yearA = getYear(a.year);
      const yearB = getYear(b.year);

      if (yearA === null && yearB === null) {
        return b.citation_count - a.citation_count;
      }

      if (yearA === null) return 1;
      if (yearB === null) return -1;

      if (yearA !== yearB) {
        return sortOrder === "newest" ? yearB - yearA : yearA - yearB;
      }

      return b.citation_count - a.citation_count;
    });

    return items;
  }, [report, sortOrder]);

  const yearwiseCounts = useMemo(() => {
    if (!report) return [] as Array<{ year: number; count: number }>;

    const counts = new Map<number, number>();
    for (const entry of report.references || []) {
      if (typeof entry.year === "number") {
        counts.set(entry.year, (counts.get(entry.year) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, count]) => ({ year, count }));
  }, [report]);

  const buildPaperContext = (currentReport: CitationReport) => {
    const matchedTitles = currentReport.top_cited
      .slice(0, 12)
      .map((entry) => entry.title)
      .filter(Boolean)
      .join("; ");

    const referenceSample = currentReport.references
      .slice(0, 12)
      .map((entry) => entry.reference_text)
      .join("\n");

    const discoveryProfile = currentReport.discovery_profile
      ? `\n\nDiscovery profile:\n${currentReport.discovery_profile.intent_summary || ""}\n${(currentReport.discovery_profile.search_queries || []).join("; ")}`
      : "";

    return `Matched reference titles: ${matchedTitles}\n\nReference sample:\n${referenceSample}${discoveryProfile}`;
  };

  const fetchRecommendations = async (currentReport: CitationReport, recommendationMode: "upload" | "discover") => {
    setRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendations(null);

    try {
      const missingReferences = (currentReport.references || [])
        .filter((entry) => !entry.matched)
        .map((entry) => entry.reference_text)
        .slice(0, 25);

      const res = await apiClient.fetch(
        "/api/citation-intelligence/recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paper_context: buildPaperContext(currentReport),
            top_cited: currentReport.top_cited || [],
            missing_references: missingReferences,
            recommendation_mode: recommendationMode,
            project_title: recommendationMode === "discover" ? projectTitle : undefined,
            basic_details: recommendationMode === "discover" ? basicDetails : undefined,
          }),
        },
        getToken
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate AI recommendations.");
      }

      setRecommendations(data as CitationRecommendations);
    } catch (err: any) {
      setRecommendationError(err?.message || "Failed to generate AI recommendations.");
    } finally {
      setRecommendationLoading(false);
    }
  };

  const handleUploadRun = async () => {
    if (!file) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      setReport(null);
      setProgress(null);
      setRecommendations(null);
      setRecommendationError(null);

      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/citation-intelligence/stream`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          signal: controller.signal,
        }
      );

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as any)?.error || "Failed to run citation intelligence.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw) continue;

          let evt: any;
          try { evt = JSON.parse(raw); } catch { continue; }

          if (evt.type === "start") {
            setProgress({ current: 0, total: evt.total, extracted: evt.extracted, matchedCount: 0, latestTitle: null, latestRef: "", lastResult: null });
          } else if (evt.type === "progress") {
            setProgress((prev) => ({
              current: evt.current,
              total: evt.total,
              extracted: prev?.extracted ?? evt.total,
              matchedCount: (prev?.matchedCount ?? 0) + (evt.matched ? 1 : 0),
              latestTitle: evt.matched ? (evt.title ?? null) : null,
              latestRef: evt.reference_text ?? "",
              lastResult: evt.matched ? "matched" : "miss",
            }));
          } else if (evt.type === "done") {
            const parsedReport: CitationReport = evt as CitationReport;
            setReport(parsedReport);
            setResultMode("upload");
            setProgress(null);
            setLoading(false);
            await fetchRecommendations(parsedReport, "upload");
          } else if (evt.type === "error") {
            throw new Error(evt.message || "Server error during citation analysis.");
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Failed to run citation intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverRun = async () => {
    if (!projectTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setReport(null);
      setRecommendations(null);
      setRecommendationError(null);

      const res = await apiClient.fetch(
        "/api/citation-intelligence/discover",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_title: projectTitle,
            basic_details: basicDetails,
            limit: 35,
            topic_preset: effectiveTopicPreset === "auto" ? undefined : effectiveTopicPreset,
          }),
        },
        getToken
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to discover citations for this project.");
      }

      const parsedReport = data as CitationReport;
      setReport(parsedReport);
      setResultMode("discover");
      await fetchRecommendations(parsedReport, "discover");
    } catch (err: any) {
      setError(err?.message || "Failed to discover citations for this project.");
    } finally {
      setLoading(false);
    }
  };

  const missingReferences = report?.references.filter((entry) => !entry.matched) || [];

  const handleSaveCitationResult = async () => {
    if (!report) return;
    if (!userId) {
      showSaveSignInToast("Citation results");
      return;
    }

    try {
      setSaving(true);
      const sectionTitle = resultMode === "discover"
        ? (projectTitle.trim() || report.project_title || "Project Discovery Citations")
        : (file?.name || "Uploaded Paper Citations");
      const summary = `${report.references_processed} processed • ${report.matched_count} matched • ${report.top_cited.length} top cited`;

      const res = await apiClient.fetch(
        "/api/saved-items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "citation_intelligence",
            title: sectionTitle,
            summary,
            payload: {
              mode: resultMode,
              projectTitle,
              basicDetails,
              topicPreset,
              inferredTopicPreset,
              report,
              recommendations,
            },
          }),
        },
        getToken
      );

      if (!res.ok) throw new Error("Failed to save citation results.");
      showSaveSuccessToast("Citation results");
    } catch (err) {
      console.error(err);
      showSaveErrorToast("Citation results");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Citation Intelligence</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {modeIntro[mode].description}
        </p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-4 mb-6 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="flex w-full flex-wrap items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50 mb-3 sm:w-fit">
          <button
            onClick={() => setMode("upload")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload Paper
          </button>
          <button
            onClick={() => setMode("discover")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === "discover" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Project Discovery
          </button>
        </div>

        {mode === "upload" ? (
          <>
            <input
              type="file"
              id="citation-file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.docx"
            />
            {/* Row 1: Choose File button */}
            <label
              htmlFor="citation-file"
              className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-md border border-border/60 bg-secondary/40 text-sm cursor-pointer hover:bg-secondary/60 transition-colors whitespace-nowrap mb-2"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </label>
            {/* Row 2: File name (always on its own line) */}
            {file && (
              <div className="w-full h-10 rounded-md border border-border/60 bg-background/50 px-3 flex items-center mb-2 overflow-hidden">
                <span className="text-sm text-foreground whitespace-nowrap">
                  {file.name.length > 38 ? file.name.slice(0, 24) + "..." + file.name.slice(-10) : file.name}
                </span>
              </div>
            )}
            {!file && (
              <p className="text-xs text-muted-foreground mb-2">No file selected</p>
            )}
            {/* Row 3: Analyze button — full width */}
            <Button onClick={handleUploadRun} disabled={!file || loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8 w-full">
              <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Analyzing citations..." : "Run Citation Intelligence"}
            </Button>

            <p className="text-xs text-muted-foreground mt-2">PDF/DOCX • Max 12MB</p>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Topic preset</label>
                <select
                  value={topicPreset}
                  onChange={(e) => setTopicPreset(e.target.value as TopicPreset)}
                  className="h-11 w-full rounded-md border border-border/60 bg-background/50 px-3 text-sm text-foreground focus:outline-none"
                >
                  {topicPresetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {topicPreset === "auto" && inferredTopicPreset && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Suggested preset: <span className="text-foreground font-medium">{topicPresetOptions.find((option) => option.value === inferredTopicPreset)?.label}</span>
                    . You can keep auto-detect or override it manually.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title (required)"
                className="h-11 w-full rounded-md border border-border/60 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <input
                type="text"
                value={basicDetails}
                onChange={(e) => setBasicDetails(e.target.value)}
                placeholder="Basic details (optional): domain, method, dataset"
                className="h-11 w-full rounded-md border border-border/60 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button onClick={handleDiscoverRun} disabled={!projectTitle.trim() || loading} className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8 shrink-0 whitespace-nowrap lg:w-auto">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Discovering papers..." : "Discover 30+ Papers"}
              </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">Finds up to 35 related papers from Semantic Scholar for your topic</p>
          </>
        )}

        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </motion.div>

      {!report && !loading && (
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-4 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm font-semibold text-foreground mb-1">{modeIntro[mode].title}</p>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{modeIntro[mode].description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {modeIntro[mode].points.map((point) => (
              <div key={point} className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
                <p className="text-xs text-foreground/90 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {loading && mode === "upload" && progress && (
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-4 mb-8 overflow-hidden w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
              <p className="text-sm font-semibold text-foreground">Matching with Semantic Scholar</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {progress.matchedCount} matched
            </span>
          </div>

          {/* Counter */}
          <div className="flex items-end gap-1.5 mb-3">
            <motion.span
              key={progress.current}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-bold tabular-nums text-foreground leading-none"
            >
              {progress.current}
            </motion.span>
            <span className="text-xl text-muted-foreground font-medium mb-0.5">/ {progress.total}</span>
            <span className="ml-auto text-xs text-muted-foreground mb-1">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>

          {/* Animated progress bar */}
          <div className="relative h-2.5 rounded-full bg-secondary/50 overflow-hidden mb-4">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(217 91% 55%), hsl(200 90% 60%), hsl(260 80% 65%))",
                backgroundSize: "200% 100%",
              }}
              animate={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                width: { duration: 0.4, ease: "easeOut" },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
              }}
            />
            {/* Glow pulse at leading edge */}
            <motion.div
              className="absolute top-0 bottom-0 w-8 blur-sm rounded-full"
              style={{ background: "hsl(217 91% 70% / 0.7)" }}
              animate={{
                left: `calc(${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}% - 1.5rem)`,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Latest reference */}
          <AnimatePresence mode="wait">
            {progress.current > 0 && (
              <motion.div
                key={progress.current}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5 overflow-hidden"
              >
                <div className="flex items-start gap-2 mb-1">
                  {progress.lastResult === "matched" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    {progress.lastResult === "matched" && progress.latestTitle ? (
                      <p className="text-xs font-medium text-foreground break-words">{progress.latestTitle}</p>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground break-words mt-0.5 leading-relaxed">{progress.latestRef}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  progress.lastResult === "matched"
                    ? "bg-accent/10 text-accent"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {progress.lastResult === "matched" ? "matched" : "no match"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Extracted</p>
              <p className="text-sm font-semibold">{progress.extracted}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processed</p>
              <p className="text-sm font-semibold">{progress.current}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Matched</p>
              <p className="text-sm font-semibold text-accent">{progress.matchedCount}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Miss</p>
              <p className="text-sm font-semibold">{progress.current - progress.matchedCount}</p>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (mode === "discover" || !progress) && (
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-5 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
            <p className="text-sm font-medium text-foreground">Citation Intelligence in progress</p>
          </div>
          <div className="space-y-2">
            {processSteps.map((step, index) => {
              const isDone = index < loadingStep;
              const isActive = index === loadingStep;
              return (
                <div key={step} className="flex items-center gap-2.5">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-accent animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border/70" />
                  )}
                  <span className={`text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {report && (
        <div className="space-y-8 overflow-hidden">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="gap-2" onClick={handleSaveCitationResult} disabled={saving}>
              <BookmarkPlus className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {resultMode === "discover" ? (
            <section className="space-y-3">
              {report.discovery_profile?.intent_summary && (
                <div className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Discovery Focus</p>
                    {report.discovery_profile.topic_preset && report.discovery_profile.topic_preset !== "auto" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-secondary/40 text-foreground/80">
                        {report.discovery_profile.topic_preset.replaceAll("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{report.discovery_profile.intent_summary}</p>
                  {!!report.discovery_profile.search_queries?.length && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {report.discovery_profile.search_queries.slice(0, 5).map((query, index) => (
                        <span key={`discovery-query-${index}`} className="text-[11px] px-2 py-1 rounded-full border border-border/60 bg-secondary/40 text-foreground/85">
                          {query}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/50 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Papers Gathered</p>
                  <p className="text-xl font-semibold">{report.references_processed}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Year Buckets</p>
                  <p className="text-xl font-semibold">{yearwiseCounts.length}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground mb-2">Year-wise Count</p>
                {yearwiseCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Year metadata not available in discovered papers.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {yearwiseCounts.map((item) => (
                      <span key={item.year} className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-secondary/40 text-foreground/90">
                        {item.year}: {item.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">Extracted</p>
                <p className="text-xl font-semibold">{report.total_references_extracted}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">Processed</p>
                <p className="text-xl font-semibold">{report.references_processed}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">Matched</p>
                <p className="text-xl font-semibold">{report.matched_count}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">Missing</p>
                <p className="text-xl font-semibold">{report.missing_count}</p>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-6 min-w-0">
              <section className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <h2 className="text-base sm:text-lg font-semibold">Top Cited References</h2>
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50 overflow-x-auto whitespace-nowrap max-w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setSortOrder("newest")}
                      className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                        sortOrder === "newest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock3 className="w-3.5 h-3.5 inline mr-1" /> Newest
                    </button>
                    <button
                      onClick={() => setSortOrder("oldest")}
                      className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                        sortOrder === "oldest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock3 className="w-3.5 h-3.5 inline mr-1" /> Oldest
                    </button>
                    <button
                      onClick={() => setSortOrder("highest")}
                      className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                        sortOrder === "highest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Highest Citation
                    </button>
                    <button
                      onClick={() => setSortOrder("lowest")}
                      className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                        sortOrder === "lowest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Lowest Citation
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sortedTopCited.length === 0 && (
                    <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
                      No matched references found.
                    </div>
                  )}
                  {sortedTopCited.map((entry) => (
                    <div key={`${entry.reference_index}-${entry.paper_id || entry.reference_text}`} className="rounded-xl border border-border/50 bg-card p-4 overflow-hidden">
                      <div className="flex flex-col gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground leading-snug break-words">{entry.title || "Unknown title"}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent w-fit">
                          {entry.citation_count} citations
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 break-words">{entry.authors?.slice(0, 5).join(", ") || "Unknown authors"}</p>
                      <p className="text-xs text-muted-foreground mb-3">{entry.venue || "Unknown venue"}{entry.year ? ` • ${entry.year}` : ""}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-accent inline-flex items-center gap-1 hover:underline break-all">
                          Open in Semantic Scholar <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                      <p className="text-xs text-foreground/80 mt-3 leading-relaxed break-words">{entry.reference_text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <SearchX className="w-4 h-4 text-accent" />
                  <h2 className="text-base sm:text-lg font-semibold">Unmatched References</h2>
                </div>
                <div className="space-y-2">
                  {missingReferences.length === 0 && (
                    <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
                      All processed references were matched.
                    </div>
                  )}
                  {missingReferences.map((entry) => (
                    <div key={`missing-${entry.reference_index}`} className="rounded-xl border border-border/50 bg-card p-3 flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/80 leading-relaxed break-all whitespace-normal">{entry.reference_text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="xl:col-span-2 min-w-0">
              <section className="rounded-xl border border-border/50 bg-card p-4 xl:sticky xl:top-20 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <h2 className="text-base font-semibold">AI Recommendations</h2>
                </div>

                {recommendationLoading && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      Generating reading suggestions...
                    </p>
                    <div className="h-2 rounded bg-secondary/60" />
                    <div className="h-2 rounded bg-secondary/40" />
                    <div className="h-2 rounded bg-secondary/30" />
                  </div>
                )}

                {recommendationError && (
                  <p className="text-sm text-destructive">{recommendationError}</p>
                )}

                {!recommendationLoading && !recommendationError && recommendations && (
                  <div className="space-y-4">
                    {(recommendations.paper_focus || (recommendations as any).topic_focus) && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{resultMode === "discover" ? "Topic Focus" : "Paper Focus"}</p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{(recommendations as any).topic_focus || recommendations.paper_focus}</p>
                      </div>
                    )}

                    {!!recommendations.must_read?.length && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Must Read</p>
                        <div className="space-y-2">
                          {recommendations.must_read.slice(0, 6).map((item, index) => (
                            <div key={`${item.title || "must-read"}-${index}`} className="rounded-lg border border-border/50 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium leading-snug">{item.title || "Untitled"}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.priority === "high" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                                  {(item.priority || "medium").toUpperCase()}
                                </span>
                              </div>
                              {item.why_read && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.why_read}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.reading_path?.length && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Reading Path</p>
                        <div className="space-y-1.5">
                          {recommendations.reading_path.slice(0, 3).map((step, index) => (
                            <p key={`reading-step-${index}`} className="text-sm text-foreground/90">{index + 1}. {step}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.coverage_gaps?.length && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Coverage Gaps</p>
                        <div className="space-y-1.5">
                          {recommendations.coverage_gaps.slice(0, 4).map((gap, index) => (
                            <p key={`gap-${index}`} className="text-sm text-foreground/90">• {gap}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.next_search_queries?.length && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Search Queries</p>
                        <div className="flex flex-wrap gap-1.5">
                          {recommendations.next_search_queries.slice(0, 5).map((query, index) => (
                            <span key={`query-${index}`} className="text-[11px] px-2 py-1 rounded-full border border-border/60 bg-secondary/40 text-foreground/85">
                              {query}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
