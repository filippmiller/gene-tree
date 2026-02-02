"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import {
  MessageCircle,
  PenLine,
  SkipForward,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Snowflake,
  Sun,
  Heart,
  Users,
  Gift,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  PromptCategory,
  PlaceholderType,
  Season,
  LocalizedPrompt,
} from "@/types/prompts";
import {
  getLocalizedPromptText,
  substitutePromptPlaceholders,
  CATEGORY_LABELS,
  SEASON_LABELS,
} from "@/types/prompts";

/**
 * Category visual configuration
 */
const categoryConfig: Record<PromptCategory, {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}> = {
  childhood: {
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    icon: Baby,
    gradient: "from-sky-500/10 to-transparent",
  },
  family: {
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: Users,
    gradient: "from-emerald-500/10 to-transparent",
  },
  traditions: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Gift,
    gradient: "from-amber-500/10 to-transparent",
  },
  seasonal: {
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: Sparkles,
    gradient: "from-violet-500/10 to-transparent",
  },
  relationship: {
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    icon: Heart,
    gradient: "from-pink-500/10 to-transparent",
  },
};

/**
 * Season icons
 */
const seasonIcons: Record<NonNullable<Season>, React.ComponentType<{ className?: string }>> = {
  winter: Snowflake,
  spring: Sparkles,
  summer: Sun,
  fall: Sparkles,
};

export interface MemoryPromptCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Prompt data
   */
  prompt: {
    prompt_id: string;
    prompt_en: string;
    prompt_ru: string;
    category: PromptCategory;
    placeholder_type: PlaceholderType;
    is_seasonal: boolean;
    season: Season;
    is_new?: boolean;
  };

  /**
   * Placeholders for dynamic prompts
   * e.g., { person: "Grandma", relationship: "grandmother" }
   */
  placeholders?: Record<string, string>;

  /**
   * Called when user wants to write a story
   */
  onWriteStory?: (promptId: string, promptText: string) => void;

  /**
   * Called when user skips the prompt
   */
  onSkip?: (promptId: string) => Promise<void>;

  /**
   * Called when user clicks "Remind me later"
   */
  onRemindLater?: (promptId: string) => Promise<void>;

  /**
   * Show actions (write/skip/remind)
   */
  showActions?: boolean;

  /**
   * Display mode
   */
  variant?: "default" | "compact" | "featured";

  /**
   * Is this prompt answered
   */
  isAnswered?: boolean;
}

export function MemoryPromptCard({
  prompt,
  placeholders,
  onWriteStory,
  onSkip,
  onRemindLater,
  showActions = true,
  variant = "default",
  isAnswered = false,
  className,
  ...props
}: MemoryPromptCardProps) {
  const locale = useLocale() as "en" | "ru";
  const t = useTranslations("prompts");

  const [actionLoading, setActionLoading] = React.useState<"skip" | "remind" | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = React.useState(false);

  // Get localized text
  const rawText = getLocalizedPromptText(prompt, locale);

  // Apply placeholders if needed
  const promptText = placeholders
    ? substitutePromptPlaceholders(rawText, placeholders)
    : rawText;

  // Get category config
  const catConfig = categoryConfig[prompt.category];
  const CategoryIcon = catConfig.icon;

  // Get season icon if seasonal
  const SeasonIcon = prompt.is_seasonal && prompt.season
    ? seasonIcons[prompt.season]
    : null;

  // Handle skip with confirmation
  const handleSkip = async () => {
    if (!onSkip) return;

    setActionLoading("skip");
    try {
      await onSkip(prompt.prompt_id);
    } catch (error) {
      console.error("Failed to skip prompt:", error);
    } finally {
      setActionLoading(null);
      setSkipConfirmOpen(false);
    }
  };

  // Handle remind later
  const handleRemindLater = async () => {
    if (!onRemindLater) return;

    setActionLoading("remind");
    try {
      await onRemindLater(prompt.prompt_id);
    } catch (error) {
      console.error("Failed to set remind later:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle write story
  const handleWriteStory = () => {
    onWriteStory?.(prompt.prompt_id, promptText);
  };

  // Compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          "hover:bg-muted/50 transition-colors",
          isAnswered && "opacity-60",
          className
        )}
        {...props}
      >
        <CategoryIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm line-clamp-2">{promptText}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-block text-xs px-2 py-0.5 rounded", catConfig.color)}>
              {CATEGORY_LABELS[prompt.category][locale]}
            </span>
            {isAnswered && (
              <Badge variant="outline" className="text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {locale === "ru" ? "Отвечено" : "Answered"}
              </Badge>
            )}
          </div>
        </div>
        {showActions && !isAnswered && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleWriteStory}
            className="flex-shrink-0"
          >
            <PenLine className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Featured variant
  if (variant === "featured") {
    return (
      <GlassCard
        glass="frosted"
        padding="lg"
        className={cn(
          "relative overflow-hidden",
          isAnswered && "opacity-60",
          className
        )}
        {...props}
      >
        {/* Decorative gradient */}
        <div className={cn(
          "absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20",
          `bg-gradient-to-bl ${catConfig.gradient}`
        )} />

        {/* Season badge for seasonal prompts */}
        {prompt.is_seasonal && prompt.season && SeasonIcon && (
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              <SeasonIcon className="w-3 h-3 mr-1" />
              {SEASON_LABELS[prompt.season][locale]}
            </Badge>
          </div>
        )}

        <GlassCardContent className="relative space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              catConfig.color
            )}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {locale === "ru" ? "Воспоминание дня" : "Memory of the Day"}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-2 py-0.5 rounded", catConfig.color)}>
                  {CATEGORY_LABELS[prompt.category][locale]}
                </span>
                {prompt.is_new && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {locale === "ru" ? "Новый" : "New"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Prompt text */}
          <p className="text-xl font-medium leading-relaxed">{promptText}</p>

          {/* Actions */}
          {showActions && !isAnswered && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="default"
                onClick={handleWriteStory}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PenLine className="w-4 h-4 mr-2" />
                {locale === "ru" ? "Написать историю" : "Write Story"}
              </Button>

              <div className="flex gap-2">
                <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === "skip" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SkipForward className="w-4 h-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">
                        {locale === "ru" ? "Пропустить" : "Skip"}
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {locale === "ru" ? "Пропустить этот вопрос?" : "Skip this prompt?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {locale === "ru"
                          ? "Вы можете вернуться к нему позже в списке вопросов."
                          : "You can return to it later in the prompts list."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {locale === "ru" ? "Отмена" : "Cancel"}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleSkip}>
                        {locale === "ru" ? "Пропустить" : "Skip"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {onRemindLater && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleRemindLater}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "remind" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {locale === "ru" ? "Напомнить" : "Later"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {isAnswered && (
            <div className="flex items-center gap-2 pt-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">
                {locale === "ru" ? "История записана!" : "Story recorded!"}
              </span>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    );
  }

  // Default variant
  return (
    <GlassCard
      glass="subtle"
      hover="lift"
      padding="md"
      className={cn(
        isAnswered && "opacity-60",
        className
      )}
      {...props}
    >
      <GlassCardContent className="space-y-3">
        {/* Category and season badges */}
        <div className="flex items-center gap-2">
          <span className={cn("inline-block text-xs px-2 py-0.5 rounded", catConfig.color)}>
            {CATEGORY_LABELS[prompt.category][locale]}
          </span>
          {prompt.is_seasonal && prompt.season && SeasonIcon && (
            <Badge variant="outline" className="text-xs">
              <SeasonIcon className="w-3 h-3 mr-1" />
              {SEASON_LABELS[prompt.season][locale]}
            </Badge>
          )}
          {prompt.is_new && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {locale === "ru" ? "Новый" : "New"}
            </Badge>
          )}
        </div>

        {/* Prompt text */}
        <p className="text-base font-medium leading-relaxed">{promptText}</p>

        {/* Actions */}
        {showActions && !isAnswered && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleWriteStory}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PenLine className="w-4 h-4 mr-2" />
              {locale === "ru" ? "Написать" : "Write"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkipConfirmOpen(true)}
              disabled={actionLoading !== null}
            >
              {actionLoading === "skip" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        {isAnswered && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {locale === "ru" ? "Отвечено" : "Answered"}
          </div>
        )}
      </GlassCardContent>

      {/* Skip confirmation dialog */}
      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "ru" ? "Пропустить этот вопрос?" : "Skip this prompt?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "ru"
                ? "Вы можете вернуться к нему позже в списке вопросов."
                : "You can return to it later in the prompts list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "ru" ? "Отмена" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip}>
              {locale === "ru" ? "Пропустить" : "Skip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}

export { categoryConfig as memoryCategoryConfig };
