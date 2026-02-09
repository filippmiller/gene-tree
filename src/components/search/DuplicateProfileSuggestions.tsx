"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations } from "next-intl";
import { User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "./SearchResults";

interface DuplicateProfileSuggestionsProps {
  firstName: string;
  lastName: string;
}

export default function DuplicateProfileSuggestions({
  firstName,
  lastName,
}: DuplicateProfileSuggestionsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("search");

  const fullName = `${firstName} ${lastName}`.trim();
  const debouncedName = useDebounce(fullName, 500);

  useEffect(() => {
    if (debouncedName.length < 3) {
      setResults([]);
      return;
    }

    const abortController = new AbortController();

    const search = async () => {
      setLoading(true);
      try {
        const hasSpace = debouncedName.includes(" ");
        const mode = hasSpace ? "fullname" : "single";
        const res = await fetch(
          `/api/profiles/search?q=${encodeURIComponent(debouncedName)}&limit=5&mode=${mode}`,
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

    search();
    return () => abortController.abort();
  }, [debouncedName]);

  if (loading || results.length === 0) return null;

  const formatName = (r: SearchResult) => {
    const parts = [r.first_name, r.middle_name, r.last_name].filter(Boolean);
    return parts.join(" ");
  };

  return (
    <div className="rounded-lg border border-[#D29922]/20 bg-[#D29922]/5 dark:border-[#D29922]/20 dark:bg-[#D29922]/5 p-3 space-y-2">
      <p className="text-xs font-medium text-[#D29922] dark:text-[#D29922]">
        {t("duplicateWarning")}
      </p>
      <div className="space-y-1">
        {results.map((result) => (
          <a
            key={result.id}
            href={`/${locale}/profile/${result.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              "hover:bg-[#D29922]/10 dark:hover:bg-[#D29922]/10 transition-colors"
            )}
          >
            {result.avatar_url ? (
              <img
                src={result.avatar_url}
                alt=""
                className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#D29922]/10 dark:bg-[#D29922]/10 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-[#D29922] dark:text-[#D29922]" />
              </div>
            )}
            <span className="font-medium text-[#D29922] dark:text-[#D29922] truncate">
              {formatName(result)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-[#D29922] dark:text-[#D29922] flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
