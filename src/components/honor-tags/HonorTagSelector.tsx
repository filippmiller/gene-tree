"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Search, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HonorTag } from "./HonorTag";
import type { HonorTag as HonorTagType, HonorTagCategory } from "@/types/honor-tags";
import { honorTagCategories } from "@/types/honor-tags";

export interface HonorTagSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tagId: string) => Promise<void>;
  existingTagIds?: string[];
  profileId: string;
}

/**
 * HonorTagSelector Component
 *
 * Modal dialog for selecting honor tags to add to a profile.
 * Groups tags by category with search functionality.
 */
export function HonorTagSelector({
  open,
  onOpenChange,
  onSelect,
  existingTagIds = [],
  profileId,
}: HonorTagSelectorProps) {
  const locale = useLocale() as "en" | "ru";
  const [tags, setTags] = React.useState<HonorTagType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<HonorTagCategory | "all">("all");
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  // Fetch available tags
  React.useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/honor-tags")
        .then((res) => res.json())
        .then((data) => {
          setTags(data.tags || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching honor tags:", err);
          setLoading(false);
        });
    }
  }, [open]);

  // Filter tags
  const filteredTags = React.useMemo(() => {
    let result = tags;

    // Filter out already added tags
    result = result.filter((tag) => !existingTagIds.includes(tag.id));

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((tag) => tag.category === selectedCategory);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchLower) ||
          tag.name_ru?.toLowerCase().includes(searchLower) ||
          tag.description?.toLowerCase().includes(searchLower) ||
          tag.description_ru?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [tags, existingTagIds, selectedCategory, search]);

  // Group by category
  const groupedTags = React.useMemo(() => {
    const groups: Record<HonorTagCategory, HonorTagType[]> = {} as any;
    filteredTags.forEach((tag) => {
      if (!groups[tag.category]) {
        groups[tag.category] = [];
      }
      groups[tag.category].push(tag);
    });
    return groups;
  }, [filteredTags]);

  const handleSelect = async (tagId: string) => {
    setSubmitting(tagId);
    try {
      await onSelect(tagId);
      // Tag added successfully
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setSubmitting(null);
    }
  };

  const categories = Object.keys(honorTagCategories) as HonorTagCategory[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {locale === "ru" ? "Добавить почесть" : "Add Honor Tag"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ru"
              ? "Выберите награды, звания или отличия для этого профиля"
              : "Select awards, titles, or distinctions for this profile"}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={locale === "ru" ? "Поиск..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            {locale === "ru" ? "Все" : "All"}
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {locale === "ru"
                ? honorTagCategories[category].label_ru
                : honorTagCategories[category].label}
            </Button>
          ))}
        </div>

        {/* Tags list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {locale === "ru"
                ? "Нет доступных тегов"
                : "No tags available"}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {locale === "ru"
                      ? honorTagCategories[category as HonorTagCategory]?.label_ru
                      : honorTagCategories[category as HonorTagCategory]?.label}
                  </h3>
                  <div className="grid gap-2">
                    {categoryTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleSelect(tag.id)}
                        disabled={submitting === tag.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          "hover:bg-accent transition-colors text-left",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: tag.background_color,
                              color: tag.color,
                            }}
                          >
                            {/* Icon placeholder */}
                          </div>
                          <div>
                            <div className="font-medium">
                              {locale === "ru" && tag.name_ru ? tag.name_ru : tag.name}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {locale === "ru" && tag.description_ru
                                ? tag.description_ru
                                : tag.description}
                            </div>
                          </div>
                        </div>
                        {submitting === tag.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
