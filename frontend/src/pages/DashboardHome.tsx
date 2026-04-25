import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, FlaskConical, Lightbulb, ScanSearch, Database, BarChart3, Clock, ArrowUpRight, Sparkles, Activity, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";

const ease = [0.2, 0, 0, 1] as const;

const iconMap = {
  FileText,
  FlaskConical,
  Lightbulb,
  ScanSearch,
  BarChart3,
};

const defaultStats = [
  { label: "Papers Analyzed", value: "0", icon: "FileText", change: "Get started" },
  { label: "Experiments Planned", value: "0", icon: "FlaskConical", change: "Get started" },
  { label: "Ideas Generated", value: "0", icon: "Lightbulb", change: "Get started" },
  { label: "Gaps Detected", value: "0", icon: "ScanSearch", change: "Get started" },
  { label: "Citations Analyzed", value: "0", icon: "BarChart3", change: "Get started" },
];

const quickActions = [
  { title: "Analyze Paper", desc: "Upload & analyze a new PDF", path: "/dashboard/analyzer", icon: FileText },
  { title: "Plan Experiment", desc: "Create a research plan", path: "/dashboard/planner", icon: FlaskConical },
  { title: "Generate Ideas", desc: "Get problem statements", path: "/dashboard/generator", icon: Lightbulb },
  { title: "Detect Gaps", desc: "Find research gaps", path: "/dashboard/gaps", icon: ScanSearch },
  { title: "Dataset Finder", desc: "Find datasets & benchmarks", path: "/dashboard/dataset-benchmarks", icon: Database },
  { title: "Citation Intelligence", desc: "Analyze references & citation impact", path: "/dashboard/citation-intelligence", icon: BarChart3 },
];

const statSurface = [
  "from-cyan-500/10 via-cyan-500/5 to-transparent",
  "from-emerald-500/10 via-emerald-500/5 to-transparent",
  "from-amber-500/10 via-amber-500/5 to-transparent",
  "from-indigo-500/10 via-indigo-500/5 to-transparent",
  "from-rose-500/10 via-rose-500/5 to-transparent",
];

export default function DashboardHome() {
  const { getToken, userId, isLoaded } = useAuth();
  const [dashboardData, setDashboardData] = useState<{stats: typeof defaultStats, recentPapers: any[]}>({ stats: defaultStats, recentPapers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return; // Wait for clerk session

    const fetchData = async () => {
      try {
        if (!userId) {
          // Demo mode
          setDashboardData({
            stats: [
              { label: "Papers Analyzed", value: "24", icon: "FileText", change: "+3 this week" },
              { label: "Experiments Planned", value: "12", icon: "FlaskConical", change: "+2 this week" },
              { label: "Ideas Generated", value: "89", icon: "Lightbulb", change: "+15 this week" },
              { label: "Gaps Detected", value: "31", icon: "ScanSearch", change: "+5 this week" },
              { label: "Citations Analyzed", value: "19", icon: "BarChart3", change: "+4 this week" },
            ],
            recentPapers: [
              { title: "Attention Is All You Need", date: "2 hours ago", status: "Analyzed" },
              { title: "BERT: Pre-training of Deep Bidirectional Transformers", date: "1 day ago", status: "Analyzed" },
              { title: "GPT-4 Technical Report", date: "3 days ago", status: "In Progress" },
            ]
          });
          setLoading(false);
          return;
        }

        const token = await getToken();
        if (!token) return;
        const res = await apiClient.fetch("/api/dashboard", {}, getToken);
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken, userId, isLoaded]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(130deg,hsl(var(--card))_0%,hsl(var(--card)/0.84)_65%,hsl(var(--accent)/0.08)_100%)] px-6 py-7 sm:px-8 sm:py-8"
      >
        <div className="pointer-events-none absolute -top-28 left-0 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.7} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Research Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-foreground">
              Welcome back. Your research cockpit is ready.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              Track momentum, jump into the right tool, and keep your workflow moving from paper reading to experimentation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[250px]">
            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                <Activity className="w-3.5 h-3.5 text-accent" />
                Activity
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">High</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                <CalendarClock className="w-3.5 h-3.5 text-accent" />
                This Week
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">Focused</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-4">
        {dashboardData.stats.map((s, i) => {
          const Icon = iconMap[s.icon as keyof typeof iconMap] || FileText;
          const isLastOddCard = dashboardData.stats.length % 2 !== 0 && i === dashboardData.stats.length - 1;

          return (
            <motion.div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-5 premium-shadow ${isLastOddCard ? "col-span-2" : ""}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease }}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${statSurface[i % statSurface.length]}`} />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-background/70 border border-border/60 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-foreground" strokeWidth={1.6} />
                </div>
                <span className="text-[11px] text-accent font-mono uppercase tracking-wider">{s.change}</span>
              </div>
              <p className="relative z-10 text-2xl font-semibold text-foreground tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : s.value}
              </p>
              <p className="relative z-10 text-xs text-muted-foreground mt-1.5 tracking-wide">{s.label}</p>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Quick Actions</h2>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Launch Tools</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 9 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.05, ease }}
              >
                <Link
                  to={a.path}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-4 transition-all duration-250 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_16px_40px_-26px_hsl(var(--accent))]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/10 via-transparent to-accent/5" />
                  <div className="relative z-10 w-11 h-11 rounded-xl bg-background/70 border border-border/60 flex items-center justify-center flex-shrink-0">
                    <a.icon className="w-5 h-5 text-accent" strokeWidth={1.6} />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground tracking-wide">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="relative z-10 w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Recent Papers</h2>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Timeline</span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/90 overflow-hidden premium-shadow">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : dashboardData.recentPapers.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                No recent papers analyzed.
              </div>
            ) : (
              dashboardData.recentPapers.map((p, i) => (
                <motion.div
                  key={i}
                  className="px-4 py-4 border-b border-border/50 last:border-b-0 hover:bg-secondary/25 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{p.date}</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider ${p.status === "Analyzed" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-secondary text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
