import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, FileText, FlaskConical, Lightbulb, ScanSearch, Database, BarChart3, Settings, LogOut, Menu, X, Sun, Moon, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserButton, SignOutButton, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Paper Analyzer", path: "/dashboard/analyzer", icon: FileText },
  { title: "Experiment Planner", path: "/dashboard/planner", icon: FlaskConical },
  { title: "Problem Generator", path: "/dashboard/generator", icon: Lightbulb },
  { title: "Gap Detection", path: "/dashboard/gaps", icon: ScanSearch },
  { title: "Dataset & Benchmark Finder", path: "/dashboard/dataset-benchmarks", icon: Database },
  { title: "Citation Intelligence", path: "/dashboard/citation-intelligence", icon: BarChart3 },
  { title: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      navigate("/login", { replace: true });
    }
  }, [isLoaded, userId, navigate]);

  // Get search results based on current page and query
  const getSearchResults = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const currentPath = location.pathname;
    const results = [];

    // Always include navigation items
    navItems.forEach((item) => {
      if (item.title.toLowerCase().includes(query)) {
        results.push({
          title: item.title,
          path: item.path,
          description: `Navigate to ${item.title}`,
        });
      }
    });

    // Add page-specific search results
    if (currentPath.includes("analyzer")) {
      const analyzerItems = [
        { title: "Upload Paper", path: "/dashboard/analyzer", description: "Upload and analyze research papers" },
        { title: "View Analysis", path: "/dashboard/analyzer", description: "View paper analysis results" },
        { title: "Ask Questions", path: "/dashboard/analyzer", description: "Ask follow-up questions about papers" },
      ];
      analyzerItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    } else if (currentPath.includes("planner")) {
      const plannerItems = [
        { title: "Generate Plan", path: "/dashboard/planner", description: "Create experiment plans" },
        { title: "View Steps", path: "/dashboard/planner", description: "See step-by-step instructions" },
        { title: "Export Plan", path: "/dashboard/planner", description: "Download experiment plan" },
      ];
      plannerItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    } else if (currentPath.includes("generator")) {
      const generatorItems = [
        { title: "Generate Problems", path: "/dashboard/generator", description: "Generate research problems" },
        { title: "View Ideas", path: "/dashboard/generator", description: "Browse research ideas" },
        { title: "Expand Idea", path: "/dashboard/generator", description: "Get detailed problem briefs" },
      ];
      generatorItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    } else if (currentPath.includes("gaps")) {
      const gapsItems = [
        { title: "Detect Gaps", path: "/dashboard/gaps", description: "Identify research gaps" },
        { title: "Analyze", path: "/dashboard/gaps", description: "Run gap detection analysis" },
      ];
      gapsItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    } else if (currentPath.includes("dataset-benchmarks")) {
      const finderItems = [
        { title: "Find Datasets", path: "/dashboard/dataset-benchmarks", description: "Get domain-specific dataset recommendations" },
        { title: "Find Benchmarks", path: "/dashboard/dataset-benchmarks", description: "Discover suitable benchmark suites and metrics" },
        { title: "Technology Stack", path: "/dashboard/dataset-benchmarks", description: "See commonly used frameworks and tools" },
      ];
      finderItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    } else if (currentPath.includes("citation-intelligence")) {
      const citationItems = [
        { title: "Upload Paper", path: "/dashboard/citation-intelligence", description: "Upload a paper for citation analysis" },
        { title: "Top Cited References", path: "/dashboard/citation-intelligence", description: "Sort matched references by citation count" },
        { title: "Missing References", path: "/dashboard/citation-intelligence", description: "See references not found in Semantic Scholar" },
      ];
      citationItems.forEach((item) => {
        if (item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          if (!results.find(r => r.title === item.title)) {
            results.push(item);
          }
        }
      });
    }

    return results.slice(0, 6); // Limit to 6 results
  };

  const searchResults = getSearchResults();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoaded || !userId) {
    return null;
  }

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_8%_12%,hsl(var(--accent)/0.14),transparent_34%),radial-gradient(circle_at_92%_88%,hsl(var(--accent)/0.1),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.18)_1px,transparent_1px)] [background-size:38px_38px]" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen flex-shrink-0 transition-all duration-300 overflow-hidden lg:overflow-visible border-r border-border/60 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--card)/0.94)_100%)] ${
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        }`}
      >
        <div className="h-full flex flex-col w-64 lg:w-auto">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center px-4 border-b border-border/60 flex-shrink-0 relative">
            <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <img src="/favicon.svg" alt="PaperLens Logo" className="w-8 h-8 flex-shrink-0" />
            {sidebarOpen && (
              <div className="ml-2.5 flex flex-col leading-tight">
                <span className="font-semibold text-foreground whitespace-nowrap text-sm tracking-wide">PaperLens AI</span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Research OS</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-accent/15 to-accent/5 text-accent border border-accent/20 shadow-[0_8px_22px_-16px_hsl(var(--accent))]"
                      : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-secondary/40 hover:border-border/50"
                  }`}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />
                  )}
                  <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} strokeWidth={1.6} />
                  {!sidebarOpen && (
                    <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 rounded-lg border border-border/70 bg-card/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xl opacity-0 translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 lg:block">
                      <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-t border-border/70 bg-card/95" />
                      {item.title}
                    </span>
                  )}
                  {sidebarOpen && <span className="font-medium tracking-wide text-[13px]">{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions */}
          <div className="p-3 border-t border-border/60">
            <SignedIn>
              <SignOutButton>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent hover:border-border/50 transition-all whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.6} />
                  {sidebarOpen && <span className="font-medium">Logout</span>}
                </button>
              </SignOutButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors whitespace-nowrap"
                >
                  <User className="w-4 h-4 flex-shrink-0" strokeWidth={1.6} />
                  {sidebarOpen && <span className="font-medium">Sign In</span>}
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-16"
        }`}
        style={{ ["--dashboard-sidebar-offset" as string]: sidebarOpen ? "16rem" : "4rem" }}
      >
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border/60 glass-surface sticky top-0 z-20 flex-shrink-0 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl border border-border/60 bg-card/50 hover:bg-card"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <span className="lg:hidden">
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </span>
              <span className="hidden lg:block">
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </span>
            </Button>
            <div className="lg:hidden flex items-center gap-2">
              <img src="/favicon.svg" alt="PaperLens Logo" className="w-6 h-6" />
              <span className="font-semibold text-sm">PaperLens AI</span>
            </div>
            <div className="hidden sm:flex items-center rounded-full border border-border/60 bg-card/50 px-3 py-1.5">
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                {navItems.find((i) => i.path === location.pathname)?.title || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                className="pl-9 h-9 w-64 text-sm bg-card/70 border-border/60 rounded-xl focus-visible:ring-2 focus-visible:ring-accent/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
              />
              {showSearchResults && searchQuery && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden z-50">
                  {searchResults.map((result, idx) => (
                    <Link
                      key={`${result.path}-${idx}`}
                      to={result.path}
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-secondary/40 border-b border-border/40 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/60 bg-card/50 hover:bg-card" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
