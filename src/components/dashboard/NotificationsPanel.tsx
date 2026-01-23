'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bell, Loader2, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t.title}
          </h2>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm text-red-600 dark:text-red-400">
              <span>{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  load();
                }}
                className="ml-2 text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.empty}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
              {t.emptyHint}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
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
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <button className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-1 transition-colors">
            {t.viewAll}
          </button>
        </div>
      )}
    </section>
  );
}
