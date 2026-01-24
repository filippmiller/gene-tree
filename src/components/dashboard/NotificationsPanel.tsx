'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bell, Loader2, CheckCheck, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import NotificationItem, {
  type NotificationRow,
} from '@/components/notifications/NotificationItem';

interface ApiResponse {
  notifications: NotificationRow[];
}

// Translation keys for notifications
const translations = {
  en: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    viewAll: 'View all',
    empty: 'No notifications yet',
    emptyHint: 'When family members add content, you\'ll see it here',
    loading: 'Loading...',
    error: 'Failed to load notifications',
    relativeAdded: '{name} was added as your {relationship}',
    mediaAdded: 'New {mediaType} added to {name}\'s profile',
    storySubmitted: 'New story about {name}',
    storyApproved: 'Your story was approved',
    storyRejected: 'Your story was declined',
  },
  ru: {
    title: 'Уведомления',
    markAllRead: 'Прочитать все',
    viewAll: 'Показать все',
    empty: 'Пока нет уведомлений',
    emptyHint: 'Когда члены семьи добавят контент, вы увидите это здесь',
    loading: 'Загрузка...',
    error: 'Не удалось загрузить уведомления',
    relativeAdded: '{name} добавлен(а) как ваш(а) {relationship}',
    mediaAdded: 'Новое {mediaType} добавлено в профиль {name}',
    storySubmitted: 'Новая история о {name}',
    storyApproved: 'Ваша история была одобрена',
    storyRejected: 'Ваша история была отклонена',
  },
};

export default function NotificationsPanel() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [data, setData] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t.error);
      }
      const json = (await res.json()) as ApiResponse;
      setData(json.notifications || []);
    } catch (err: unknown) {
      console.error('[Dashboard] Notifications fetch error', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unreadCount = data.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setData((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('[Dashboard] markAsRead error', err);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    const unreadIds = data.filter((n) => !n.is_read).map((n) => n.notification_id);

    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      });
      setData((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('[Dashboard] markAllAsRead error', err);
    } finally {
      setMarkingAll(false);
    }
  }

  const notificationTranslations = {
    relativeAdded: t.relativeAdded,
    mediaAdded: t.mediaAdded,
    storySubmitted: t.storySubmitted,
    storyApproved: t.storyApproved,
    storyRejected: t.storyRejected,
  };

  return (
    <GlassCard glass="medium" padding="none" className="overflow-hidden">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Bell className="w-4 h-4 text-white" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            {t.title}
          </h2>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
          >
            {markingAll ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <CheckCheck className="w-3 h-3 mr-1" />
            )}
            {t.markAllRead}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-violet-500" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-sm text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  load();
                }}
                className="ml-2 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-violet-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {t.empty}
            </p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              {t.emptyHint}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {data.slice(0, 8).map((row) => (
              <NotificationItem
                key={row.notification_id}
                notification={row}
                onMarkAsRead={markAsRead}
                translations={notificationTranslations}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer - View All link */}
      {data.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/50 dark:border-white/10 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10">
          <button className="w-full text-center text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold py-1 transition-colors">
            {t.viewAll}
          </button>
        </div>
      )}
    </GlassCard>
  );
}
