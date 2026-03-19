import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/clerk-react";

const ease = [0.2, 0, 0, 1] as const;

export default function ProblemGenerator() {
  const { getToken, userId } = useAuth();
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [complexity, setComplexity] = useState("medium");
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!domain.trim()) return;

    setGenerated(false);
    setIdeas([]);

    if (!userId) {
      setLoading(true);
      setTimeout(() => {
        setIdeas([
          { title: "Demo: Cross-Domain Sentiment Transfer", desc: "Develop a model that transfers sentiment capabilites using few-shot adaptation.", tags: ["NLP", "Transfer"], rating: 4 },
          { title: "Demo: Multimodal Paper Understanding", desc: "Build a system that processes text, figures, and tables for deep summaries.", tags: ["Vision", "NLP"], rating: 5 },
          { title: "Demo: Literature Gap Detection", desc: "Use topological graph analysis to spot unexplored zones in citation networks.", tags: ["Graph ML", "Automation"], rating: 4 },
        ]);
        setLoading(false);
        setGenerated(true);
      }, 1500);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("http://localhost:8000/api/generate-problems", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ domain, subdomain, complexity })
      });

      if (!res.ok) throw new Error("Failed to generate ideas");
      const data = await res.json();
      setIdeas(data.ideas || []);
      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate research problems.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Problem Statement Generator</h1>
        <p className="text-sm text-muted-foreground mb-6">Generate research ideas from your domain.</p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-border/50 bg-card p-6 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Domain</label>
            <Input 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., Natural Language Processing" 
              className="bg-secondary/50 border-border/50" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subdomain</label>
            <Input 
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="e.g., Sentiment Analysis" 
              className="bg-secondary/50 border-border/50" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Complexity</label>
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} /> 
          {loading ? "Ideating..." : "Generate Ideas"}
        </Button>
      </motion.div>

      <AnimatePresence>
        {generated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((idea, i) => (
              <motion.div
                key={idea.title + i}
                className="rounded-xl border border-border/50 bg-card p-5 hover:border-accent/30 transition-colors group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < idea.rating ? "fill-accent text-accent" : "text-border"}`} />
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug">{idea.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{idea.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(idea.tags || []).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs group-hover:border-accent/30 group-hover:text-accent transition-colors">
                  Use this idea <ArrowRight className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {!generated && !loading && (
        <div className="text-center py-16">
          <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm text-muted-foreground">Fill in your research domain and generate ideas.</p>
        </div>
      )}
    </div>
  );
}
