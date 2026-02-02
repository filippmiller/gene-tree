"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  BookOpen,
  Baby,
  Users,
  Gift,
  Heart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { MemoryPromptCard } from "./MemoryPromptCard";
import type {
  PromptWithStatus,
  PromptCategory,
  PlaceholderType,
  Season,
  PromptStats,
} from "@/types/prompts";
import { CATEGORY_LABELS } from "@/types/prompts";
import { toast } from "sonner";

type FilterStatus = "all" | "unanswered" | "answered" | "skipped";

interface MemoryPromptsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Callback when story creation is triggered
   */
  onCreateStory?: (promptId: string, promptText: string) => void;
}

const categoryIcons: Record<PromptCategory, React.ComponentType<{ className?: string }>> = {
  childhood: Baby,
  family: Users,
  traditions: Gift,
  seasonal: Sparkles,
  relationship: Heart,
};

export function MemoryPromptsList({
  onCreateStory,
  className,
  ...props
}: MemoryPromptsListProps) {
  const locale = useLocale() as "en" | "ru";
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [prompts, setPrompts] = React.useState<PromptWithStatus[]>([]);
  const [stats, setStats] = React.useState<PromptStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState<PromptCategory | "all">("all");
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch prompts
  const fetchPrompts = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/memory-prompts", window.location.origin);

      if (filterCategory !== "all") {
        url.searchParams.set("category", filterCategory);
      }

      // Always include answered for full list
      url.searchParams.set("includeAnswered", "true");
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch prompts");
      }

      setPrompts(data.prompts || []);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      toast.error(locale === "ru" ? "Не удалось загрузить вопросы" : "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, locale]);

  // Fetch stats
  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/memory-prompts/stats");
      const data = await res.json();

      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchPrompts();
    fetchStats();
  }, [fetchPrompts, fetchStats]);

  // Handle write story
  const handleWriteStory = React.useCallback((promptId: string, promptText: string) => {
    if (onCreateStory) {
      onCreateStory(promptId, promptText);
    } else {
      const params = new URLSearchParams({ promptId, promptText });
      router.push(`/${locale}/stories/new?${params.toString()}`);
    }
  }, [onCreateStory, locale, router]);

  // Handle skip
  const handleSkip = React.useCallback(async (promptId: string) => {
    try {
      const res = await fetch(`/api/memory-prompts/${promptId}/skip`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to skip prompt");
      }

      toast.success(locale === "ru" ? "Вопрос пропущен" : "Prompt skipped");

      // Update local state
      setPrompts((prev) =>
        prev.map((p) =>
          p.prompt_id === promptId ? { ...p, is_skipped: true } : p
        )
      );
      fetchStats();
    } catch (err) {
      console.error("Error skipping prompt:", err);
      toast.error(locale === "ru" ? "Не удалось пропустить" : "Failed to skip");
      throw err;
    }
  }, [locale, fetchStats]);

  // Filter prompts
  const filteredPrompts = React.useMemo(() => {
    let result = prompts;

    // Filter by status
    if (filterStatus === "unanswered") {
      result = result.filter((p) => !p.is_answered && !p.is_skipped);
    } else if (filterStatus === "answered") {
      result = result.filter((p) => p.is_answered);
    } else if (filterStatus === "skipped") {
      result = result.filter((p) => p.is_skipped && !p.is_answered);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.prompt_en.toLowerCase().includes(query) ||
          p.prompt_ru.toLowerCase().includes(query)
      );
    }

    return result;
  }, [prompts, filterStatus, searchQuery]);

  // Group prompts by category for display
  const groupedPrompts = React.useMemo(() => {
    const groups: Record<PromptCategory, PromptWithStatus[]> = {
      childhood: [],
      family: [],
      traditions: [],
      seasonal: [],
      relationship: [],
    };

    filteredPrompts.forEach((p) => {
      if (groups[p.category as PromptCategory]) {
        groups[p.category as PromptCategory].push(p);
      }
    });

    return groups;
  }, [filteredPrompts]);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard glass="subtle" padding="md">
            <GlassCardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_prompts}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "ru" ? "Всего вопросов" : "Total Prompts"}
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard glass="subtle" padding="md">
            <GlassCardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.answered_count}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "ru" ? "Отвечено" : "Answered"}
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard glass="subtle" padding="md">
            <GlassCardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending_count}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "ru" ? "Ожидают" : "Pending"}
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard glass="subtle" padding="md">
            <GlassCardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.skipped_count}</p>
                <p className="text-xs text-muted-foreground">
                  {locale === "ru" ? "Пропущено" : "Skipped"}
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* Filters */}
      <GlassCard glass="subtle" padding="md">
        <GlassCardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={locale === "ru" ? "Поиск вопросов..." : "Search prompts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category filter */}
            <Select
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v as PromptCategory | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={locale === "ru" ? "Категория" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ru" ? "Все категории" : "All Categories"}
                </SelectItem>
                {(Object.keys(CATEGORY_LABELS) as PromptCategory[]).map((cat) => {
                  const Icon = categoryIcons[cat];
                  return (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {CATEGORY_LABELS[cat][locale]}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Status tabs */}
          <Tabs
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as FilterStatus)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                {locale === "ru" ? "Все" : "All"}
              </TabsTrigger>
              <TabsTrigger value="unanswered">
                {locale === "ru" ? "Новые" : "New"}
              </TabsTrigger>
              <TabsTrigger value="answered">
                {locale === "ru" ? "Отвечено" : "Answered"}
              </TabsTrigger>
              <TabsTrigger value="skipped">
                {locale === "ru" ? "Пропущено" : "Skipped"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </GlassCardContent>
      </GlassCard>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Prompts grouped by category */}
      {!loading && (
        <div className="space-y-8">
          {filterCategory === "all" ? (
            // Show all categories with headers
            (Object.entries(groupedPrompts) as [PromptCategory, PromptWithStatus[]][])
              .filter(([, items]) => items.length > 0)
              .map(([category, items]) => {
                const Icon = categoryIcons[category];
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">
                        {CATEGORY_LABELS[category][locale]}
                      </h2>
                      <Badge variant="outline" className="ml-2">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((prompt) => (
                        <MemoryPromptCard
                          key={prompt.prompt_id}
                          prompt={{
                            prompt_id: prompt.prompt_id,
                            prompt_en: prompt.prompt_en,
                            prompt_ru: prompt.prompt_ru,
                            category: prompt.category as PromptCategory,
                            placeholder_type: prompt.placeholder_type as PlaceholderType,
                            is_seasonal: prompt.is_seasonal,
                            season: prompt.season as Season,
                          }}
                          variant="default"
                          isAnswered={prompt.is_answered}
                          onWriteStory={handleWriteStory}
                          onSkip={!prompt.is_answered && !prompt.is_skipped ? handleSkip : undefined}
                          showActions={!prompt.is_answered}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
          ) : (
            // Show single category
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <MemoryPromptCard
                  key={prompt.prompt_id}
                  prompt={{
                    prompt_id: prompt.prompt_id,
                    prompt_en: prompt.prompt_en,
                    prompt_ru: prompt.prompt_ru,
                    category: prompt.category as PromptCategory,
                    placeholder_type: prompt.placeholder_type as PlaceholderType,
                    is_seasonal: prompt.is_seasonal,
                    season: prompt.season as Season,
                  }}
                  variant="default"
                  isAnswered={prompt.is_answered}
                  onWriteStory={handleWriteStory}
                  onSkip={!prompt.is_answered && !prompt.is_skipped ? handleSkip : undefined}
                  showActions={!prompt.is_answered}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredPrompts.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="mt-4 text-muted-foreground">
                {locale === "ru"
                  ? "Нет вопросов по выбранным фильтрам"
                  : "No prompts match your filters"
                }
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterStatus("all");
                  setSearchQuery("");
                }}
              >
                {locale === "ru" ? "Сбросить фильтры" : "Reset Filters"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MemoryPromptsList;
