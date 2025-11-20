'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';

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
    payload: any;
    created_at: string;
  };
}

interface ApiResponse {
  notifications: NotificationRow[];
}

function formatText(row: NotificationRow): string {
  const { event_type, payload } = row.notification;

  switch (event_type) {
    case 'relative_added': {
      const first = payload?.first_name as string | undefined;
      const last = payload?.last_name as string | undefined;
      const rel = payload?.relationship_type as string | undefined;
      const name = [first, last].filter(Boolean).join(' ');
      return name && rel
        ? `Добавлен новый родственник: ${name} (${rel})`
        : 'Добавлен новый родственник';
    }
    case 'media_added': {
      const mediaType = payload?.media_type as string | undefined;
      if (mediaType === 'video') {
        return 'Добавлено новое видео';
      }
      return 'Добавлена новая фотография';
    }
    case 'STORY_SUBMITTED': {
      const mediaType = payload?.media_type as string | undefined;
      const preview = payload?.preview as string | undefined;
      return `Новая история (${mediaType || 'unknown'}): ${preview || 'добавлена к вашему профилю'}`;
    }
    case 'STORY_APPROVED': {
      const title = payload?.title as string | undefined;
      return `Ваша история "${title || 'без названия'}" была одобрена`;
    }
    case 'STORY_REJECTED': {
      const title = payload?.title as string | undefined;
      const reason = payload?.reason as string | undefined;
      return `Ваша история "${title || 'без названия'}" была отклонена${reason ? ': ' + reason : ''}`;
    }
    default:
      return 'Новое событие';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function NotificationsPanel() {
  const [data, setData] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось загрузить уведомления');
      }
      const json = (await res.json()) as ApiResponse;
      setData(json.notifications || []);
    } catch (err: any) {
      console.error('[Dashboard] Notifications fetch error', err);
      setError(err?.message || 'Ошибка загрузки уведомлений');
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
      setData((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('[Dashboard] markAsRead error', err);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-900">Уведомления</h2>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5">
            {unreadCount}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Загрузка...
        </div>
      ) : error ? (
        <div className="flex items-center justify-between p-2 bg-red-50 rounded text-xs text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-gray-500">Пока нет уведомлений.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {data.slice(0, 8).map((row) => (
            <li
              key={row.notification_id}
              className={`flex items-start justify-between gap-3 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 ${row.is_read ? 'text-gray-500' : 'bg-blue-50 text-gray-900'
                }`}
              onClick={() => markAsRead(row.notification_id)}
            >
              <div className="flex-1">
                <p className="truncate">{formatText(row)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatTime(row.notification.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
