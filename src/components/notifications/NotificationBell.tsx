'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell, BellRing, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NotificationRow {
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  notification: {
    id: string;
    event_type: string;
    actor_profile_id: string;
    primary_profile_id: string | null;
    related_profile_id: string | null;
    payload: Record<string, unknown>;
    created_at: string;
  };
}

interface ApiResponse {
  notifications: NotificationRow[];
}

/**
 * Formats notification text based on event type and payload
 * Supports both English and Russian locales
 */
function formatNotificationText(row: NotificationRow, locale: string): string {
  const { event_type, payload } = row.notification;
  const isRu = locale === 'ru';

  switch (event_type) {
    case 'relative_added': {
      const first = payload?.first_name as string | undefined;
      const last = payload?.last_name as string | undefined;
      const rel = payload?.relationship_type as string | undefined;
      const name = [first, last].filter(Boolean).join(' ');
      if (isRu) {
        return name && rel
          ? `Новый родственник: ${name} (${rel})`
          : 'Добавлен новый родственник';
      }
      return name && rel
        ? `New relative: ${name} (${rel})`
        : 'New relative added';
    }
    case 'media_added': {
      const mediaType = payload?.media_type as string | undefined;
      if (mediaType === 'video') {
        return isRu ? 'Добавлено новое видео' : 'New video added';
      }
      return isRu ? 'Добавлена новая фотография' : 'New photo added';
    }
    case 'STORY_SUBMITTED': {
      const preview = payload?.preview as string | undefined;
      if (isRu) {
        return `Новая история: ${preview || 'добавлена к вашему профилю'}`;
      }
      return `New story: ${preview || 'added to your profile'}`;
    }
    case 'STORY_APPROVED': {
      const title = payload?.title as string | undefined;
      if (isRu) {
        return `Ваша история "${title || 'без названия'}" одобрена`;
      }
      return `Your story "${title || 'untitled'}" was approved`;
    }
    case 'STORY_REJECTED': {
      const title = payload?.title as string | undefined;
      const reason = payload?.reason as string | undefined;
      if (isRu) {
        return `История "${title || 'без названия'}" отклонена${reason ? ': ' + reason : ''}`;
      }
      return `Story "${title || 'untitled'}" was rejected${reason ? ': ' + reason : ''}`;
    }
    case 'INVITATION_RECEIVED': {
      const inviterName = payload?.inviter_name as string | undefined;
      if (isRu) {
        return inviterName
          ? `${inviterName} приглашает вас в семью`
          : 'Вас пригласили в семью';
      }
      return inviterName
        ? `${inviterName} invited you to join their family`
        : 'You received a family invitation';
    }
    default:
      return isRu ? 'Новое событие' : 'New event';
  }
}

/**
 * Formats relative time for notifications
 */
function formatRelativeTime(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const isRu = locale === 'ru';

    if (diffMins < 1) {
      return isRu ? 'только что' : 'just now';
    }
    if (diffMins < 60) {
      return isRu ? `${diffMins} мин назад` : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return isRu ? `${diffHours} ч назад` : `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return isRu ? `${diffDays} дн назад` : `${diffDays}d ago`;
    }
    return d.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

export default function NotificationBell() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('notifications');

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = (await res.json()) as ApiResponse;
      setNotifications(json.notifications || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.notification_id);

    if (unreadIds.length === 0) return;

    setMarkingRead(true);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
      }
    } catch {
      // Silent fail
    } finally {
      setMarkingRead(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      );
    } catch {
      // Silent fail
    }
  };

  const recentNotifications = notifications.slice(0, 5);
  const BellIcon = unreadCount > 0 ? BellRing : Bell;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('title')}
        >
          <BellIcon
            className={cn(
              'h-5 w-5 transition-colors',
              unreadCount > 0 && 'text-primary'
            )}
          />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center',
                'rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
                'ring-2 ring-background',
                'animate-in zoom-in-50 duration-200'
              )}
            >
              {displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
        sideOffset={8}
      >
        {/* Header with gradient accent */}
        <div className="flex items-center justify-between border-b border-white/50 dark:border-white/10 px-4 py-3 bg-[#58A6FF]/5 dark:bg-[#58A6FF]/5">
          <h3 className="font-semibold text-sm text-foreground">{t('title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-[#58A6FF] dark:hover:text-[#58A6FF]"
              onClick={markAllAsRead}
              disabled={markingRead}
            >
              {markingRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {t('markAllRead')}
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#58A6FF]" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#58A6FF]/10 dark:bg-[#58A6FF]/10 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-[#58A6FF]" />
              </div>
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {recentNotifications.map((row) => (
                <li
                  key={row.notification_id}
                  className={cn(
                    'px-4 py-3 cursor-pointer transition-all duration-200',
                    'hover:bg-white/80 dark:hover:bg-gray-800/50',
                    !row.is_read && 'bg-[#58A6FF]/5 dark:bg-[#58A6FF]/5'
                  )}
                  onClick={() => {
                    if (!row.is_read) {
                      markAsRead(row.notification_id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="mt-1.5 shrink-0">
                      {!row.is_read ? (
                        <span className="flex h-2 w-2 rounded-full bg-[#58A6FF] animate-pulse" />
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-transparent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          row.is_read
                            ? 'text-muted-foreground'
                            : 'text-foreground font-medium'
                        )}
                      >
                        {formatNotificationText(row, locale)}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {formatRelativeTime(row.notification.created_at, locale)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-white/50 dark:border-white/10 px-4 py-2.5 bg-[#58A6FF]/5 dark:bg-[#58A6FF]/5">
            <Link
              href={`/${locale}/app`}
              className="text-xs text-[#58A6FF] dark:text-[#58A6FF] hover:text-[#58A6FF]/80 dark:hover:text-[#58A6FF]/80 font-semibold transition-colors"
              onClick={() => setOpen(false)}
            >
              {t('viewAll')}
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
