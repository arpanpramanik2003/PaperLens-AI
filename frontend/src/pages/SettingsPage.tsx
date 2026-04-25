import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Palette, Moon, Bookmark, Trash2, Loader2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api-client";
import { showSaveErrorToast, showSaveSuccessToast } from "@/lib/save-toast";

const ease = [0.2, 0, 0, 1] as const;

type SavedItem = {
  id: number;
  section: string;
  title: string;
  summary?: string | null;
  created_at: string;
  payload?: unknown;
};

const SECTION_LABELS: Record<string, string> = {
  experiment_planner: "Experiment Planner",
  problem_generator: "Problem Generator",
  gap_detection: "Gap Detection",
  dataset_benchmark_finder: "Dataset & Benchmark Finder",
  citation_intelligence: "Citation Intelligence",
};

const SECTION_ORDER = [
  "problem_generator",
  "experiment_planner",
  "gap_detection",
  "dataset_benchmark_finder",
  "citation_intelligence",
];

export default function SettingsPage() {
  const { userId, getToken } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedSavedItem, setSelectedSavedItem] = useState<SavedItem | null>(null);

  // Load profile data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setFullName(profile.fullName || "");
      setEmail(profile.email || "");
      setInstitution(profile.institution || "");
    }
  }, []);

  const fetchSavedItems = async () => {
    if (!userId) {
      setSavedItems([]);
      return;
    }

    try {
      setSavedLoading(true);
      setSavedError(null);
      const res = await apiClient.fetch("/api/saved-items", { method: "GET" }, getToken);
      if (!res.ok) throw new Error("Failed to load saved items.");
      const data = await res.json();
      setSavedItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error(error);
      setSavedError("Could not load saved items.");
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    void fetchSavedItems();
  }, [userId]);

  const handleDeleteSavedItem = async (itemId: number) => {
    if (!userId) return;

    try {
      setDeletingId(itemId);
      const res = await apiClient.fetch(
        `/api/saved-items/${itemId}`,
        { method: "DELETE" },
        getToken
      );

      if (!res.ok) throw new Error("Failed to delete item.");
      setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
      showSaveSuccessToast("Saved item removed");
    } catch (error) {
      console.error(error);
      showSaveErrorToast("Saved item removal");
    } finally {
      setDeletingId(null);
    }
  };

  const groupedSavedItems = SECTION_ORDER
    .map((section) => ({
      section,
      label: SECTION_LABELS[section] || section,
      items: savedItems.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        fullName,
        email,
        institution,
      };
      localStorage.setItem("userProfile", JSON.stringify(profileData));
      setSaveMessage("✓ Profile saved successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error) {
      setSaveMessage("✗ Failed to save profile");
      setTimeout(() => setSaveMessage(""), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPayload = (payload: unknown) => {
    try {
      return JSON.stringify(payload ?? {}, null, 2);
    } catch {
      return "Unable to display payload details.";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--card)/0.94)_55%,hsl(var(--accent)/0.08)_100%)] px-6 py-6 sm:px-8 sm:py-7"
      >
        <div className="pointer-events-none absolute -top-24 left-8 h-48 w-48 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/45 px-3 py-1 mb-3">
              <Palette className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">Workspace Preferences</span>
            </div>
            <h1 className="text-3xl sm:text-[2rem] font-semibold tracking-tight mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Manage your profile, review saved work, and keep the interface aligned with the way you work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-border/60 bg-background/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Saved Items</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{savedItems.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Profile</p>
              <p className="mt-2 text-xl font-semibold text-foreground">Ready</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)] gap-6 items-start">
        <div className="space-y-6">
          {/* Profile */}
          <motion.div
            className="rounded-3xl border border-border/60 bg-card/90 p-6 premium-shadow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-secondary/40 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                <p className="text-xs text-muted-foreground">Store the basics you use across saved reports.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-secondary/40 border-border/60 rounded-xl"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="bg-secondary/40 border-border/60 rounded-xl"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Institution</label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="bg-secondary/40 border-border/60 rounded-xl"
                  placeholder="Enter your institution"
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <ShinyButton
                  variant="inline"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="h-9 px-4 rounded-xl"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </ShinyButton>
                {saveMessage && <span className="text-sm text-accent">{saveMessage}</span>}
              </div>
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div
            className="rounded-3xl border border-border/60 bg-card/90 p-6 premium-shadow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-secondary/40 flex items-center justify-center">
                <Palette className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                <p className="text-xs text-muted-foreground">Keep the interface comfortable for long sessions.</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
                </div>
              </div>
              <Switch
                defaultChecked
                onCheckedChange={(checked) => {
                  document.documentElement.classList.toggle("dark", checked);
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Saved Content */}
        <motion.div
          className="rounded-3xl border border-border/60 bg-card/90 p-6 premium-shadow min-h-[520px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-border/60 bg-secondary/40 flex items-center justify-center">
                <Bookmark className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Saved Content</h2>
                <p className="text-xs text-muted-foreground">Review and manage items saved from the tools.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => void fetchSavedItems()} disabled={savedLoading} className="rounded-xl">
              {savedLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {!userId && (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground">Log in to view and manage saved items.</p>
            </div>
          )}

          {userId && savedLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading saved items...
            </div>
          )}

          {userId && savedError && !savedLoading && (
            <p className="text-sm text-destructive">{savedError}</p>
          )}

          {userId && !savedLoading && !savedError && groupedSavedItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">No saved items yet. Save content from each section to see it here.</p>
            </div>
          )}

          {userId && !savedLoading && !savedError && groupedSavedItems.length > 0 && (
            <div className="space-y-5">
              {groupedSavedItems.map((group) => (
                <div key={group.section} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground">{group.label}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-secondary/30 text-muted-foreground">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border/60 bg-secondary/20 p-3.5 flex items-start justify-between gap-3 transition-colors hover:border-accent/25">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground break-words">{item.title}</p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">{item.summary}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={() => setSelectedSavedItem(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                            onClick={() => void handleDeleteSavedItem(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedSavedItem && (
          <motion.div
            className="fixed inset-y-0 right-0 lg:[left:var(--dashboard-sidebar-offset,0px)] z-50 bg-black/50 backdrop-blur-sm p-4 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSavedItem(null)}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl premium-shadow"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.22, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {SECTION_LABELS[selectedSavedItem.section] || selectedSavedItem.section}
                  </p>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground break-words">{selectedSavedItem.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(selectedSavedItem.created_at).toLocaleString()}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setSelectedSavedItem(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="px-5 py-5 space-y-4">
                {selectedSavedItem.summary && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{selectedSavedItem.summary}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Details</p>
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 overflow-x-auto">
                    <pre className="text-xs text-foreground/90 whitespace-pre-wrap break-words">{formatPayload(selectedSavedItem.payload)}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
