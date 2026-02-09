'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
  Edit,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlassCard } from '@/components/ui/glass-card';
import {
  type MilestoneWithProfile,
  getMilestoneTypeConfig,
  getCategoryConfig,
} from '@/lib/milestones/types';

interface MilestoneCardProps {
  milestone: MilestoneWithProfile;
  locale: string;
  currentUserId: string;
  onEdit?: (milestone: MilestoneWithProfile) => void;
  onDelete?: (milestone: MilestoneWithProfile) => void;
}

export default function MilestoneCard({
  milestone,
  locale,
  currentUserId,
  onEdit,
  onDelete,
}: MilestoneCardProps) {
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const typeConfig = getMilestoneTypeConfig(milestone.milestone_type);
  const categoryConfig = getCategoryConfig(milestone.category);
  const dateLocale = locale === 'ru' ? ru : enUS;

  const isOwner = milestone.created_by === currentUserId;
  const Icon = typeConfig?.icon || categoryConfig?.icon;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDateStr = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PPP', { locale: dateLocale });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
  };

  // Only show first 3 media items unless expanded
  const displayedMedia = showAllMedia
    ? milestone.media_urls
    : milestone.media_urls.slice(0, 3);
  const hiddenMediaCount = milestone.media_urls.length - 3;

  return (
    <GlassCard glass="subtle" padding="md" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Category/Type Icon */}
          <div
            className={`w-12 h-12 rounded-xl ${categoryConfig?.gradient ? `bg-gradient-to-br ${categoryConfig.gradient}` : 'bg-[#58A6FF]'} flex items-center justify-center text-white`}
          >
            {Icon && <Icon className="w-6 h-6" />}
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {milestone.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateStr(milestone.milestone_date)}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        {isOwner && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-2">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(milestone);
                }}
              >
                <Edit className="w-4 h-4" />
                {locale === 'ru' ? 'Редактировать' : 'Edit'}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(milestone);
                }}
              >
                <Trash2 className="w-4 h-4" />
                {locale === 'ru' ? 'Удалить' : 'Delete'}
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Avatar className="w-6 h-6">
          <AvatarImage src={milestone.profile.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(milestone.profile.first_name, milestone.profile.last_name)}
          </AvatarFallback>
        </Avatar>
        <span>
          {milestone.profile.first_name} {milestone.profile.last_name}
        </span>

        {milestone.remind_annually && (
          <span className="flex items-center gap-1 ml-auto text-amber-600">
            <Bell className="w-3.5 h-3.5" />
            <span className="text-xs">
              {locale === 'ru' ? 'Напоминание' : 'Reminder'}
            </span>
          </span>
        )}
      </div>

      {/* Description */}
      {milestone.description && (
        <p className="text-foreground/80 mb-4 whitespace-pre-wrap">
          {milestone.description}
        </p>
      )}

      {/* Media Gallery */}
      {milestone.media_urls.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2">
            {displayedMedia.map((url, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${url}`}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          {!showAllMedia && hiddenMediaCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setShowAllMedia(true)}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {locale === 'ru'
                ? `Ещё ${hiddenMediaCount} фото`
                : `+${hiddenMediaCount} more`}
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          {milestone.creator && (
            <span>
              {locale === 'ru' ? 'Добавил(а)' : 'Added by'}{' '}
              {milestone.creator.first_name} {milestone.creator.last_name}
            </span>
          )}
        </div>
        <span>{formatRelativeTime(milestone.created_at)}</span>
      </div>
    </GlassCard>
  );
}
