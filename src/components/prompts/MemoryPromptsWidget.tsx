"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { MemoryPromptCard } from "./MemoryPromptCard";
import type { DailyPromptResponse, PromptCategory, PlaceholderType, Season } from "@/types/prompts";
import { toast } from "sonner";

interface MemoryPromptsWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Profile context for relationship-specific prompts
   */
  contextProfileId?: string;

  /**
   * Name to substitute in relationship prompts
   */
  contextPersonName?: string;

  /**
   * Relationship type to substitute
   */
  contextRelationship?: string;

  /**
   * Number of prompts to show (1 or 2)
   */
  promptCount?: 1 | 2;

  /**
   * Callback when story creation is triggered
   */
  onCreateStory?: (promptId: string, promptText: string) => void;
}

export function MemoryPromptsWidget({
  contextProfileId,
  contextPersonName,
  contextRelationship,
  promptCount = 1,
  onCreateStory,
  className,
  ...props
}: MemoryPromptsWidgetProps) {
  const locale = useLocale() as "en" | "ru";
  const router = useRouter();

  const [prompts, setPrompts] = React.useState<DailyPromptResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch daily prompt(s)
  const fetchPrompts = React.useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = new URL("/api/memory-prompts/daily", window.location.origin);
      if (contextProfileId) {
        url.searchParams.set("contextProfileId", contextProfileId);
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch prompts");
      }

      if (data.prompt) {
        setPrompts([data.prompt]);
      } else {
        setPrompts([]);
      }
    } catch (err) {
      console.error("Error fetching memory prompts:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contextProfileId]);

  React.useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Handle write story action
  const handleWriteStory = React.useCallback((promptId: string, promptText: string) => {
    if (onCreateStory) {
      onCreateStory(promptId, promptText);
    } else {
      // Navigate to story creation with prompt pre-filled
      const params = new URLSearchParams({
        promptId,
        promptText,
      });
      if (contextProfileId) {
        params.set("subjectId", contextProfileId);
      }
      router.push(`/${locale}/stories/new?${params.toString()}`);
    }
  }, [onCreateStory, contextProfileId, locale, router]);

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

      // Refresh to get next prompt
      await fetchPrompts(true);
    } catch (err) {
      console.error("Error skipping prompt:", err);
      toast.error(locale === "ru" ? "Не удалось пропустить" : "Failed to skip");
      throw err;
    }
  }, [locale, fetchPrompts]);

  // Handle remind later
  const handleRemindLater = React.useCallback(async (promptId: string) => {
    try {
      const res = await fetch(`/api/memory-prompts/${promptId}/remind-later`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set reminder");
      }

      toast.success(
        locale === "ru"
          ? "Напомним через неделю"
          : "We'll remind you in a week"
      );

      // Refresh to get next prompt
      await fetchPrompts(true);
    } catch (err) {
      console.error("Error setting remind later:", err);
      toast.error(
        locale === "ru"
          ? "Не удалось установить напоминание"
          : "Failed to set reminder"
      );
      throw err;
    }
  }, [locale, fetchPrompts]);

  // Build placeholders for relationship prompts
  const getPlaceholders = React.useCallback(() => {
    const placeholders: Record<string, string> = {};

    if (contextPersonName) {
      placeholders.person = contextPersonName;
      placeholders.person_name = contextPersonName;
    }

    if (contextRelationship) {
      placeholders.relationship = contextRelationship;
    }

    return Object.keys(placeholders).length > 0 ? placeholders : undefined;
  }, [contextPersonName, contextRelationship]);

  // Loading state
  if (loading) {
    return (
      <GlassCard glass="medium" padding="lg" className={cn("", className)} {...props}>
        <GlassCardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "ru" ? "Загрузка вопроса..." : "Loading prompt..."}
          </p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // Error or no prompts state
  if (error || prompts.length === 0) {
    return (
      <GlassCard glass="medium" padding="lg" className={cn("", className)} {...props}>
        <GlassCardContent className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {error || (locale === "ru"
              ? "Вы ответили на все вопросы!"
              : "You've answered all prompts!"
            )}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPrompts(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">
                {locale === "ru" ? "Обновить" : "Refresh"}
              </span>
            </Button>
            <Link href={`/${locale}/prompts`}>
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                {locale === "ru" ? "Все вопросы" : "All Prompts"}
              </Button>
            </Link>
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  const placeholders = getPlaceholders();

  return (
    <GlassCard glass="medium" padding="lg" className={cn("", className)} {...props}>
      <GlassCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {locale === "ru" ? "Поделитесь воспоминанием" : "Share a Memory"}
          </GlassCardTitle>

          <Link
            href={`/${locale}/prompts`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {locale === "ru" ? "Все вопросы" : "See all"}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        {prompts.map((prompt) => (
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
              is_new: prompt.is_new,
            }}
            placeholders={placeholders}
            variant="featured"
            onWriteStory={handleWriteStory}
            onSkip={handleSkip}
            onRemindLater={handleRemindLater}
          />
        ))}

        {/* Quick tip */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          {locale === "ru"
            ? "Записывайте истории, чтобы сохранить семейные воспоминания"
            : "Record stories to preserve family memories for generations"
          }
        </p>
      </GlassCardContent>
    </GlassCard>
  );
}

export default MemoryPromptsWidget;
