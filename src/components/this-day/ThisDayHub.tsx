'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Cake, Heart, Flame, Calendar, Loader2, Inbox } from 'lucide-react';
import type { GetThisDayResponse, ThisDayEventGroup } from '@/types/this-day';
import { GlassCard } from '@/components/ui/glass-card';
import EventCard from './EventCard';

interface ThisDayHubProps {
  className?: string;
}

// Icon and gradient config for event types
const eventTypeConfig = {
  birthday: {
    icon: Cake,
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/25',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/30',
    badgeText: 'text-rose-600 dark:text-rose-400',
  },
  anniversary: {
    icon: Heart,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/25',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/30',
    badgeText: 'text-violet-600 dark:text-violet-400',
  },
  death_commemoration: {
    icon: Flame,
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/25',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
};

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
      <GlassCard glass="medium" padding="lg" className={className}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30" />
            <div className="h-6 bg-muted rounded-lg w-1/3" />
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-muted/50 rounded-xl" />
            <div className="h-16 bg-muted/50 rounded-xl" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard glass="medium" padding="lg" className={className}>
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
        </div>
      </GlassCard>
    );
  }

  if (!data || data.total === 0) {
    return (
      <GlassCard glass="medium" padding="lg" className={className}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('title')}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('noEvents')}
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard glass="medium" padding="lg" className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('title')}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {formatDate(data.date)}
        </span>
      </div>

      <div className="space-y-6">
        {data.groups.map((group: ThisDayEventGroup) => {
          const config = eventTypeConfig[group.type as keyof typeof eventTypeConfig] || eventTypeConfig.birthday;
          const Icon = config.icon;

          return (
            <div key={group.type}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md ${config.shadow}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {group.label}
                <span className={`${config.badgeBg} ${config.badgeText} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
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
          );
        })}
      </div>
    </GlassCard>
  );
}
