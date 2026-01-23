'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { GetThisDayResponse, ThisDayEventGroup } from '@/types/this-day';
import EventCard from './EventCard';

interface ThisDayHubProps {
  className?: string;
}

export default function ThisDayHub({ className = '' }: ThisDayHubProps) {
  const t = useTranslations('thisDay');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GetThisDayResponse | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/this-day');
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        const result: GetThisDayResponse = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('noEvents')}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('title')}
        </h2>
        <span className="text-sm text-gray-500">
          {formatDate(data.date)}
        </span>
      </div>

      <div className="space-y-6">
        {data.groups.map((group: ThisDayEventGroup) => (
          <div key={group.type}>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              {group.type === 'birthday' && <span>🎂</span>}
              {group.type === 'anniversary' && <span>💍</span>}
              {group.type === 'death_commemoration' && <span>🕯️</span>}
              {group.label}
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {group.events.length}
              </span>
            </h3>

            <div className="space-y-2">
              {group.events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onGreetingSent={() => {
                    // Could show a toast or update UI
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
