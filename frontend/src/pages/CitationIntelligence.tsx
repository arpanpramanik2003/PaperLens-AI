import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, BarChart3, ExternalLink, SearchX, Sparkles, FileText, Loader2, CheckCircle2, BookOpen, Clock3, XCircle, BookmarkPlus } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { apiClient } from "@/lib/api-client";
import { scrollToResult } from "@/lib/scroll-to-result";
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

  const scrollToResults = () => {
    setTimeout(() => {
      const el = document.getElementById("citation-results");
      if (el) scrollToResult(el, { retries: 3, retryDelay: 250 });
    }, 250);
  };

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
            scrollToResults();
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
      scrollToResults();
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
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(120deg,hsl(var(--card))_0%,hsl(var(--card)/0.92)_48%,hsl(210_90%_55%/.10)_100%)] px-6 py-6 sm:px-8 sm:py-7"
      >
        <div className="pointer-events-none absolute -top-24 left-8 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/45 px-3 py-1 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Citation Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight mb-2">Citation Intelligence</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{modeIntro[mode].description}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Current Mode</p>
            <p className="text-sm font-semibold text-foreground mb-2">{mode === "upload" ? "Paper-based Analysis" : "Project Discovery"}</p>
            <div className="space-y-1.5">
              {modeIntro[mode].points.slice(0, 2).map((point) => (
                <p key={point} className="text-xs text-muted-foreground leading-relaxed">• {point}</p>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div
        className="relative rounded-3xl border border-border/60 bg-[linear-gradient(165deg,hsl(var(--card))_0%,hsl(var(--card)/0.93)_52%,hsl(214_92%_56%/.10)_100%)] p-4 sm:p-5 overflow-hidden premium-shadow"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="pointer-events-none absolute -top-20 left-8 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Execution Mode</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Choose how you want to work</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Upload a paper for reference extraction, or switch to discovery and fill in a project brief to find related papers.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-border/60 bg-background/45 text-foreground/80 shadow-sm w-fit">
              {mode === "upload" ? "Paper Workflow" : "Discovery Workflow"}
            </span>
          </div>

          <div className="flex w-full flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-background/45 border border-border/60 sm:w-fit shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs transition-all duration-200 ${
                mode === "upload"
                  ? "bg-[linear-gradient(140deg,hsl(var(--background))_0%,hsl(var(--background)/0.88)_100%)] text-foreground shadow-[0_10px_20px_-16px_hsl(var(--accent))] border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/25"
              }`}
            >
              Upload Paper
            </button>
            <button
              onClick={() => setMode("discover")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs transition-all duration-200 ${
                mode === "discover"
                  ? "bg-[linear-gradient(140deg,hsl(var(--background))_0%,hsl(var(--background)/0.88)_100%)] text-foreground shadow-[0_10px_20px_-16px_hsl(var(--accent))] border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/25"
              }`}
            >
              Project Discovery
            </button>
          </div>

          {mode === "upload" ? (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4">
              <div className="rounded-2xl border border-border/60 bg-[linear-gradient(160deg,hsl(var(--background)/0.55)_0%,hsl(var(--background)/0.25)_100%)] p-4 shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-accent" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 1 · Select a paper</p>
                </div>

                <input
                  type="file"
                  id="citation-file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.docx"
                />

                <label
                  htmlFor="citation-file"
                  className="flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-4 cursor-pointer hover:border-accent/45 hover:bg-background/55 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Drop your PDF or DOCX here</p>
                    <p className="text-xs text-muted-foreground mt-1">Pick one file to extract references and run citation analysis.</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-xs text-foreground/85">
                    Browse
                  </span>
                </label>

                <div className="mt-3 rounded-xl border border-border/60 bg-background/45 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Selected file</p>
                  {file ? (
                    <p className="text-sm text-foreground break-all">{file.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No file selected yet</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-3">PDF/DOCX • Max 12MB</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-[linear-gradient(165deg,hsl(var(--card)/0.98)_0%,hsl(var(--card)/0.88)_100%)] p-4 shadow-[0_14px_30px_-28px_hsl(var(--accent))]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 · Run analysis</p>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  After selection, the system extracts references, matches them with Semantic Scholar, and ranks the results by citation signal.
                </p>
                <ShinyButton
                  onClick={handleUploadRun}
                  disabled={!file || loading}
                  className="mt-4 h-11 w-full rounded-xl px-8"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                  {loading ? "Analyzing citations..." : "Run Citation Intelligence"}
                </ShinyButton>
                <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-background/35 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">What happens next</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">1. Extract references from the uploaded file.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">2. Match papers against Semantic Scholar metadata.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">3. Rank the matched references by citation impact.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4 items-start">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-[linear-gradient(160deg,hsl(var(--background)/0.55)_0%,hsl(var(--background)/0.25)_100%)] p-4 shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 1 · Choose a domain</p>
                      <p className="text-sm text-foreground/90 mt-1">Use a preset or let the system infer one from your brief.</p>
                    </div>
                    {topicPreset !== "auto" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-background/50 text-foreground/85 uppercase tracking-wider">
                        Manual
                      </span>
                    )}
                  </div>
                  <select
                    value={topicPreset}
                    onChange={(e) => setTopicPreset(e.target.value as TopicPreset)}
                    className="h-12 w-full rounded-2xl border border-border/60 bg-background/60 px-4 text-sm text-foreground focus:outline-none"
                  >
                    {topicPresetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                    {topicPresetOptions.find((option) => option.value === topicPreset)?.description}
                  </p>
                  {topicPreset === "auto" && inferredTopicPreset && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      Suggested preset: <span className="text-foreground font-medium">{topicPresetOptions.find((option) => option.value === inferredTopicPreset)?.label}</span>. You can keep auto-detect or override it manually.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <label className="space-y-2 rounded-2xl border border-border/60 bg-background/45 p-3.5">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground">Project title</span>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="Required: e.g. brain tumor detection with CNNs"
                      className="h-11 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </label>

                  <label className="space-y-2 rounded-2xl border border-border/60 bg-background/45 p-3.5">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground">Basic details</span>
                    <input
                      type="text"
                      value={basicDetails}
                      onChange={(e) => setBasicDetails(e.target.value)}
                      placeholder="Optional: method, dataset, task, or constraints"
                      className="h-11 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-[linear-gradient(165deg,hsl(var(--card)/0.98)_0%,hsl(var(--card)/0.88)_100%)] p-4 shadow-[0_14px_30px_-28px_hsl(var(--accent))]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 · Generate results</p>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  This panel turns your short project brief into a ranked list of related papers, then generates reading recommendations from the discovered evidence.
                </p>
                <ShinyButton
                  onClick={handleDiscoverRun}
                  disabled={!projectTitle.trim() || loading}
                  className="mt-4 h-11 w-full rounded-xl px-8"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                  {loading ? "Discovering papers..." : "Discover 30+ Papers"}
                </ShinyButton>
                <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-background/35 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Writing guide</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Use the title field for the exact project name.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Add methods, datasets, or constraints in the second field to improve retrieval quality.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">The tool can auto-detect a topic preset if your brief is descriptive enough.</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>
      </motion.div>

      {!report && !loading && (
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--card)/0.92)_100%)] p-5 mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_10%_12%,hsl(var(--accent)/0.12),transparent_35%),radial-gradient(circle_at_92%_85%,hsl(var(--accent)/0.08),transparent_38%)]" />

          <div className="relative z-10">
            <p className="text-sm font-semibold text-foreground mb-1">{modeIntro[mode].title}</p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{modeIntro[mode].description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {modeIntro[mode].points.map((point, idx) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08, ease }}
                  className="rounded-xl border border-border/60 bg-secondary/25 px-3.5 py-2.5"
                >
                  <p className="text-xs text-foreground/90 leading-relaxed">{point}</p>
                </motion.div>
              ))}
            </div>
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
        <div id="citation-results" className="space-y-6 overflow-hidden" style={{ scrollMarginTop: "5rem" }}>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={handleSaveCitationResult} disabled={saving}>
              <BookmarkPlus className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
            <aside className="space-y-4 xl:sticky xl:top-20 h-fit">
              <section className="rounded-2xl border border-border/60 bg-card p-4 premium-shadow">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-3">Analytics Rail</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processed</p>
                    <p className="text-sm font-semibold">{report.references_processed}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Matched</p>
                    <p className="text-sm font-semibold text-accent">{report.matched_count}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Missing</p>
                    <p className="text-sm font-semibold">{report.missing_count}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Year Buckets</p>
                    <p className="text-sm font-semibold">{yearwiseCounts.length}</p>
                  </div>
                </div>
                {yearwiseCounts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Year Distribution</p>
                    <div className="flex flex-wrap gap-1.5">
                      {yearwiseCounts.slice(0, 8).map((item) => (
                        <span
                          key={`year-bucket-${item.year}`}
                          className="text-[10px] px-2 py-1 rounded-full border border-border/60 bg-secondary/30 text-foreground"
                        >
                          {item.year}: {item.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-border/60 bg-card p-4 premium-shadow">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Sort Stream</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setSortOrder("newest")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${sortOrder === "newest" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortOrder("oldest")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${sortOrder === "oldest" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    Oldest
                  </button>
                  <button
                    onClick={() => setSortOrder("highest")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${sortOrder === "highest" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    High Cite
                  </button>
                  <button
                    onClick={() => setSortOrder("lowest")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${sortOrder === "lowest" ? "bg-accent/15 text-accent" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}
                  >
                    Low Cite
                  </button>
                </div>
              </section>

              {resultMode === "discover" && report.discovery_profile?.intent_summary && (
                <section className="rounded-2xl border border-border/60 bg-card p-4 premium-shadow">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Discovery Focus</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{report.discovery_profile.intent_summary}</p>
                </section>
              )}

              <section className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--card)/0.96)_100%)] p-4 premium-shadow min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold">AI Recommendations</h2>
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

                {recommendationError && <p className="text-sm text-destructive">{recommendationError}</p>}

                {!recommendationLoading && !recommendationError && recommendations && (
                  <div className="space-y-3.5">
                    {(recommendations.paper_focus || (recommendations as any).topic_focus) && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{resultMode === "discover" ? "Topic Focus" : "Paper Focus"}</p>
                        <p className="text-xs text-foreground/90 leading-relaxed">{(recommendations as any).topic_focus || recommendations.paper_focus}</p>
                      </div>
                    )}

                    {!!recommendations.must_read?.length && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Must Read</p>
                        <div className="space-y-1.5">
                          {recommendations.must_read.slice(0, 4).map((item, index) => (
                            <div key={`${item.title || "must-read"}-${index}`} className="rounded-lg border border-border/50 px-2.5 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium leading-snug">{item.title || "Untitled"}</p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border/60 bg-secondary/30 text-foreground/85 uppercase">
                                  {item.priority || "medium"}
                                </span>
                              </div>
                              {item.why_read && (
                                <p className="text-[11px] text-foreground/80 mt-1 leading-relaxed">{item.why_read}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.reading_path?.length && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Reading Path</p>
                        <div className="space-y-1.5">
                          {recommendations.reading_path.slice(0, 3).map((step, index) => (
                            <div key={`reading-step-${index}`} className="rounded-lg border border-border/50 px-2.5 py-2 bg-secondary/20">
                              <p className="text-[11px] text-foreground/90 leading-relaxed">{index + 1}. {step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.coverage_gaps?.length && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Coverage Gaps</p>
                        <div className="space-y-1.5">
                          {recommendations.coverage_gaps.slice(0, 3).map((gap, index) => (
                            <div key={`gap-${index}`} className="rounded-lg border border-border/50 px-2.5 py-2 bg-secondary/20">
                              <p className="text-[11px] text-foreground/85 leading-relaxed">{gap}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!recommendations.next_search_queries?.length && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Search Queries</p>
                        <div className="flex flex-wrap gap-1.5">
                          {recommendations.next_search_queries.slice(0, 4).map((query, index) => (
                            <span key={`query-${index}`} className="text-[10px] px-2 py-1 rounded-full border border-border/60 bg-secondary/40 text-foreground/85">
                              {query}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </aside>

            <div className="space-y-6 min-w-0">
              <section className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <h2 className="text-base sm:text-lg font-semibold">Live Citation Stream</h2>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-secondary/30 text-muted-foreground font-mono uppercase tracking-widest">
                    {sortedTopCited.length} entries
                  </span>
                </div>

                <div className="space-y-3">
                  {sortedTopCited.length === 0 && (
                    <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
                      No matched references found.
                    </div>
                  )}
                  {sortedTopCited.map((entry, index) => (
                    <motion.div
                      key={`${entry.reference_index}-${entry.paper_id || entry.reference_text}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className="rounded-xl border border-border/60 bg-card p-4 overflow-hidden hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent w-fit">
                          {entry.citation_count} citations
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-foreground leading-snug break-words mb-1">{entry.title || "Unknown title"}</h3>
                      <p className="text-xs text-muted-foreground mb-2 break-words">{entry.authors?.slice(0, 5).join(", ") || "Unknown authors"}</p>
                      <p className="text-xs text-muted-foreground mb-3">{entry.venue || "Unknown venue"}{entry.year ? ` • ${entry.year}` : ""}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-accent inline-flex items-center gap-1 hover:underline break-all">
                          Open in Semantic Scholar <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                      <p className="text-xs text-foreground/80 mt-3 leading-relaxed break-words">{entry.reference_text}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <SearchX className="w-4 h-4 text-accent" />
                    <h2 className="text-base sm:text-lg font-semibold">Unmatched References</h2>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-secondary/30 text-muted-foreground font-mono uppercase tracking-widest">
                    {missingReferences.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {missingReferences.length === 0 && (
                    <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
                      All processed references were matched.
                    </div>
                  )}
                  {missingReferences.map((entry) => (
                    <div key={`missing-${entry.reference_index}`} className="rounded-xl border border-border/60 bg-card p-3 flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground/80 leading-relaxed break-all whitespace-normal">{entry.reference_text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
