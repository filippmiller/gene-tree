'use client';

/**
 * PersonCardWithPresence
 *
 * PersonCard variant with online presence indicator.
 * Shows a green dot when the person is online, or "last seen" tooltip when offline.
 */

import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import { ChevronRight } from 'lucide-react';

const personCardVariants = cva(
  [
    'group relative flex items-center gap-4 p-4',
    'rounded-2xl transition-all duration-300 ease-out',
    'transform-gpu cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        glass: [
          'bg-white/60 dark:bg-gray-800/60',
          'backdrop-blur-md',
          'border border-white/40 dark:border-white/10',
          'shadow-glass',
          'hover:-translate-y-1 hover:shadow-glass-hover',
          'hover:border-violet-500/20',
        ].join(' '),
        solid: [
          'bg-card',
          'border border-border',
          'shadow-elevation-2',
          'hover:-translate-y-1 hover:shadow-elevation-3',
          'hover:border-violet-500/20',
        ].join(' '),
        minimal: [
          'bg-white/30 dark:bg-gray-800/30',
          'border border-transparent',
          'hover:bg-white/60 dark:hover:bg-gray-800/60',
          'hover:border-white/40 dark:hover:border-white/10',
        ].join(' '),
        highlighted: [
          'bg-gradient-to-br from-violet-500/10 to-sky-500/5',
          'backdrop-blur-md',
          'border border-violet-500/20',
          'shadow-glass',
          'hover:-translate-y-1 hover:shadow-glow',
        ].join(' '),
      },
      size: {
        sm: 'p-3 gap-3',
        md: 'p-4 gap-4',
        lg: 'p-5 gap-5',
      },
    },
    defaultVariants: {
      variant: 'glass',
      size: 'md',
    },
  }
);

// Avatar ring colors for relationship types
const avatarRingColors: Record<string, string> = {
  parents: 'ring-violet-500',
  grandparents: 'ring-amber-500',
  children: 'ring-sky-500',
  grandchildren: 'ring-pink-500',
  siblings: 'ring-emerald-500',
  spouses: 'ring-rose-500',
  default: 'ring-violet-500',
};

// Avatar gradient colors
const avatarGradients: Record<string, string> = {
  parents: 'from-violet-500 to-purple-600',
  grandparents: 'from-amber-500 to-orange-600',
  children: 'from-sky-500 to-blue-600',
  grandchildren: 'from-pink-500 to-rose-600',
  siblings: 'from-emerald-500 to-teal-600',
  spouses: 'from-rose-500 to-red-600',
  default: 'from-violet-500 to-purple-600',
};

export interface PersonCardWithPresenceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof personCardVariants> {
  person: {
    id: string;
    name: string;
    photoUrl?: string | null;
    birthDate?: string | null;
    deathDate?: string | null;
    isAlive?: boolean;
  };
  /**
   * Whether the person is currently online
   */
  isOnline?: boolean;
  /**
   * When the person was last seen (for offline display)
   */
  lastSeen?: Date | string | null;
  /**
   * Whether presence indicator should be shown
   * @default true for living people
   */
  showPresence?: boolean;
  relationshipType?:
    | 'parents'
    | 'grandparents'
    | 'children'
    | 'grandchildren'
    | 'siblings'
    | 'spouses'
    | 'default';
  relationshipLabel?: string;
  locale?: string;
  showActions?: boolean;
  href?: string;
}

export const PersonCardWithPresence = React.forwardRef<
  HTMLDivElement,
  PersonCardWithPresenceProps
>(
  (
    {
      className,
      variant,
      size,
      person,
      isOnline = false,
      lastSeen,
      showPresence,
      relationshipType = 'default',
      relationshipLabel,
      locale = 'en',
      showActions = true,
      href,
      ...props
    },
    ref
  ) => {
    // Get initials from name
    const getInitials = (name: string): string => {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // Format lifespan
    const formatLifespan = (): string => {
      const birthYear = person.birthDate
        ? new Date(person.birthDate).getFullYear()
        : null;
      const deathYear = person.deathDate
        ? new Date(person.deathDate).getFullYear()
        : null;

      if (birthYear && deathYear) {
        return `${birthYear} - ${deathYear}`;
      } else if (birthYear && person.isAlive === false) {
        return `${birthYear} - ...`;
      } else if (birthYear) {
        return locale === 'ru' ? `род. ${birthYear}` : `b. ${birthYear}`;
      }
      return '';
    };

    const ringColor = avatarRingColors[relationshipType] || avatarRingColors.default;
    const gradientColor = avatarGradients[relationshipType] || avatarGradients.default;
    const lifespan = formatLifespan();

    // Only show presence for living people
    const shouldShowPresence = showPresence ?? (person.isAlive !== false);

    // Convert lastSeen to Date if string
    const lastSeenDate = lastSeen
      ? typeof lastSeen === 'string'
        ? new Date(lastSeen)
        : lastSeen
      : null;

    // Determine avatar size based on card size
    const avatarSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

    const cardContent = (
      <div
        ref={ref}
        className={cn(personCardVariants({ variant, size, className }))}
        {...props}
      >
        {/* Avatar with presence */}
        <div className="relative flex-shrink-0">
          <AvatarWithPresence
            src={person.photoUrl}
            fallback={getInitials(person.name)}
            alt={person.name}
            isOnline={isOnline}
            lastSeen={lastSeenDate}
            showPresence={shouldShowPresence}
            size={avatarSize}
            ringColor={ringColor}
            gradientColor={gradientColor}
            avatarClassName="transition-transform duration-300 group-hover:scale-105"
          />

          {/* Deceased indicator (overrides presence dot) */}
          {person.isAlive === false && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-400 ring-2 ring-background flex items-center justify-center"
              title={locale === 'ru' ? 'Усопший' : 'Deceased'}
            >
              <span className="text-[8px] text-white">✝</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-foreground truncate transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
            )}
          >
            {person.name}
          </h3>

          {relationshipLabel && (
            <p className="text-sm text-muted-foreground truncate">
              {relationshipLabel}
            </p>
          )}

          {lifespan && (
            <p className="text-xs text-muted-foreground mt-0.5">{lifespan}</p>
          )}
        </div>

        {/* Actions or chevron */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
    );

    // Wrap in Link if href provided
    if (href) {
      return (
        <Link
          href={href}
          className="block focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 rounded-2xl"
        >
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  }
);

PersonCardWithPresence.displayName = 'PersonCardWithPresence';

export default PersonCardWithPresence;
