'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flame } from 'lucide-react';
import type { ThisDayEvent } from '@/types/this-day';
import { formatYearsAgo, EVENT_TYPE_CONFIG } from '@/types/this-day';
import GreetingButton from './GreetingButton';
import { EventCardShare } from '@/components/highlight-cards/EventCardShare';

interface EventCardProps {
  event: ThisDayEvent;
  onGreetingSent?: () => void;
}

export default function EventCard({ event, onGreetingSent }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const yearsDisplay = formatYearsAgo(event.years_ago, event.event_type);

  const profileUrl = `/profile/${event.profile_id}`;
  const fullName = [event.profile_first_name, event.profile_last_name]
    .filter(Boolean)
    .join(' ') || '?';

  return (
    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-white/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md transition-all duration-200 group">
      {/* Avatar */}
      <Link href={profileUrl} className="flex-shrink-0">
        {event.profile_avatar_url ? (
          <Image
            src={event.profile_avatar_url}
            alt={fullName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-md group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold shadow-md ring-2 ring-white dark:ring-gray-700 group-hover:scale-105 transition-transform duration-200">
            {event.profile_first_name?.[0] || '?'}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={profileUrl} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          <p className="font-semibold text-foreground truncate">
            {fullName}
          </p>
        </Link>
        <p className="text-sm text-muted-foreground truncate">
          {event.display_title}
          {yearsDisplay && (
            <span className="ml-2 text-muted-foreground/60">
              ({yearsDisplay})
            </span>
          )}
        </p>
      </div>

      {/* Share Card Button */}
      <EventCardShare event={event} className="opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Greeting Button */}
      {event.event_type !== 'death_commemoration' && (
        <GreetingButton
          eventId={event.id}
          greetingType={event.event_type === 'birthday' ? 'birthday' : 'anniversary'}
          defaultMessage={config.greeting}
          onSent={onGreetingSent}
        />
      )}

      {/* Memorial icon for commemorations */}
      {event.event_type === 'death_commemoration' && (
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25"
          title="In loving memory"
        >
          <Flame className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
