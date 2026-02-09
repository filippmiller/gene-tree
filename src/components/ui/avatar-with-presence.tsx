'use client';

/**
 * AvatarWithPresence Component
 *
 * Wraps the standard Avatar component with online presence indicator.
 * Shows a green dot when user is online, or "last seen" information when offline.
 */

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface AvatarWithPresenceProps {
  /**
   * Image source URL
   */
  src?: string | null;

  /**
   * Fallback text (usually initials)
   */
  fallback: string;

  /**
   * Alt text for the image
   */
  alt?: string;

  /**
   * Whether the user is currently online
   */
  isOnline?: boolean;

  /**
   * When the user was last seen (for offline users)
   */
  lastSeen?: Date | string | null;

  /**
   * Whether to show presence indicator at all
   * @default true
   */
  showPresence?: boolean;

  /**
   * Whether the user has opted to hide their online status
   * When true, no presence indicator is shown
   * @default false
   */
  presenceHidden?: boolean;

  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Additional CSS classes for the avatar container
   */
  className?: string;

  /**
   * Additional CSS classes for the avatar itself
   */
  avatarClassName?: string;

  /**
   * Ring color (for relationship type styling)
   */
  ringColor?: string;

  /**
   * Flat color for fallback background
   */
  fallbackColor?: string;

  /**
   * @deprecated Use fallbackColor instead
   */
  gradientColor?: string;
}

// Size configurations
const sizeConfig = {
  xs: {
    avatar: 'h-6 w-6',
    dot: 'h-1.5 w-1.5',
    dotPosition: '-bottom-0 -right-0',
    fallbackText: 'text-[8px]',
  },
  sm: {
    avatar: 'h-8 w-8',
    dot: 'h-2 w-2',
    dotPosition: '-bottom-0.5 -right-0.5',
    fallbackText: 'text-[10px]',
  },
  md: {
    avatar: 'h-10 w-10',
    dot: 'h-2.5 w-2.5',
    dotPosition: '-bottom-0.5 -right-0.5',
    fallbackText: 'text-xs',
  },
  lg: {
    avatar: 'h-12 w-12',
    dot: 'h-3 w-3',
    dotPosition: '-bottom-0.5 -right-0.5',
    fallbackText: 'text-sm',
  },
  xl: {
    avatar: 'h-16 w-16',
    dot: 'h-3.5 w-3.5',
    dotPosition: '-bottom-1 -right-1',
    fallbackText: 'text-base',
  },
};

/**
 * Format last seen timestamp into human-readable string
 */
function formatLastSeen(date: Date | string): string {
  const lastSeenDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }

  // For older dates, show the date
  return lastSeenDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get tooltip content based on presence state
 */
function getPresenceTooltip(
  isOnline: boolean,
  lastSeen?: Date | string | null
): string {
  if (isOnline) {
    return 'Online';
  }

  if (lastSeen) {
    return `Last seen ${formatLastSeen(lastSeen)}`;
  }

  return 'Offline';
}

export function AvatarWithPresence({
  src,
  fallback,
  alt,
  isOnline = false,
  lastSeen,
  showPresence = true,
  presenceHidden = false,
  size = 'md',
  className,
  avatarClassName,
  ringColor,
  fallbackColor,
  gradientColor,
}: AvatarWithPresenceProps) {
  // Resolve the fallback bg: prefer fallbackColor, then legacy gradientColor, then default flat
  const resolvedFallbackBg = fallbackColor
    ? fallbackColor
    : gradientColor
      ? `bg-gradient-to-br ${gradientColor}`
      : 'bg-[#272D36]';
  const config = sizeConfig[size];

  // Don't show presence if user has hidden it or if disabled
  const shouldShowPresence = showPresence && !presenceHidden;

  const tooltipContent = shouldShowPresence
    ? getPresenceTooltip(isOnline, lastSeen)
    : null;

  const avatarContent = (
    <div className={cn('relative inline-flex', className)}>
      <Avatar
        className={cn(
          config.avatar,
          ringColor && `ring-2 ring-offset-2 ring-offset-background ${ringColor}`,
          avatarClassName
        )}
      >
        {src && <AvatarImage src={src} alt={alt || fallback} />}
        <AvatarFallback
          className={cn(
            'text-white font-semibold',
            resolvedFallbackBg,
            config.fallbackText
          )}
        >
          {fallback}
        </AvatarFallback>
      </Avatar>

      {/* Presence indicator dot */}
      {shouldShowPresence && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-background transition-colors duration-200',
            config.dot,
            config.dotPosition,
            isOnline
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
              : 'bg-gray-400'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );

  // Wrap in tooltip if presence is shown
  if (shouldShowPresence && tooltipContent) {
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{avatarContent}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isOnline ? 'bg-emerald-500' : 'bg-gray-400'
              )}
            />
            {tooltipContent}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return avatarContent;
}

export default AvatarWithPresence;
