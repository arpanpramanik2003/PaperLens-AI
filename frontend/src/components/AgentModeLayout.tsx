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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Professional Agent Header */}
      <header className="h-16 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg border-border/70"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Agent Mode
          </Button>

          <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border/60">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">
                Agent Mode
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5 border-border/70">
                Autonomous Research
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-border/70"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
