'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ThisDayEvent } from '@/types/this-day';
import { formatYearsAgo, EVENT_TYPE_CONFIG } from '@/types/this-day';
import GreetingButton from './GreetingButton';

interface EventCardProps {
  event: ThisDayEvent;
  onGreetingSent?: () => void;
}

export default function EventCard({ event, onGreetingSent }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.event_type];
  const yearsDisplay = formatYearsAgo(event.years_ago, event.event_type);

  const profileUrl = `/profile/${event.profile_id}`;
  const fullName = `${event.profile_first_name} ${event.profile_last_name}`.trim();

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Avatar */}
      <Link href={profileUrl} className="flex-shrink-0">
        {event.profile_avatar_url ? (
          <Image
            src={event.profile_avatar_url}
            alt={fullName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-medium">
            {event.profile_first_name?.[0] || '?'}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={profileUrl} className="hover:underline">
          <p className="font-medium text-gray-900 truncate">
            {fullName}
          </p>
        </Link>
        <p className="text-sm text-gray-500 truncate">
          {event.display_title}
          {yearsDisplay && (
            <span className="ml-2 text-gray-400">
              ({yearsDisplay})
            </span>
          )}
        </p>
      </div>

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
        <span className="text-2xl" title="In loving memory">
          🕯️
        </span>
      )}
    </div>
  );
}
