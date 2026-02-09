'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Cake, Heart, Flame, Calendar, Inbox } from 'lucide-react';
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
    bg: 'bg-[#F778BA]',
    shadow: 'shadow-[#F778BA]/25',
    badgeBg: 'bg-[#F778BA]/10 dark:bg-[#F778BA]/10',
    badgeText: 'text-[#F778BA] dark:text-[#F778BA]',
  },
  anniversary: {
    icon: Heart,
    bg: 'bg-[#58A6FF]',
    shadow: 'shadow-[#58A6FF]/25',
    badgeBg: 'bg-[#58A6FF]/10 dark:bg-[#58A6FF]/10',
    badgeText: 'text-[#58A6FF] dark:text-[#58A6FF]',
  },
  death_commemoration: {
    icon: Flame,
    bg: 'bg-[#D29922]',
    shadow: 'shadow-[#D29922]/25',
    badgeBg: 'bg-[#D29922]/10 dark:bg-[#D29922]/10',
    badgeText: 'text-[#D29922] dark:text-[#D29922]',
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
            <div className="w-10 h-10 rounded-xl bg-[#58A6FF]/10 dark:bg-[#58A6FF]/10" />
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
          <div className="w-10 h-10 rounded-xl bg-[#58A6FF] flex items-center justify-center shadow-lg shadow-[#58A6FF]/25">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {t('title')}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#58A6FF]/10 dark:bg-[#58A6FF]/10 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-[#58A6FF]" />
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
          <div className="w-10 h-10 rounded-xl bg-[#58A6FF] flex items-center justify-center shadow-lg shadow-[#58A6FF]/25">
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
                <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shadow-md ${config.shadow}`}>
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
