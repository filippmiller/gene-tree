"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { MessageCircle, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";

export interface StoryPrompt {
  id: string;
  category: string;
  prompt_text: string;
  prompt_text_ru: string | null;
  min_age: number | null;
  max_age: number | null;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  usage_count: number;
}

export interface PromptCardProps extends React.HTMLAttributes<HTMLDivElement> {
  prompt: StoryPrompt;
  onAssign?: (prompt: StoryPrompt) => void;
  onAnswer?: (prompt: StoryPrompt) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Category display configuration
 */
const categoryConfig: Record<string, { label: { en: string; ru: string }; color: string }> = {
  childhood: {
    label: { en: "Childhood", ru: "Детство" },
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  },
  traditions: {
    label: { en: "Traditions", ru: "Традиции" },
    color: "bg-[#3FB9A0]/10 text-[#3FB9A0] dark:bg-[#3FB9A0]/10 dark:text-[#3FB9A0]",
  },
  life_lessons: {
    label: { en: "Life Lessons", ru: "Уроки Жизни" },
    color: "bg-[#58A6FF]/10 text-[#58A6FF] dark:bg-[#58A6FF]/10 dark:text-[#58A6FF]",
  },
  historical: {
    label: { en: "Historical", ru: "Исторические" },
    color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  },
  relationships: {
    label: { en: "Relationships", ru: "Отношения" },
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
  career: {
    label: { en: "Career", ru: "Карьера" },
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  personal: {
    label: { en: "Personal", ru: "Личное" },
    color: "bg-[#8B949E]/10 text-[#8B949E] dark:bg-[#8B949E]/10 dark:text-[#8B949E]",
  },
  favorites: {
    label: { en: "Favorites", ru: "Избранное" },
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export function PromptCard({
  prompt,
  onAssign,
  onAnswer,
  showActions = true,
  compact = false,
  className,
  ...props
}: PromptCardProps) {
  const locale = useLocale() as "en" | "ru";

  const text =
    (locale === "ru" && prompt.prompt_text_ru)
      ? prompt.prompt_text_ru
      : prompt.prompt_text;

  const category = categoryConfig[prompt.category] || {
    label: { en: prompt.category, ru: prompt.category },
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg",
          "hover:bg-gray-100 dark:hover:bg-gray-800/50",
          "transition-colors cursor-pointer",
          className
        )}
        onClick={() => onAssign?.(prompt)}
        {...props}
      >
        <MessageCircle className="w-5 h-5 text-[#58A6FF] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm line-clamp-2">{text}</p>
          <span className={cn("inline-block text-xs px-2 py-0.5 rounded mt-1", category.color)}>
            {category.label[locale]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <GlassCard
      glass="subtle"
      hover="lift"
      padding="md"
      className={cn("", className)}
      {...props}
    >
      <GlassCardContent className="space-y-3">
        {/* Category badge */}
        <span className={cn("inline-block text-xs px-2 py-0.5 rounded", category.color)}>
          {category.label[locale]}
        </span>

        {/* Prompt text */}
        <p className="text-base font-medium leading-relaxed">{text}</p>

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
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssign(prompt)}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                {locale === "ru" ? "Спросить кого-то" : "Ask Someone"}
              </Button>
            )}
            {onAnswer && (
              <Button
                size="sm"
                onClick={() => onAnswer(prompt)}
                className="flex-1 bg-[#58A6FF] hover:bg-[#58A6FF]/90 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {locale === "ru" ? "Ответить" : "Answer"}
              </Button>
            )}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

export { categoryConfig };
