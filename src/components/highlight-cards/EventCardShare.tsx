'use client';

/**
 * EventCardShare Component
 *
 * Adds share functionality to ThisDay events.
 * Generates a highlight card from event data and provides sharing options.
 */

import { useState, useMemo } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CardPreview } from './CardPreview';
import type { ThisDayEvent, ThisDayEventType } from '@/types/this-day';
import type { HighlightCardData, BirthdayCardData, AnniversaryCardData, MemoryCardData } from '@/types/highlight-cards';

interface EventCardShareProps {
  event: ThisDayEvent;
  className?: string;
}

/**
 * Convert ThisDayEvent to HighlightCardData
 */
function eventToCardData(event: ThisDayEvent): HighlightCardData {
  const fullName = [event.profile_first_name, event.profile_last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown';

  switch (event.event_type) {
    case 'birthday':
      return {
        type: 'birthday',
        personName: fullName,
        age: event.years_ago || 0,
        birthDate: new Date().toISOString(),
        photoUrl: event.profile_avatar_url,
        theme: 'warm-sunset',
      } as BirthdayCardData;

    case 'anniversary':
      return {
        type: 'anniversary',
        personName: fullName,
        partnerName: 'Partner', // Would need to fetch from relationship data
        years: event.years_ago || 1,
        anniversaryDate: new Date().toISOString(),
        photoUrl: event.profile_avatar_url,
        theme: 'royal-violet',
      } as AnniversaryCardData;

    case 'death_commemoration':
      return {
        type: 'memory',
        personName: fullName,
        year: new Date().getFullYear() - (event.years_ago || 0),
        description: `Remembering ${fullName}`,
        eventType: 'other',
        photoUrl: event.profile_avatar_url,
        theme: 'classic-elegant',
      } as MemoryCardData;

    default:
      return {
        type: 'memory',
        personName: fullName,
        year: new Date().getFullYear(),
        description: event.display_title,
        eventType: 'other',
        photoUrl: event.profile_avatar_url,
        theme: 'ocean-breeze',
      } as MemoryCardData;
  }
}

export function EventCardShare({ event, className = '' }: EventCardShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  const cardData = useMemo(() => eventToCardData(event), [event]);

  const dialogTitle = useMemo(() => {
    switch (event.event_type) {
      case 'birthday':
        return 'Share Birthday Card';
      case 'anniversary':
        return 'Share Anniversary Card';
      case 'death_commemoration':
        return 'Share Memorial Card';
      default:
        return 'Share Card';
    }
  }, [event.event_type]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          title="Share as card"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <CardPreview
          data={cardData}
          allowThemeChange
          allowSizeChange
        />
      </DialogContent>
    </Dialog>
  );
}
