import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Upload, BarChart3, ExternalLink, SearchX, Sparkles, FileText, Loader2, CheckCircle2, BookOpen, Clock3 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

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
};

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

export default function CitationIntelligence() {
  const { getToken } = useAuth();

  const [mode, setMode] = useState<"upload" | "discover">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [basicDetails, setBasicDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<CitationReport | null>(null);
  const [resultMode, setResultMode] = useState<"upload" | "discover" | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [recommendations, setRecommendations] = useState<CitationRecommendations | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    return `Matched reference titles: ${matchedTitles}\n\nReference sample:\n${referenceSample}`;
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

    try {
      setLoading(true);
      setError(null);
      setReport(null);
      setRecommendations(null);
      setRecommendationError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.fetch(
        "/api/citation-intelligence",
        {
          method: "POST",
          body: formData,
        },
        getToken
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to run citation intelligence.");
      }

      const parsedReport = data as CitationReport;
      setReport(parsedReport);
      setResultMode("upload");
      await fetchRecommendations(parsedReport, "upload");
    } catch (err: any) {
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

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Citation Intelligence</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {modeIntro[mode].description}
        </p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border/50 w-fit mb-3">
          <button
            onClick={() => setMode("upload")}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload Paper
          </button>
          <button
            onClick={() => setMode("discover")}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
              mode === "discover" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Project Discovery
          </button>
        </div>

        {mode === "upload" ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                type="file"
                id="citation-file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.docx"
              />
              <label
                htmlFor="citation-file"
                className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-md border border-border/60 bg-secondary/40 text-sm cursor-pointer hover:bg-secondary/60 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </label>

              <div className="min-w-0 flex-1 h-10 rounded-md border border-border/60 bg-background/50 px-3 flex items-center">
                <p className="text-sm text-foreground truncate">{file ? file.name : "No file selected"}</p>
              </div>

              <Button onClick={handleUploadRun} disabled={!file || loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Analyzing citations..." : "Run Citation Intelligence"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">PDF/DOCX • Max 12MB</p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title (required)"
                className="h-10 rounded-md border border-border/60 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <input
                type="text"
                value={basicDetails}
                onChange={(e) => setBasicDetails(e.target.value)}
                placeholder="Basic details (optional): domain, method, dataset"
                className="h-10 rounded-md border border-border/60 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button onClick={handleDiscoverRun} disabled={!projectTitle.trim() || loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-8">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
                {loading ? "Discovering papers..." : "Discover 30+ Papers"}
              </Button>
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

      {loading && (
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
        <div className="space-y-8">
          {resultMode === "discover" ? (
            <section className="space-y-3">
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
            <div className="xl:col-span-3 space-y-6">
              <section>
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
                    <div key={`${entry.reference_index}-${entry.paper_id || entry.reference_text}`} className="rounded-xl border border-border/50 bg-card p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">{entry.title || "Unknown title"}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent w-fit">
                          {entry.citation_count} citations
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{entry.authors?.slice(0, 5).join(", ") || "Unknown authors"}</p>
                      <p className="text-xs text-muted-foreground mb-3">{entry.venue || "Unknown venue"}{entry.year ? ` • ${entry.year}` : ""}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer" className="text-xs text-accent inline-flex items-center gap-1 hover:underline">
                          Open in Semantic Scholar <ExternalLink className="w-3 h-3" />
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

            <div className="xl:col-span-2">
              <section className="rounded-xl border border-border/50 bg-card p-4 xl:sticky xl:top-20">
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
