'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, getYear } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Loader2, Filter, ChevronDown, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import MilestoneCard from './MilestoneCard';
import {
  type MilestoneWithProfile,
  type MilestoneCategory,
  MILESTONE_CATEGORIES,
} from '@/lib/milestones/types';

interface MilestoneTimelineProps {
  locale: string;
  currentUserId: string;
  profileId?: string; // If provided, filter by this profile
  onEdit?: (milestone: MilestoneWithProfile) => void;
}

interface GroupedMilestones {
  year: number;
  milestones: MilestoneWithProfile[];
}

export default function MilestoneTimeline({
  locale,
  currentUserId,
  profileId,
  onEdit,
}: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<MilestoneWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const dateLocale = locale === 'ru' ? ru : enUS;

  // Translations
  const t = locale === 'ru' ? {
    loading: 'Загрузка...',
    error: 'Ошибка загрузки',
    retry: 'Повторить',
    empty: 'Событий пока нет',
    emptySubtitle: 'Добавьте первое событие для вашей семьи',
    filter: 'Фильтр',
    allCategories: 'Все категории',
    confirmDelete: 'Удалить это событие?',
    deleteSuccess: 'Событие удалено',
    categories: {
      baby: 'Малыш',
      education: 'Образование',
      career: 'Карьера',
      relationship: 'Отношения',
      life: 'Жизнь',
      custom: 'Другое',
    },
  } : {
    loading: 'Loading...',
    error: 'Failed to load milestones',
    retry: 'Retry',
    empty: 'No milestones yet',
    emptySubtitle: 'Add the first milestone for your family',
    filter: 'Filter',
    allCategories: 'All categories',
    confirmDelete: 'Delete this milestone?',
    deleteSuccess: 'Milestone deleted',
    categories: {
      baby: 'Baby',
      education: 'Education',
      career: 'Career',
      relationship: 'Relationship',
      life: 'Life',
      custom: 'Custom',
    },
  };

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (profileId) params.set('profile_id', profileId);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/milestones?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }

      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [profileId, categoryFilter, t.error]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleDelete = async (milestone: MilestoneWithProfile) => {
    if (!confirm(t.confirmDelete)) return;

    setDeleting(milestone.id);

    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      // Remove from local state
      setMilestones(prev => prev.filter(m => m.id !== milestone.id));
    } catch (err) {
      console.error('Error deleting milestone:', err);
      alert(t.error);
    } finally {
      setDeleting(null);
    }
  };

  // Group milestones by year
  const groupedByYear: GroupedMilestones[] = milestones.reduce((groups, milestone) => {
    const year = getYear(new Date(milestone.milestone_date));
    const existingGroup = groups.find(g => g.year === year);

    if (existingGroup) {
      existingGroup.milestones.push(milestone);
    } else {
      groups.push({ year, milestones: [milestone] });
    }

    return groups;
  }, [] as GroupedMilestones[]);

  // Sort years descending
  groupedByYear.sort((a, b) => b.year - a.year);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchMilestones}>{t.retry}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {t.filter}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <div className="space-y-2">
              <button
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setCategoryFilter('all')}
              >
                {t.allCategories}
              </button>
              {MILESTONE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {t.categories[cat.id as keyof typeof t.categories] || cat.id}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {categoryFilter !== 'all' && (
          <span className="text-sm text-muted-foreground">
            {t.categories[categoryFilter as keyof typeof t.categories] || categoryFilter}
          </span>
        )}
      </div>

      {/* Empty state */}
      {milestones.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 mx-auto mb-4 opacity-50">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-foreground mb-2">{t.empty}</p>
          <p className="text-muted-foreground">{t.emptySubtitle}</p>
        </div>
      )}

      {/* Timeline */}
      {groupedByYear.map(group => (
        <div key={group.year} className="space-y-4">
          {/* Year header */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25">
              {group.year}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-violet-500/50 to-transparent" />
          </div>

          {/* Milestones for this year */}
          <div className="space-y-4 pl-4 border-l-2 border-violet-500/20 ml-8">
            {group.milestones.map(milestone => (
              <div
                key={milestone.id}
                className={`relative ${deleting === milestone.id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[21px] top-6 w-4 h-4 rounded-full bg-violet-500 border-4 border-background" />

                <MilestoneCard
                  milestone={milestone}
                  locale={locale}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
