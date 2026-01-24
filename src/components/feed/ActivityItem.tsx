'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  ImagePlus,
  MessageSquare,
  Heart,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import type { ActivityEventWithActor } from '@/types/activity';
import { getActivityDescription, getActivityLink } from '@/types/activity';
import { REACTION_EMOJIS } from '@/types/reactions';

interface ActivityItemProps {
  event: ActivityEventWithActor;
}

// Icon configuration for activity types
const activityIconConfig: Record<string, { icon: LucideIcon; gradient: string; shadow: string }> = {
  relative_added: { icon: UserPlus, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
  media_added: { icon: ImagePlus, gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' },
  comment_added: { icon: MessageSquare, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
  reaction_added: { icon: Heart, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
  story_created: { icon: BookOpen, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
  STORY_SUBMITTED: { icon: BookOpen, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
  STORY_APPROVED: { icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
  STORY_REJECTED: { icon: XCircle, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
};

const defaultIconConfig = { icon: UserPlus, gradient: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25' };

export default function ActivityItem({ event }: ActivityItemProps) {
  const actorInitials = `${event.actor.first_name?.[0] || ''}${event.actor.last_name?.[0] || ''}`;
  const description = getActivityDescription(event);
  const link = getActivityLink(event);

  const config = activityIconConfig[event.event_type] || defaultIconConfig;
  const Icon = config.icon;

  // Special case for reactions - show emoji if available
  const showReactionEmoji = event.event_type === 'reaction_added' && event.display_data?.reaction_type;
  const reactionEmoji = showReactionEmoji
    ? REACTION_EMOJIS[event.display_data!.reaction_type as keyof typeof REACTION_EMOJIS]
    : null;

  return (
    <Link
      href={link}
      className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/30 border border-white/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md transition-all duration-200 group"
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700 shadow-md">
          <AvatarImage src={event.actor.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
            {actorInitials || '?'}
          </AvatarFallback>
        </Avatar>
        {/* Icon overlay */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md ${config.shadow} ring-2 ring-white dark:ring-gray-800`}>
          {reactionEmoji ? (
            <span className="text-[10px]">{reactionEmoji}</span>
          ) : (
            <Icon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {description}
        </p>

        {event.display_data?.comment_preview && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 bg-muted/30 rounded-lg px-2 py-1">
            &ldquo;{event.display_data.comment_preview}&rdquo;
          </p>
        )}

        {event.display_data?.subject_preview && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.display_data.subject_preview}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Hover arrow */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors" />
      </div>
    </Link>
  );
}
