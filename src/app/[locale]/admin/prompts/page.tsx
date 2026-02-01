"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type StoryPrompt, categoryConfig } from "@/components/prompts";

export default function AdminPromptsPage() {
  const locale = useLocale() as "en" | "ru";
  const [prompts, setPrompts] = React.useState<StoryPrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingPrompt, setEditingPrompt] = React.useState<Partial<StoryPrompt> | null>(
    null
  );

  // Fetch prompts
  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPrompts();
  }, []);

  // Filter prompts
  const filteredPrompts = React.useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const query = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.prompt_text.toLowerCase().includes(query) ||
        p.prompt_text_ru?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [prompts, searchQuery]);

  // Stats
  const stats = React.useMemo(() => {
    const totalUsage = prompts.reduce((sum, p) => sum + (p.usage_count || 0), 0);
    const categories = new Set(prompts.map((p) => p.category)).size;
    return { total: prompts.length, totalUsage, categories };
  }, [prompts]);

  const handleEdit = (prompt: StoryPrompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingPrompt({
      prompt_text: "",
      prompt_text_ru: "",
      category: "childhood",
      min_age: null,
      max_age: null,
      tags: [],
    });
    setIsEditorOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-violet-500" />
            {locale === "ru" ? "Управление вопросами" : "Prompt Management"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ru"
              ? "Создавайте и управляйте вопросами для историй"
              : "Create and manage story prompts"}
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-violet-500 hover:bg-violet-600">
          <Plus className="w-4 h-4 mr-2" />
          {locale === "ru" ? "Создать вопрос" : "Create Prompt"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <MessageCircle className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Всего вопросов" : "Total Prompts"}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsage}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Использований" : "Total Usage"}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.categories}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Категорий" : "Categories"}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Search and Table */}
      <GlassCard glass="medium" padding="md">
        <GlassCardHeader>
          <div className="flex items-center justify-between gap-4">
            <GlassCardTitle>
              {locale === "ru" ? "Все вопросы" : "All Prompts"}
            </GlassCardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={locale === "ru" ? "Поиск..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">
                    {locale === "ru" ? "Вопрос" : "Prompt"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Категория" : "Category"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Возраст" : "Age Range"}
                  </TableHead>
                  <TableHead className="text-center">
                    {locale === "ru" ? "Использований" : "Usage"}
                  </TableHead>
                  <TableHead className="text-right">
                    {locale === "ru" ? "Действия" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrompts.map((prompt) => {
                  const category = categoryConfig[prompt.category];
                  return (
                    <TableRow key={prompt.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">
                            {prompt.prompt_text}
                          </p>
                          {prompt.prompt_text_ru && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {prompt.prompt_text_ru}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={category?.color}>
                          {category?.label[locale] || prompt.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {prompt.min_age || prompt.max_age ? (
                          <span className="text-sm">
                            {prompt.min_age ?? "∞"} - {prompt.max_age ?? "∞"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {locale === "ru" ? "Любой" : "Any"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{prompt.usage_count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(prompt)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt?.id
                ? locale === "ru"
                  ? "Редактировать вопрос"
                  : "Edit Prompt"
                : locale === "ru"
                ? "Создать вопрос"
                : "Create Prompt"}
            </DialogTitle>
            <DialogDescription>
              {locale === "ru"
                ? "Заполните информацию о вопросе"
                : "Fill in prompt information"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{locale === "ru" ? "Вопрос (EN)" : "Prompt (EN)"}</Label>
              <Textarea
                value={editingPrompt?.prompt_text || ""}
                onChange={(e) =>
                  setEditingPrompt((prev) => ({
                    ...prev,
                    prompt_text: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Вопрос (RU)" : "Prompt (RU)"}</Label>
              <Textarea
                value={editingPrompt?.prompt_text_ru || ""}
                onChange={(e) =>
                  setEditingPrompt((prev) => ({
                    ...prev,
                    prompt_text_ru: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Категория" : "Category"}</Label>
              <Select
                value={editingPrompt?.category || "childhood"}
                onValueChange={(value) =>
                  setEditingPrompt((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Мин. возраст" : "Min Age"}</Label>
                <Input
                  type="number"
                  value={editingPrompt?.min_age || ""}
                  onChange={(e) =>
                    setEditingPrompt((prev) => ({
                      ...prev,
                      min_age: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder={locale === "ru" ? "Любой" : "Any"}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Макс. возраст" : "Max Age"}</Label>
                <Input
                  type="number"
                  value={editingPrompt?.max_age || ""}
                  onChange={(e) =>
                    setEditingPrompt((prev) => ({
                      ...prev,
                      max_age: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder={locale === "ru" ? "Любой" : "Any"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Теги (через запятую)" : "Tags (comma-separated)"}</Label>
              <Input
                value={editingPrompt?.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditingPrompt((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="memories, childhood, family"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              {locale === "ru" ? "Отмена" : "Cancel"}
            </Button>
            <Button className="bg-violet-500 hover:bg-violet-600">
              {locale === "ru" ? "Сохранить" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
