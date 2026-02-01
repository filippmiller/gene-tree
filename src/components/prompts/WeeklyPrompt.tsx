"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  MessageCircle,
  Send,
  SkipForward,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import { categoryConfig } from "./PromptCard";

interface WeeklyPromptData {
  prompt_id: string;
  prompt_text: string;
  prompt_text_ru: string | null;
  category: string;
  tags: string[];
  is_new: boolean;
  week_number: number;
  year: number;
}

interface WeeklyPromptProps extends React.HTMLAttributes<HTMLDivElement> {
  onAnswer?: (promptId: string, promptText: string) => void;
  onSkip?: () => void;
}

export function WeeklyPrompt({
  onAnswer,
  onSkip,
  className,
  ...props
}: WeeklyPromptProps) {
  const locale = useLocale() as "en" | "ru";
  const [prompt, setPrompt] = React.useState<WeeklyPromptData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [answered, setAnswered] = React.useState(false);

  const fetchWeeklyPrompt = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prompts/weekly");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch prompt");
      }

      setPrompt(data.prompt);
    } catch (err) {
      console.error("Error fetching weekly prompt:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWeeklyPrompt();
  }, [fetchWeeklyPrompt]);

  const handleSkip = async () => {
    if (!prompt) return;

    setActionLoading(true);
    try {
      await fetch("/api/prompts/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.prompt_id,
          action: "skipped",
        }),
      });

      onSkip?.();
      // Optionally refresh to get a new prompt
      // await fetchWeeklyPrompt();
    } catch (err) {
      console.error("Error skipping prompt:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswer = () => {
    if (!prompt) return;

    const text = (locale === "ru" && prompt.prompt_text_ru)
      ? prompt.prompt_text_ru
      : prompt.prompt_text;

    onAnswer?.(prompt.prompt_id, text);
  };

  // Loading state
  if (loading) {
    return (
      <GlassCard glass="medium" padding="lg" className={cn("", className)} {...props}>
        <GlassCardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "ru" ? "Загрузка..." : "Loading..."}
          </p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // Error state
  if (error || !prompt) {
    return (
      <GlassCard glass="medium" padding="lg" className={cn("", className)} {...props}>
        <GlassCardContent className="flex flex-col items-center justify-center py-8">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {error || (locale === "ru" ? "Нет доступных вопросов" : "No prompts available")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWeeklyPrompt}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {locale === "ru" ? "Попробовать снова" : "Try Again"}
          </Button>
        </GlassCardContent>
      </GlassCard>
    );
  }

  const category = categoryConfig[prompt.category] || {
    label: { en: prompt.category, ru: prompt.category },
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const text = (locale === "ru" && prompt.prompt_text_ru)
    ? prompt.prompt_text_ru
    : prompt.prompt_text;

  return (
    <GlassCard
      glass="medium"
      padding="lg"
      className={cn(
        "relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -mr-16 -mt-16" />

      <GlassCardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-500" />
            {locale === "ru" ? "Вопрос недели" : "Weekly Prompt"}
          </GlassCardTitle>

          <div className="flex items-center gap-2">
            {prompt.is_new && (
              <Badge variant="outline" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200">
                <Sparkles className="w-3 h-3 mr-1" />
                {locale === "ru" ? "Новый" : "New"}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {locale === "ru" ? `Неделя ${prompt.week_number}` : `Week ${prompt.week_number}`}
            </Badge>
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-4">
        {/* Category badge */}
        <span className={cn("inline-block text-xs px-2 py-0.5 rounded", category.color)}>
          {category.label[locale]}
        </span>

        {/* Prompt text */}
        <p className="text-lg font-medium leading-relaxed">{text}</p>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {answered ? (
          <div className="flex items-center gap-2 pt-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">
              {locale === "ru" ? "Ответ записан!" : "Answer submitted!"}
            </span>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={actionLoading}
              className="flex-shrink-0"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4" />
              )}
              <span className="sr-only sm:not-sr-only sm:ml-2">
                {locale === "ru" ? "Пропустить" : "Skip"}
              </span>
            </Button>

            <Button
              size="sm"
              onClick={handleAnswer}
              disabled={actionLoading}
              className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {locale === "ru" ? "Ответить" : "Answer"}
            </Button>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
