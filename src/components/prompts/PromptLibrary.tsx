"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptCard, type StoryPrompt, categoryConfig } from "./PromptCard";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";

export interface PromptLibraryProps extends React.HTMLAttributes<HTMLDivElement> {
  prompts: StoryPrompt[];
  onAssign?: (prompt: StoryPrompt) => void;
  onAnswer?: (prompt: StoryPrompt) => void;
}

export function PromptLibrary({
  prompts,
  onAssign,
  onAnswer,
  className,
  ...props
}: PromptLibraryProps) {
  const locale = useLocale() as "en" | "ru";
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");

  // Filter prompts based on search and category
  const filteredPrompts = React.useMemo(() => {
    let filtered = prompts;

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.prompt_text.toLowerCase().includes(query) ||
          p.prompt_text_ru?.toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [prompts, activeCategory, searchQuery]);

  // Group by category for "all" view
  const byCategory = React.useMemo(() => {
    const grouped: Record<string, StoryPrompt[]> = {};
    for (const prompt of filteredPrompts) {
      if (!grouped[prompt.category]) {
        grouped[prompt.category] = [];
      }
      grouped[prompt.category].push(prompt);
    }
    return grouped;
  }, [filteredPrompts]);

  // Get unique categories from prompts
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    for (const prompt of prompts) {
      cats.add(prompt.category);
    }
    return Array.from(cats);
  }, [prompts]);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {locale === "ru" ? "Вопросы для историй" : "Story Prompts"}
          </h2>
          <p className="text-muted-foreground">
            {locale === "ru"
              ? "Выберите вопрос, чтобы записать историю или спросить родственника"
              : "Choose a prompt to record a story or ask a family member"}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ru" ? "Поиск..." : "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
          >
            {locale === "ru" ? "Все" : "All"} ({prompts.length})
          </TabsTrigger>
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const count = prompts.filter((p) => p.category === cat).length;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-violet-500 data-[state=active]:text-white"
              >
                {config?.label[locale] || cat} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* All prompts view */}
        <TabsContent value="all" className="mt-6">
          {Object.keys(byCategory).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {locale === "ru" ? "Ничего не найдено" : "No prompts found"}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(byCategory).map(([category, categoryPrompts]) => {
                const config = categoryConfig[category];
                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4">
                      {config?.label[locale] || category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onAssign={onAssign}
                          onAnswer={onAnswer}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Category-specific views */}
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-6">
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {locale === "ru" ? "Ничего не найдено" : "No prompts found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onAssign={onAssign}
                    onAnswer={onAnswer}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
