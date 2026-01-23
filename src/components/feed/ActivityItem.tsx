'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityEventWithActor } from '@/types/activity';
import { ACTIVITY_ICONS, getActivityDescription, getActivityLink } from '@/types/activity';
import { REACTION_EMOJIS } from '@/types/reactions';

interface ActivityItemProps {
  event: ActivityEventWithActor;
}

export default function ActivityItem({ event }: ActivityItemProps) {
  const actorInitials = `${event.actor.first_name?.[0] || ''}${event.actor.last_name?.[0] || ''}`;
  const description = getActivityDescription(event);
  const link = getActivityLink(event);

  // Get icon - special case for reactions
  const icon = event.event_type === 'reaction_added' && event.display_data?.reaction_type
    ? REACTION_EMOJIS[event.display_data.reaction_type as keyof typeof REACTION_EMOJIS] || ACTIVITY_ICONS[event.event_type]
    : ACTIVITY_ICONS[event.event_type] || '📌';

  return (
    <Link
      href={link}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={event.actor.avatar_url || undefined} />
          <AvatarFallback>{actorInitials}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full">
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          {description}
        </p>

        {event.display_data?.comment_preview && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            &ldquo;{event.display_data.comment_preview}&rdquo;
          </p>
        )}

        {event.display_data?.subject_preview && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {event.display_data.subject_preview}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}
