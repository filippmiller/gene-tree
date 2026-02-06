"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import SearchResults, { type SearchResult } from "./SearchResults";

const RECENT_SEARCHES_KEY = "gene-tree-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches on open
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Reset state on close
      setQuery("");
      setResults([]);
      setActiveIndex(-1);
    }
  }, [open]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchResults = async () => {
      setLoading(true);
      try {
        const hasSpace = debouncedQuery.includes(" ");
        const mode = hasSpace ? "fullname" : "single";
        const res = await fetch(
          `/api/profiles/search?q=${encodeURIComponent(debouncedQuery)}&limit=10&mode=${mode}`,
          { signal: abortController.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    return () => abortController.abort();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (query.length >= 2) saveRecentSearch(query);
      onOpenChange(false);
      router.push(`/${locale}/profile/${result.id}`);
    },
    [query, locale, router, onOpenChange]
  );

  const handleRecentClick = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < results.length && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [results, activeIndex, handleSelect, onOpenChange]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  if (!open) return null;

  const showRecent = query.length < 2 && recentSearches.length > 0;
  // Show loading when user is typing but debounce hasn't fired yet
  const isSearchPending = query.length >= 2 && (loading || query !== debouncedQuery);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("placeholder")}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Search panel */}
      <div
        className={cn(
          "relative mx-auto mt-[15vh] w-full max-w-lg",
          "rounded-2xl border border-border/30",
          "bg-card/95 backdrop-blur-xl",
          "shadow-elevation-5",
          "animate-in fade-in-0 slide-in-from-top-4 duration-200",
          // Mobile: full-width with margins
          "max-sm:mt-4 max-sm:mx-3 max-sm:max-w-none"
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/20">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            maxLength={100}
            className={cn(
              "flex-1 h-14 bg-transparent text-sm",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none"
            )}
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div id="search-results" className="max-h-[60vh] max-sm:max-h-[70vh] overflow-y-auto">
          {/* Recent searches */}
          {showRecent && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("recentSearches")}
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("clearRecent")}
                </button>
              </div>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => handleRecentClick(q)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {query.length >= 2 && (
            <SearchResults
              ref={resultsRef}
              results={results}
              loading={isSearchPending}
              query={debouncedQuery}
              activeIndex={activeIndex}
              onSelect={handleSelect}
            />
          )}

          {/* Hint when empty */}
          {query.length < 2 && !showRecent && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("hint")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-border/20 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-medium">↑↓</kbd>
            {t("navigate")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-medium">↵</kbd>
            {t("open")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 font-medium">esc</kbd>
            {t("close")}
          </span>
        </div>
      </div>
    </div>
  );
}
