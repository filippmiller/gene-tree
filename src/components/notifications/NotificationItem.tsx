'use client';

import { useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Camera, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { cn } from '@/lib/utils';

// Notification data structure from API
export interface NotificationRow {
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  notification: {
    id: string;
    event_type: string;
    actor_profile_id: string;
    primary_profile_id: string | null;
    related_profile_id: string | null;
    payload: {
      first_name?: string;
      last_name?: string;
      relationship_type?: string;
      media_type?: string;
      title?: string;
      reason?: string;
      preview?: string;
      actor_photo_url?: string;
      story_id?: string;
    };
    created_at: string;
  };
}

interface NotificationItemProps {
  notification: NotificationRow;
  onMarkAsRead: (id: string) => void;
  translations: {
    relativeAdded: string;
    mediaAdded: string;
    storySubmitted: string;
    storyApproved: string;
    storyRejected: string;
  };
}

/**
 * Icon overlay component for notification type
 */
function TypeIcon({ eventType }: { eventType: string }) {
  const iconClass = 'w-3 h-3 text-white';

  switch (eventType) {
    case 'relative_added':
      return <User className={iconClass} />;
    case 'media_added':
      return <Camera className={iconClass} />;
    case 'STORY_SUBMITTED':
      return <BookOpen className={iconClass} />;
    case 'STORY_APPROVED':
      return <CheckCircle className={iconClass} />;
    case 'STORY_REJECTED':
      return <XCircle className={iconClass} />;
    default:
      return <User className={iconClass} />;
  }
}

/**
 * Get the icon gradient and shadow based on event type
 */
function getIconStyles(eventType: string): { gradient: string; shadow: string } {
  switch (eventType) {
    case 'relative_added':
      return { gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' };
    case 'media_added':
      return { gradient: 'bg-gradient-to-br from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25' };
    case 'STORY_SUBMITTED':
      return { gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' };
    case 'STORY_APPROVED':
      return { gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' };
    case 'STORY_REJECTED':
      return { gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', shadow: 'shadow-rose-500/25' };
    default:
      return { gradient: 'bg-gradient-to-br from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25' };
  }
}

/**
 * Format the notification message based on event type
 */
function formatMessage(
  notification: NotificationRow,
  translations: NotificationItemProps['translations']
): string {
  const { event_type, payload } = notification.notification;

  switch (event_type) {
    case 'relative_added': {
      const name = [payload?.first_name, payload?.last_name]
        .filter(Boolean)
        .join(' ');
      const relationship = payload?.relationship_type || '';
      if (name && relationship) {
        return translations.relativeAdded
          .replace('{name}', name)
          .replace('{relationship}', relationship);
      }
      return translations.relativeAdded
        .replace('{name}', 'Someone')
        .replace('{relationship}', 'relative');
    }
    case 'media_added': {
      const mediaType = payload?.media_type === 'video' ? 'video' : 'photo';
      const name = [payload?.first_name, payload?.last_name]
        .filter(Boolean)
        .join(' ');
      return translations.mediaAdded
        .replace('{mediaType}', mediaType)
        .replace('{name}', name || 'a profile');
    }
    case 'STORY_SUBMITTED': {
      const name = [payload?.first_name, payload?.last_name]
        .filter(Boolean)
        .join(' ');
      return translations.storySubmitted.replace('{name}', name || 'someone');
    }
    case 'STORY_APPROVED':
      return translations.storyApproved;
    case 'STORY_REJECTED':
      return translations.storyRejected;
    default:
      return 'New notification';
  }
}

/**
 * Get the navigation URL based on notification type
 */
function getNavigationUrl(notification: NotificationRow, locale: string): string {
  const { event_type, primary_profile_id, related_profile_id, payload } =
    notification.notification;

  switch (event_type) {
    case 'relative_added':
      // Navigate to the related profile or tree
      if (related_profile_id) {
        return `/${locale}/profile/${related_profile_id}`;
      }
      return `/${locale}/tree`;
    case 'media_added':
      // Navigate to the profile with photos section
      if (primary_profile_id) {
        return `/${locale}/profile/${primary_profile_id}#photos`;
      }
      return `/${locale}/tree`;
    case 'STORY_SUBMITTED':
      // Navigate to story or profile stories
      if (payload?.story_id) {
        return `/${locale}/stories/${payload.story_id}`;
      }
      if (primary_profile_id) {
        return `/${locale}/profile/${primary_profile_id}#stories`;
      }
      return `/${locale}/stories`;
    case 'STORY_APPROVED':
      if (payload?.story_id) {
        return `/${locale}/stories/${payload.story_id}`;
      }
      return `/${locale}/stories`;
    case 'STORY_REJECTED':
      return `/${locale}/stories`;
    default:
      return `/${locale}/tree`;
  }
}

/**
 * Get initials from a name for avatar fallback
 */
function getInitials(payload: NotificationRow['notification']['payload']): string {
  const first = payload?.first_name?.[0] || '';
  const last = payload?.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  translations,
}: NotificationItemProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { is_read, notification: data } = notification;
  const { event_type, payload, created_at } = data;

  const handleClick = () => {
    // Mark as read if not already
    if (!is_read) {
      onMarkAsRead(notification.notification_id);
    }

    // Navigate to the relevant page
    const url = getNavigationUrl(notification, locale);
    router.push(url);
  };

  const message = formatMessage(notification, translations);
  const timeAgo = formatRelativeTime(created_at, locale);

  const iconStyles = getIconStyles(event_type);

  return (
    <li
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
        'hover:bg-white/80 dark:hover:bg-gray-800/50 hover:shadow-sm',
        'group',
        is_read
          ? 'bg-white/30 dark:bg-gray-900/30'
          : 'bg-violet-50/70 dark:bg-violet-950/20'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 w-2 pt-3">
        {!is_read && (
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        )}
      </div>

      {/* Avatar with type icon overlay */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-700 shadow-md">
          {payload?.actor_photo_url ? (
            <AvatarImage
              src={payload.actor_photo_url}
              alt={`${payload.first_name || ''} ${payload.last_name || ''}`}
            />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
            {getInitials(payload)}
          </AvatarFallback>
        </Avatar>

        {/* Type icon overlay */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-md flex items-center justify-center',
            'ring-2 ring-white dark:ring-gray-800 shadow-md',
            iconStyles.gradient,
            iconStyles.shadow
          )}
        >
          <TypeIcon eventType={event_type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            is_read
              ? 'text-muted-foreground'
              : 'text-foreground font-medium'
          )}
        >
          {message}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Hover arrow indicator */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2">
        <svg
          className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </li>
  );
}
