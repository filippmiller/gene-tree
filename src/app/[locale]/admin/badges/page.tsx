"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  Award,
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
import { BadgeCard, iconMap, rarityConfig, type BadgeData } from "@/components/badges";

export default function AdminBadgesPage() {
  const locale = useLocale() as "en" | "ru";
  const [badges, setBadges] = React.useState<BadgeData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingBadge, setEditingBadge] = React.useState<Partial<BadgeData> | null>(null);
  const [stats, setStats] = React.useState<{ total: number; earnedByUsers: number }>({
    total: 0,
    earnedByUsers: 0,
  });

  // Fetch badges
  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/badges");
      const data = await res.json();
      setBadges(data.badges || []);
      setStats({
        total: data.total || 0,
        earnedByUsers: data.earned || 0,
      });
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBadges();
  }, []);

  // Filter badges
  const filteredBadges = React.useMemo(() => {
    if (!searchQuery.trim()) return badges;
    const query = searchQuery.toLowerCase();
    return badges.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.name_ru?.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
    );
  }, [badges, searchQuery]);

  const handleEdit = (badge: BadgeData) => {
    setEditingBadge(badge);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingBadge({
      name: "",
      name_ru: "",
      description: "",
      description_ru: "",
      icon: "award",
      category: "special",
      criteria_type: "manual",
      criteria_target: null,
      criteria_value: 1,
      rarity: "common",
    });
    setIsEditorOpen(true);
  };

  const categoryLabels: Record<string, { en: string; ru: string }> = {
    tree_builder: { en: "Tree Builder", ru: "Строитель Древа" },
    memory_keeper: { en: "Memory Keeper", ru: "Хранитель Памяти" },
    storyteller: { en: "Storyteller", ru: "Рассказчик" },
    connector: { en: "Connector", ru: "Связующий" },
    special: { en: "Special", ru: "Особые" },
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="w-8 h-8 text-violet-500" />
            {locale === "ru" ? "Управление значками" : "Badge Management"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ru"
              ? "Создавайте и управляйте значками достижений"
              : "Create and manage achievement badges"}
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-violet-500 hover:bg-violet-600">
          <Plus className="w-4 h-4 mr-2" />
          {locale === "ru" ? "Создать значок" : "Create Badge"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Award className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Всего значков" : "Total Badges"}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.earnedByUsers}</p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Получено пользователями" : "Earned by Users"}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard glass="subtle" padding="md">
          <GlassCardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {badges.filter((b) => b.rarity === "legendary").length}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === "ru" ? "Легендарных" : "Legendary"}
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
              {locale === "ru" ? "Все значки" : "All Badges"}
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
                  <TableHead className="w-20">
                    {locale === "ru" ? "Значок" : "Badge"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Название" : "Name"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Категория" : "Category"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Критерий" : "Criteria"}
                  </TableHead>
                  <TableHead>
                    {locale === "ru" ? "Редкость" : "Rarity"}
                  </TableHead>
                  <TableHead className="text-right">
                    {locale === "ru" ? "Действия" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBadges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <BadgeCard badge={badge} earned={true} size="sm" showProgress={false} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{badge.name}</p>
                        {badge.name_ru && (
                          <p className="text-sm text-muted-foreground">{badge.name_ru}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[badge.category]?.[locale] || badge.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {badge.criteria_type === "manual"
                          ? locale === "ru" ? "Ручной" : "Manual"
                          : badge.criteria_type === "exists"
                          ? locale === "ru" ? "Существует" : "Exists"
                          : `${badge.criteria_target}: ${badge.criteria_value}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          badge.rarity === "legendary"
                            ? "bg-amber-100 text-amber-700"
                            : badge.rarity === "rare"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {rarityConfig[badge.rarity]?.label[locale] || badge.rarity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(badge)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
              {editingBadge?.id
                ? locale === "ru"
                  ? "Редактировать значок"
                  : "Edit Badge"
                : locale === "ru"
                ? "Создать значок"
                : "Create Badge"}
            </DialogTitle>
            <DialogDescription>
              {locale === "ru"
                ? "Заполните информацию о значке"
                : "Fill in badge information"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Название (EN)" : "Name (EN)"}</Label>
                <Input
                  value={editingBadge?.name || ""}
                  onChange={(e) =>
                    setEditingBadge((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Название (RU)" : "Name (RU)"}</Label>
                <Input
                  value={editingBadge?.name_ru || ""}
                  onChange={(e) =>
                    setEditingBadge((prev) => ({ ...prev, name_ru: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Категория" : "Category"}</Label>
                <Select
                  value={editingBadge?.category || "special"}
                  onValueChange={(value) =>
                    setEditingBadge((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {labels[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{locale === "ru" ? "Редкость" : "Rarity"}</Label>
                <Select
                  value={editingBadge?.rarity || "common"}
                  onValueChange={(value) =>
                    setEditingBadge((prev) => ({
                      ...prev,
                      rarity: value as "common" | "rare" | "legendary",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">
                      {locale === "ru" ? "Обычный" : "Common"}
                    </SelectItem>
                    <SelectItem value="rare">
                      {locale === "ru" ? "Редкий" : "Rare"}
                    </SelectItem>
                    <SelectItem value="legendary">
                      {locale === "ru" ? "Легендарный" : "Legendary"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Иконка" : "Icon"}</Label>
              <Select
                value={editingBadge?.icon || "award"}
                onValueChange={(value) =>
                  setEditingBadge((prev) => ({ ...prev, icon: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(iconMap).map((iconName) => (
                    <SelectItem key={iconName} value={iconName}>
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Описание (EN)" : "Description (EN)"}</Label>
              <Textarea
                value={editingBadge?.description || ""}
                onChange={(e) =>
                  setEditingBadge((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{locale === "ru" ? "Описание (RU)" : "Description (RU)"}</Label>
              <Textarea
                value={editingBadge?.description_ru || ""}
                onChange={(e) =>
                  setEditingBadge((prev) => ({ ...prev, description_ru: e.target.value }))
                }
                rows={2}
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
