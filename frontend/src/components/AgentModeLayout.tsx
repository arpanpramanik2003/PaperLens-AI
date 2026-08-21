import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { BrainCircuit, Sun, Moon, ArrowLeft } from "lucide-react";
import { UserButton, SignedIn } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgentModeLayout() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("paperlens-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("paperlens-theme", newDark ? "dark" : "light");
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border-border/70 h-8 px-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit Agent Mode
          </Button>

          <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-secondary border border-border/60">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground">
                Agent Mode
              </span>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/70 hidden sm:inline-flex">
                Autonomous Research
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/70"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Main Content Workspace: Fits viewport perfectly without outer scroll */}
      <main className="flex-1 min-h-0 w-full max-w-[1800px] mx-auto p-2.5 sm:p-3 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
