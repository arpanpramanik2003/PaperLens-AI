import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Palette, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const ease = [0.2, 0, 0, 1] as const;

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

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
    </div>
  );
}
