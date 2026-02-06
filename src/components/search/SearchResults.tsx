"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { User, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface SearchResult {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  maiden_name: string | null;
  avatar_url: string | null;
  similarity_score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  activeIndex: number;
  onSelect: (result: SearchResult) => void;
  className?: string;
}

const SearchResults = forwardRef<HTMLDivElement, SearchResultsProps>(
  ({ results, loading, query, activeIndex, onSelect, className }, ref) => {
    const t = useTranslations("search");

    if (loading) {
      return (
        <div className={cn("flex items-center justify-center py-8", className)}>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">{t("searching")}</span>
        </div>
      );
    }

    if (query.length >= 2 && results.length === 0) {
      return (
        <div className={cn("py-8 text-center", className)}>
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
        </div>
      );
    }

    if (results.length === 0) {
      return null;
    }

    const formatName = (r: SearchResult) => {
      const parts = [r.first_name, r.middle_name, r.last_name].filter(Boolean);
      const name = parts.join(" ");
      if (r.maiden_name) return `${name} (${r.maiden_name})`;
      return name;
    };

    return (
      <div ref={ref} className={cn("overflow-y-auto", className)} role="listbox">
        <div className="px-3 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("profiles")} ({results.length})
          </span>
        </div>
        {results.map((result, index) => (
          <button
            key={result.id}
            id={`search-result-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-left",
              "transition-colors duration-150",
              "hover:bg-muted/50",
              index === activeIndex && "bg-primary/10 text-foreground"
            )}
            onClick={() => onSelect(result)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {result.avatar_url ? (
              <img
                src={result.avatar_url}
                alt=""
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-border/30 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{formatName(result)}</p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {Math.round(result.similarity_score * 100)}%
            </span>
          </button>
        ))}
      </div>
    );
  }
);

SearchResults.displayName = "SearchResults";
export default SearchResults;
