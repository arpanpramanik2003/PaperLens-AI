import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Search, LayoutDashboard, FileText, FlaskConical, Lightbulb, ScanSearch, Settings, LogOut, Menu, X, Sun, Moon, User } from "lucide-react";
import { UserButton, SignOutButton, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Paper Analyzer", path: "/dashboard/analyzer", icon: FileText },
  { title: "Experiment Planner", path: "/dashboard/planner", icon: FlaskConical },
  { title: "Problem Generator", path: "/dashboard/generator", icon: Lightbulb },
  { title: "Gap Detection", path: "/dashboard/gaps", icon: ScanSearch },
  { title: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen flex-shrink-0 transition-all duration-300 bg-card border-r border-border/50 overflow-hidden ${
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        }`}
      >
        <div className="h-full flex flex-col w-64 lg:w-auto">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2 px-4 border-b border-border/50 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4 text-accent-foreground" />
            </div>
            {sidebarOpen && <span className="font-semibold text-foreground text-sm whitespace-nowrap">PaperLens AI</span>}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative whitespace-nowrap ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
                  )}
                  <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions */}
          <div className="p-3 border-t border-border/50">
            <SignedIn>
              <SignOutButton>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {sidebarOpen && <span>Logout</span>}
                </button>
              </SignOutButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-accent bg-accent/10 hover:bg-accent/20 transition-colors whitespace-nowrap"
                >
                  <User className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  {sidebarOpen && <span>Sign In</span>}
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {/* Top Navbar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/50 glass-surface sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="hidden sm:flex items-center">
              <span className="font-mono text-xs text-muted-foreground">
                {navItems.find((i) => i.path === location.pathname)?.title || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 h-8 w-56 text-sm bg-secondary/50 border-border/50" />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
