import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, FlaskConical, Lightbulb, ScanSearch, Database, BarChart3, Clock, ArrowUpRight } from "lucide-react";
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
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here's an overview of your research activity.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {dashboardData.stats.map((s, i) => {
          const Icon = iconMap[s.icon as keyof typeof iconMap] || FileText;
          return (
            <motion.div
              key={s.label}
              className="rounded-2xl border border-border/50 bg-card p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease }}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs text-accent font-mono">{s.change}</span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease }}
              >
                <Link
                  to={a.path}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <a.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Recent Papers</h2>
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : dashboardData.recentPapers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent papers analyzed.
              </div>
            ) : (
              dashboardData.recentPapers.map((p, i) => (
                <motion.div
                  key={i}
                  className="p-4 hover:bg-secondary/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{p.date}</span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${p.status === "Analyzed" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
