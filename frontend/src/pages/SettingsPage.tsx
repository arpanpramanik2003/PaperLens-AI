import { motion } from "framer-motion";
import { User, Key, Palette, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const ease = [0.2, 0, 0, 1] as const;

export default function SettingsPage() {
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
                <Input defaultValue="Alex Chen" className="bg-secondary/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input defaultValue="alex@university.edu" className="bg-secondary/50 border-border/50" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Institution</label>
              <Input defaultValue="Stanford University" className="bg-secondary/50 border-border/50" />
            </div>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Save Changes</Button>
          </div>
        </motion.div>

        {/* API */}
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">API Settings</h2>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">API Key</label>
            <div className="flex gap-2">
              <Input defaultValue="sk-••••••••••••••••••••••" readOnly className="bg-secondary/50 border-border/50 font-mono text-sm" />
              <Button variant="outline" size="sm">Regenerate</Button>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          className="rounded-xl border border-border/50 bg-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease }}
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
