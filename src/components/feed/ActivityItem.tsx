'use client';

import { useState, useCallback } from 'react';
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
  Pencil,
  type LucideIcon
} from 'lucide-react';
import type { ActivityEventWithActor } from '@/types/activity';
import { getActivityDescription, getActivityLink } from '@/types/activity';
import { REACTION_EMOJIS, REACTION_TYPES, type ReactionType } from '@/types/reactions';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  event: ActivityEventWithActor;
  /**
   * Enable quick reactions on the activity item
   * @default true
   */
  enableReactions?: boolean;
}

// Icon configuration for activity types
const activityIconConfig: Record<string, { icon: LucideIcon; gradient: string; shadow: string }> = {
  relative_added: { icon: UserPlus, gradient: 'from-[#58A6FF] to-[#58A6FF]', shadow: '' },
  media_added: { icon: ImagePlus, gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' },
  comment_added: { icon: MessageSquare, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
  reaction_added: { icon: Heart, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
  story_created: { icon: BookOpen, gradient: 'from-[#D29922] to-[#D29922]', shadow: '' },
  photo_added: { icon: ImagePlus, gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' },
  profile_updated: { icon: Pencil, gradient: 'from-slate-500 to-gray-600', shadow: 'shadow-slate-500/25' },
  STORY_SUBMITTED: { icon: BookOpen, gradient: 'from-[#D29922] to-[#D29922]', shadow: '' },
  STORY_APPROVED: { icon: CheckCircle, gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
  STORY_REJECTED: { icon: XCircle, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' },
};

const defaultIconConfig = { icon: UserPlus, gradient: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25' };

// Determine if an activity subject can receive reactions
function canReceiveReactions(eventType: string, subjectType: string, subjectId: string): boolean {
  // Only stories and photos can receive reactions from activity items
  // Exclude synthesized events (prefixed IDs) from reactions since they may not have real DB records
  const isSynthesizedEvent = subjectId.startsWith('relative-') ||
                             subjectId.startsWith('photo-') ||
                             subjectId.startsWith('profile-');

  // For synthesized photo events, we can still react (extract real ID)
  if (eventType === 'photo_added' && subjectId.startsWith('photo-')) {
    return true;
  }

  // Other synthesized events don't support reactions
  if (isSynthesizedEvent) {
    return false;
  }

  return ['story_created', 'STORY_APPROVED', 'photo_added'].includes(eventType) ||
         ['story', 'photo'].includes(subjectType);
}

// Extract real ID from potentially prefixed ID
function getRealSubjectId(subjectId: string): string {
  if (subjectId.startsWith('photo-')) {
    return subjectId.slice('photo-'.length);
  }
  if (subjectId.startsWith('relative-')) {
    return subjectId.slice('relative-'.length);
  }
  if (subjectId.startsWith('profile-')) {
    // Handle profile-uuid-timestamp format
    const parts = subjectId.slice('profile-'.length).split('-');
    // UUID has 5 parts separated by dashes
    if (parts.length >= 5) {
      return parts.slice(0, 5).join('-');
    }
    return parts[0];
  }
  return subjectId;
}

export default function ActivityItem({
  event,
  enableReactions = true,
}: ActivityItemProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isReacting, setIsReacting] = useState(false);

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

  const showReactions = enableReactions && canReceiveReactions(event.event_type, event.subject_type, event.subject_id);

  const handleReaction = useCallback(async (reactionType: ReactionType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReacting) return;
    setIsReacting(true);

    try {
      // Use real subject ID for reactions (extract from prefixed IDs)
      const realSubjectId = getRealSubjectId(event.subject_id);

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: event.subject_type,
          target_id: realSubjectId,
          reaction_type: reactionType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserReaction(data.userReaction);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setIsReacting(false);
      setShowReactionPicker(false);
    }
  }, [event.subject_type, event.subject_id, userReaction, isReacting]);

  return (
    <div
      className="relative group"
      onMouseEnter={() => showReactions && setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
    >
      <Link
        href={link}
        className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/30 border border-white/50 dark:border-white/5 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-md transition-all duration-200"
      >
        <div className="relative flex-shrink-0">
          <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700 shadow-md">
            <AvatarImage src={event.actor.avatar_url || undefined} />
            <AvatarFallback className="bg-[#58A6FF] text-white text-sm font-medium">
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

          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[11px] text-muted-foreground/70">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </p>

            {/* User's current reaction indicator */}
            {userReaction && (
              <span className="text-sm" title={`You reacted with ${userReaction}`}>
                {REACTION_EMOJIS[userReaction]}
              </span>
            )}
          </div>
        </div>

        {/* Hover arrow */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#58A6FF] transition-colors" />
        </div>
      </Link>

      {/* Quick reaction picker - appears on hover */}
      {showReactions && showReactionPicker && (
        <div
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10",
            "flex items-center gap-0.5 px-1.5 py-1",
            "bg-white dark:bg-gray-800 rounded-full",
            "shadow-lg border border-gray-200 dark:border-gray-700",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
          onClick={(e) => e.preventDefault()}
        >
          {REACTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={(e) => handleReaction(type, e)}
              disabled={isReacting}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "hover:scale-125 transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                userReaction === type && "bg-[#58A6FF]/10"
              )}
              title={type}
            >
              <span className="text-base">{REACTION_EMOJIS[type]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
