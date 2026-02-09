"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { BadgeCard, type BadgeData } from "./BadgeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";

/**
 * Category configuration for badge grouping
 */
const categoryConfig = {
  tree_builder: {
    label: { en: "Tree Builder", ru: "Строитель Древа" },
    icon: "🌱",
  },
  memory_keeper: {
    label: { en: "Memory Keeper", ru: "Хранитель Памяти" },
    icon: "📸",
  },
  storyteller: {
    label: { en: "Storyteller", ru: "Рассказчик" },
    icon: "📖",
  },
  connector: {
    label: { en: "Connector", ru: "Связующий" },
    icon: "🔗",
  },
  special: {
    label: { en: "Special", ru: "Особые" },
    icon: "🎖️",
  },
};

export interface BadgeGridProps extends React.HTMLAttributes<HTMLDivElement> {
  badges: BadgeData[];
  showCategories?: boolean;
  showProgress?: boolean;
  onFeatureToggle?: (badgeId: string, featured: boolean) => void;
}

export function BadgeGrid({
  badges,
  showCategories = true,
  showProgress = true,
  className,
  onFeatureToggle,
  ...props
}: BadgeGridProps) {
  const locale = useLocale() as "en" | "ru";

  // Group badges by category
  const byCategory = React.useMemo(() => {
    const grouped: Record<string, BadgeData[]> = {};
    for (const badge of badges) {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push(badge);
    }
    return grouped;
  }, [badges]);

  // Stats
  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  if (!showCategories) {
    return (
      <div
        className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", className)}
        {...props}
      >
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={badge.earned}
            showProgress={showProgress}
            onFeatureToggle={onFeatureToggle}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Stats header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {locale === "ru" ? "Достижения" : "Achievements"}
          </h2>
          <p className="text-muted-foreground">
            {earnedCount} / {totalCount}{" "}
            {locale === "ru" ? "получено" : "earned"}
          </p>
        </div>
        <div className="text-4xl font-bold text-[#58A6FF]">
          {Math.round((earnedCount / totalCount) * 100)}%
        </div>
      </div>

      {/* Category tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-[#58A6FF] data-[state=active]:text-white"
          >
            {locale === "ru" ? "Все" : "All"}
          </TabsTrigger>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-[#58A6FF] data-[state=active]:text-white"
            >
              <span className="mr-1">{config.icon}</span>
              {config.label[locale]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All badges */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {Object.entries(byCategory).map(([category, categoryBadges]) => {
              const config =
                categoryConfig[category as keyof typeof categoryConfig];
              return (
                <GlassCard key={category} glass="subtle" padding="md">
                  <GlassCardHeader className="mb-4">
                    <GlassCardTitle className="flex items-center gap-2">
                      <span>{config?.icon}</span>
                      {config?.label[locale] || category}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({categoryBadges.filter((b) => b.earned).length}/
                        {categoryBadges.length})
                      </span>
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {categoryBadges.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          earned={badge.earned}
                          showProgress={showProgress}
                          onFeatureToggle={onFeatureToggle}
                        />
                      ))}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
        </TabsContent>

        {/* Category-specific views */}
        {Object.entries(categoryConfig).map(([key, config]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <GlassCard glass="subtle" padding="md">
              <GlassCardHeader className="mb-4">
                <GlassCardTitle className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  {config.label[locale]}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                {byCategory[key] && byCategory[key].length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {byCategory[key].map((badge) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        earned={badge.earned}
                        showProgress={showProgress}
                        onFeatureToggle={onFeatureToggle}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {locale === "ru"
                      ? "В этой категории пока нет значков"
                      : "No badges in this category yet"}
                  </p>
                )}
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export { categoryConfig };
