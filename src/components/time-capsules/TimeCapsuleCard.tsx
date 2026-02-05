'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  Lock,
  Mail,
  MoreHorizontal,
  Trash2,
  Edit,
  Calendar,
  User,
  Clock,
  Play,
  Image as ImageIcon,
  Mic,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlassCard } from '@/components/ui/glass-card';
import {
  type TimeCapsuleWithProfiles,
  isSealed,
  isDelivered,
  getTimeUntilDelivery,
} from '@/lib/time-capsules/types';

interface TimeCapsuleCardProps {
  capsule: TimeCapsuleWithProfiles;
  locale: string;
  currentUserId: string;
  onOpen?: (capsule: TimeCapsuleWithProfiles) => void;
  onEdit?: (capsule: TimeCapsuleWithProfiles) => void;
  onDelete?: (capsule: TimeCapsuleWithProfiles) => void;
}

export default function TimeCapsuleCard({
  capsule,
  locale,
  currentUserId,
  onOpen,
  onEdit,
  onDelete,
}: TimeCapsuleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dateLocale = locale === 'ru' ? ru : enUS;

  const sealed = isSealed(capsule);
  const delivered = isDelivered(capsule);
  const isCreator = capsule.created_by === currentUserId;
  const isRecipient = capsule.recipient_profile_id === currentUserId;
  const timeUntil = getTimeUntilDelivery(capsule);

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

  const getMediaIcon = () => {
    switch (capsule.media_type) {
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const t = locale === 'ru' ? {
    sealedUntil: 'Откроется',
    deliveredOn: 'Доставлено',
    from: 'От',
    to: 'Кому',
    toFamily: 'Всей семье',
    daysUntil: 'дней до открытия',
    open: 'Открыть',
    edit: 'Редактировать',
    delete: 'Удалить',
    hasMedia: 'Есть вложение',
  } : {
    sealedUntil: 'Opens on',
    deliveredOn: 'Delivered on',
    from: 'From',
    to: 'To',
    toFamily: 'My Family',
    daysUntil: 'days until delivery',
    open: 'Open',
    edit: 'Edit',
    delete: 'Delete',
    hasMedia: 'Has attachment',
  };

  // Sealed capsule - wax seal design
  if (sealed && !isCreator) {
    // Recipient sees sealed state
    return (
      <GlassCard glass="tinted" padding="md" className="overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {t.sealedUntil} {formatDateStr(capsule.scheduled_delivery_date)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {timeUntil.days} {t.daysUntil}
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Creator's view of sealed capsule OR delivered capsule
  const cardGradient = sealed
    ? 'from-amber-500 to-orange-600'
    : 'from-violet-500 to-purple-600';

  const shadowColor = sealed
    ? 'shadow-amber-500/25'
    : 'shadow-violet-500/25';

  return (
    <GlassCard
      glass={delivered ? 'medium' : 'tinted'}
      hover={delivered ? 'lift' : 'none'}
      padding="md"
      className={`overflow-hidden cursor-pointer transition-all ${delivered ? 'hover:ring-2 hover:ring-violet-500/20' : ''}`}
      onClick={() => delivered && onOpen?.(capsule)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cardGradient} flex items-center justify-center text-white shadow-lg ${shadowColor}`}
          >
            {sealed ? <Lock className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
          </div>

          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {capsule.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {sealed
                ? `${t.sealedUntil} ${formatDateStr(capsule.scheduled_delivery_date)}`
                : `${t.deliveredOn} ${formatDateStr(capsule.delivered_at!)}`}
            </p>
          </div>
        </div>

        {/* Actions Menu (only for creator before delivery) */}
        {isCreator && sealed && (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-2">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit?.(capsule);
                }}
              >
                <Edit className="w-4 h-4" />
                {t.edit}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete?.(capsule);
                }}
              >
                <Trash2 className="w-4 h-4" />
                {t.delete}
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Recipient Info */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        {isCreator && (
          <>
            <span>{t.to}:</span>
            {capsule.recipient ? (
              <>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={capsule.recipient.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(capsule.recipient.first_name, capsule.recipient.last_name)}
                  </AvatarFallback>
                </Avatar>
                <span>{capsule.recipient.first_name} {capsule.recipient.last_name}</span>
              </>
            ) : (
              <span className="italic">{t.toFamily}</span>
            )}
          </>
        )}

        {isRecipient && delivered && (
          <>
            <span>{t.from}:</span>
            <Avatar className="w-5 h-5">
              <AvatarImage src={capsule.creator.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(capsule.creator.first_name, capsule.creator.last_name)}
              </AvatarFallback>
            </Avatar>
            <span>{capsule.creator.first_name} {capsule.creator.last_name}</span>
          </>
        )}

        {/* Media indicator */}
        {capsule.media_type && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            {getMediaIcon()}
            {t.hasMedia}
          </span>
        )}
      </div>

      {/* Preview (only for delivered or creator) */}
      {(delivered || isCreator) && capsule.message && (
        <p className="text-foreground/80 text-sm line-clamp-2 mb-4">
          {capsule.message}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {locale === 'ru' ? 'Создано' : 'Created'} {formatRelativeTime(capsule.created_at)}
          </span>
        </div>

        {delivered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(capsule);
            }}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            {t.open}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
