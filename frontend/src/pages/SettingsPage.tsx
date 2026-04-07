import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Palette, Moon, Bookmark, Trash2, Loader2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">Manage your account and preferences.</p>
      </motion.div>

      <div className="space-y-6">
        {/* Profile */}
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                <Input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50 border-border/50" 
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="bg-secondary/50 border-border/50"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Institution</label>
              <Input 
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="bg-secondary/50 border-border/50"
                placeholder="Enter your institution"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              {saveMessage && (
                <span className="text-sm text-accent">{saveMessage}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Saved Content */}
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Saved Content</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => void fetchSavedItems()} disabled={savedLoading}>
              {savedLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {!userId && (
            <p className="text-sm text-muted-foreground">Log in to view and manage saved items.</p>
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
            <p className="text-sm text-muted-foreground">No saved items yet. Save content from each section to see it here.</p>
          )}

          {userId && !savedLoading && !savedError && groupedSavedItems.length > 0 && (
            <div className="space-y-5">
              {groupedSavedItems.map((group) => (
                <div key={group.section}>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{group.label}</h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground break-words">{item.title}</p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2">{item.summary}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedSavedItem(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleDeleteSavedItem(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Appearance */}
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
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

      <AnimatePresence>
        {selectedSavedItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 sm:p-6 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSavedItem(null)}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl"
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
