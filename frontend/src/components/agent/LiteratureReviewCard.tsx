import React from "react";
import { BookOpen, Search, ArrowUpDown, Filter, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LiteratureReviewCardProps {
  papers: any[];
  filteredPapers: any[];
  paperSearchQuery: string;
  setPaperSearchQuery: (q: string) => void;
  sortOrder: "newest" | "oldest" | "highest" | "lowest";
  setSortOrder: (order: "newest" | "oldest" | "highest" | "lowest") => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  yearwiseCounts: { year: number; count: number }[];
  renderTextOrObject: (val: any) => string;
  sectionIndex?: number;
}

export const LiteratureReviewCard: React.FC<LiteratureReviewCardProps> = ({
  papers,
  filteredPapers,
  paperSearchQuery,
  setPaperSearchQuery,
  sortOrder,
  setSortOrder,
  selectedYear,
  setSelectedYear,
  yearwiseCounts,
  renderTextOrObject,
  sectionIndex = 1,
}) => {
  return (
    <Card className="p-5 border border-border/70 bg-card shadow-sm space-y-4 rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {sectionIndex}. Literature Review & Academic Papers
          </h3>
          <Badge variant="outline" className="text-[11px] font-mono bg-secondary/60 text-muted-foreground border-border/60">
            {papers.length} Papers
          </Badge>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search paper title/venue..."
              value={paperSearchQuery}
              onChange={(e) => setPaperSearchQuery(e.target.value)}
              className="h-8 w-44 pl-8 text-xs bg-background border-border/70 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1 bg-secondary/40 px-2 py-1 rounded-lg border border-border/60 text-xs">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer pr-1 font-sans"
            >
              <option value="newest" className="bg-card text-foreground">Newest First</option>
              <option value="oldest" className="bg-card text-foreground">Oldest First</option>
              <option value="highest" className="bg-card text-foreground">Most Citations</option>
              <option value="lowest" className="bg-card text-foreground">Least Citations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Year Filter Chips */}
      {yearwiseCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Year:
          </span>
          <button
            onClick={() => setSelectedYear("all")}
            className={`text-xs px-2.5 py-0.5 rounded-md border transition-all ${
              selectedYear === "all"
                ? "bg-indigo-600 text-white border-indigo-600 font-medium"
                : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            All ({papers.length})
          </button>

          {yearwiseCounts.map((yb) => (
            <button
              key={yb.year}
              onClick={() => setSelectedYear(String(yb.year))}
              className={`text-xs px-2.5 py-0.5 rounded-md border transition-all ${
                selectedYear === String(yb.year)
                  ? "bg-indigo-600 text-white border-indigo-600 font-medium"
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              {yb.year} ({yb.count})
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Container for Discovered Papers */}
      {filteredPapers.length > 0 ? (
        <div className="max-h-[480px] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
          {filteredPapers.map((paper, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-secondary/15 border border-border/60 hover:border-indigo-500/30 transition-all space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground leading-snug">{renderTextOrObject(paper.title)}</h4>
                {paper.url && (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex-shrink-0" title="Open paper link">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
                {paper.year && <span className="bg-secondary px-1.5 py-0.5 rounded border border-border/40 font-medium">Year {paper.year}</span>}
                {paper.venue && <span className="truncate max-w-[160px]">• {renderTextOrObject(paper.venue)}</span>}
                {paper.citation_count !== undefined && <span className="text-indigo-400 font-medium">• {paper.citation_count} Citations</span>}
              </div>

              {paper.summary && (
                <p className="text-muted-foreground text-[11px] line-clamp-3 leading-relaxed">
                  {renderTextOrObject(paper.summary)}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed py-6 text-center">
          No papers match the current filter criteria.
        </p>
      )}
    </Card>
  );
};
