import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FlaskConical,
  Lightbulb,
  ScanSearch,
  Database,
  BarChart3,
  Clock,
  ArrowUpRight,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";
import { handleApiError } from "@/lib/error-handler";

const ease = [0.2, 0, 0, 1] as const;

const iconMap = {
  FileText,
  FlaskConical,
  Lightbulb,
  ScanSearch,
  Database,
  BarChart3,
};

const defaultStats = [
  { label: "Papers Analyzed", value: "0", icon: "FileText", change: "+3 this week" },
  { label: "Experiments Planned", value: "0", icon: "FlaskConical", change: "+2 this week" },
  { label: "Ideas Generated", value: "0", icon: "Lightbulb", change: "+15 this week" },
  { label: "Gaps Detected", value: "0", icon: "ScanSearch", change: "+5 this week" },
  { label: "Datasets & Benchmarks", value: "0", icon: "Database", change: "+6 this week" },
  { label: "Citations Analyzed", value: "0", icon: "BarChart3", change: "+4 this week" },
];

const statStyling = [
  {
    gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
    border: "group-hover:border-cyan-500/40",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(6,182,212,0.3)]",
  },
  {
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    border: "group-hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)]",
  },
  {
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    border: "group-hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(245,158,11,0.3)]",
  },
  {
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    border: "group-hover:border-violet-500/40",
    iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(139,92,246,0.3)]",
  },
  {
    gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    border: "group-hover:border-rose-500/40",
    iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(244,63,94,0.3)]",
  },
  {
    gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    border: "group-hover:border-indigo-500/40",
    iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    glow: "shadow-[0_8px_30px_-12px_rgba(99,102,241,0.3)]",
  },
];

const quickActions = [
  { title: "Paper Analyzer", desc: "Upload & extract key methodology", path: "/dashboard/analyzer", icon: FileText, color: "text-cyan-400" },
  { title: "Experiment Planner", desc: "Build SOTA execution roadmaps", path: "/dashboard/planner", icon: FlaskConical, color: "text-emerald-400" },
  { title: "Problem Generator", desc: "Formulate novel research directions", path: "/dashboard/generator", icon: Lightbulb, color: "text-amber-400" },
  { title: "Gap Detector", desc: "Uncover hidden research limitations", path: "/dashboard/gaps", icon: ScanSearch, color: "text-violet-400" },
  { title: "Dataset Finder", desc: "Recommend benchmarks & metrics", path: "/dashboard/dataset-benchmarks", icon: Database, color: "text-rose-400" },
  { title: "Citation Intelligence", desc: "Analyze references & domain impact", path: "/dashboard/citation-intelligence", icon: BarChart3, color: "text-indigo-400" },
];

export default function DashboardHome() {
  const { getToken, userId, isLoaded } = useAuth();
  const [dashboardData, setDashboardData] = useState<{ stats: typeof defaultStats; recentPapers: any[] }>({
    stats: defaultStats,
    recentPapers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchData = async () => {
      try {
        if (!userId) {
          // Demo fallback stats
          setDashboardData({
            stats: [
              { label: "Papers Analyzed", value: "75", icon: "FileText", change: "+5 this week" },
              { label: "Experiments Planned", value: "98", icon: "FlaskConical", change: "+8 this week" },
              { label: "Ideas Generated", value: "77", icon: "Lightbulb", change: "+12 this week" },
              { label: "Gaps Detected", value: "31", icon: "ScanSearch", change: "+4 this week" },
              { label: "Datasets & SOTA", value: "35", icon: "Database", change: "+6 this week" },
              { label: "Citations Analyzed", value: "106", icon: "BarChart3", change: "+14 this week" },
            ],
            recentPapers: [
              { title: "Equivariant 3D Networks for Binding Affinity", date: "2 hours ago", status: "Analyzed" },
              { title: "Attention Is All You Need", date: "5 hours ago", status: "Analyzed" },
              { title: "BERT: Pre-training of Deep Bidirectional Transformers", date: "1 day ago", status: "Analyzed" },
              { title: "GPT-4 Technical Report", date: "2 days ago", status: "In Progress" },
            ],
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        if (!token) return;
        const res = await apiClient.fetch("/api/dashboard", {}, getToken);
        if (res.ok) {
          const data = await res.json();
          setDashboardData({
            stats: Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : defaultStats,
            recentPapers: Array.isArray(data.recentPapers) ? data.recentPapers : [],
          });
        } else {
          const errPayload = await res.json().catch(() => ({}));
          handleApiError({ status: res.status, payload: errPayload }, "Dashboard Stats");
        }
      } catch (err) {
        handleApiError(err, "Dashboard Stats");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken, userId, isLoaded]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6 px-1 sm:px-0">
      {/* Sleek, High-Density Header Banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/90 to-accent/10 p-4 sm:p-6 premium-shadow"
      >
        <div className="pointer-events-none absolute -top-20 left-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">Research Cockpit</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back to PaperLens AI
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Accelerate your academic workflow: analyze papers, detect research gaps, and plan experiments seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Fast-Path</span>
                <span className="text-xs font-semibold text-foreground">Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">System Status</span>
                <span className="text-xs font-semibold text-emerald-400">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Smart High-Density Metric Cards Grid (Only renders cards with non-zero counts) */}
      {(() => {
        const activeStats = dashboardData.stats.filter((s) => {
          const num = parseInt(String(s.value).replace(/[^0-9]/g, ""), 10);
          return !isNaN(num) && num > 0;
        });

        if (loading) {
          return (
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="rounded-2xl border border-border/60 bg-card/90 p-4 space-y-2">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </section>
          );
        }

        if (activeStats.length === 0) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-card to-card p-4 sm:p-5 flex items-center justify-between gap-4 premium-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 text-accent">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Welcome to PaperLens AI!</p>
                  <p className="text-xs text-muted-foreground">You don't have active paper metrics yet. Launch a tool below to analyze your first paper.</p>
                </div>
              </div>
              <Link
                to="/dashboard/analyzer"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold shadow-md hover:bg-accent/90 transition-all flex-shrink-0"
              >
                <span>Upload Paper</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          );
        }

        // Dynamic column layout based on active count (e.g. 2 cols mobile, 3 cols tablet, auto-fit desktop)
        const gridColsClass =
          activeStats.length === 1
            ? "grid-cols-1"
            : activeStats.length === 2
            ? "grid-cols-2 lg:grid-cols-2"
            : activeStats.length === 3
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
            : activeStats.length === 4
            ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
            : activeStats.length === 5
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";

        return (
          <section className={`grid ${gridColsClass} gap-3`}>
            {activeStats.map((s, i) => {
              const Icon = iconMap[s.icon as keyof typeof iconMap] || FileText;
              const style = statStyling[i % statStyling.length];

              return (
                <motion.div
                  key={s.label}
                  className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-3.5 sm:p-4 transition-all duration-250 hover:-translate-y-0.5 ${style.border} ${style.glow} premium-shadow`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease }}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      <TrendingUp className="w-2.5 h-2.5" />
                      <span>{s.change.replace(" this week", "")}</span>
                    </div>
                  </div>

                  <div className="relative z-10 text-xl sm:text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
                    {s.value}
                  </div>

                  <p className="relative z-10 text-[11px] font-medium text-muted-foreground mt-1 truncate tracking-wide">
                    {s.label}
                  </p>
                </motion.div>
              );
            })}
          </section>
        );
      })()}

      {/* Tools Launcher & Recent Papers Timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (Launch Tools) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">Launch Tools</h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">6 Active Capabilities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 + i * 0.04, ease }}
              >
                <Link
                  to={a.path}
                  className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card hover:shadow-lg"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-accent/10 via-transparent to-transparent" />
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors">
                    <a.icon className={`w-4 h-4 ${a.color}`} strokeWidth={1.8} />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground tracking-wide truncate group-hover:text-accent transition-colors">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="relative z-10 w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Papers Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">Recent Papers</h2>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Timeline</span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/90 overflow-hidden premium-shadow min-h-[300px]">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : dashboardData.recentPapers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No recent papers analyzed yet. Upload a PDF in Paper Analyzer to get started.
              </div>
            ) : (
              dashboardData.recentPapers.map((p, i) => (
                <motion.div
                  key={i}
                  className="px-4 py-3 border-b border-border/40 last:border-b-0 hover:bg-secondary/30 transition-colors flex items-start justify-between gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{p.date}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${
                      p.status === "Analyzed"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-secondary text-muted-foreground border border-border/50"
                    }`}
                  >
                    {p.status}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
