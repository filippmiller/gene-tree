'use client';

/**
 * CardPreview Component
 *
 * Shows a preview of the highlight card with options to customize and share.
 * Renders the card image from the API and provides controls for:
 * - Theme selection
 * - Size selection (Instagram, Twitter, Facebook)
 * - Custom message editing
 * - Share functionality
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Palette, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShareButton } from './ShareButton';
import type {
  HighlightCardData,
  CardTheme,
  CARD_DIMENSIONS,
} from '@/types/highlight-cards';

interface CardPreviewProps {
  /** Initial card data */
  data: HighlightCardData;
  /** Allow theme customization */
  allowThemeChange?: boolean;
  /** Allow size customization */
  allowSizeChange?: boolean;
  /** Callback when card data changes */
  onChange?: (data: HighlightCardData) => void;
  /** Additional CSS classes */
  className?: string;
}

// Size options for the card
const SIZE_OPTIONS = [
  { value: 'standard', label: 'Standard (1200x630)', ratio: 1200 / 630 },
  { value: 'instagram', label: 'Instagram (1080x1080)', ratio: 1 },
  { value: 'twitter', label: 'Twitter (1200x675)', ratio: 1200 / 675 },
];

// Theme options
const THEME_OPTIONS: Array<{ value: CardTheme; label: string; preview: string }> = [
  { value: 'warm-sunset', label: 'Warm Sunset', preview: 'bg-gradient-to-br from-red-400 to-yellow-300' },
  { value: 'ocean-breeze', label: 'Ocean Breeze', preview: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
  { value: 'forest-dawn', label: 'Forest Dawn', preview: 'bg-gradient-to-br from-teal-500 to-green-400' },
  { value: 'royal-violet', label: 'Royal Violet', preview: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500' },
  { value: 'classic-elegant', label: 'Classic Elegant', preview: 'bg-gradient-to-br from-slate-900 to-slate-800' },
];

export function CardPreview({
  data: initialData,
  allowThemeChange = true,
  allowSizeChange = true,
  onChange,
  className = '',
}: CardPreviewProps) {
  const [cardData, setCardData] = useState<HighlightCardData>(initialData);
  const [size, setSize] = useState<string>('standard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate the card URL
  const cardUrl = useMemo(() => {
    const encodedData = btoa(JSON.stringify(cardData));
    return `/api/highlight-card/${cardData.type}?data=${encodedData}&size=${size}`;
  }, [cardData, size]);

  // Get absolute URL for sharing
  const absoluteCardUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${cardUrl}`;
    }
    return cardUrl;
  }, [cardUrl]);

  // Handle theme change
  const handleThemeChange = (theme: CardTheme) => {
    const newData = { ...cardData, theme };
    setCardData(newData);
    setLoading(true);
    onChange?.(newData);
  };

  // Handle size change
  const handleSizeChange = (newSize: string) => {
    setSize(newSize);
    setLoading(true);
  };

  // Get current size ratio for aspect ratio container
  const currentRatio = SIZE_OPTIONS.find((s) => s.value === size)?.ratio || 1200 / 630;

  // Generate share title based on card type
  const shareTitle = useMemo(() => {
    switch (cardData.type) {
      case 'birthday':
        return `Happy Birthday ${cardData.personName}!`;
      case 'anniversary':
        return `${cardData.personName} & ${(cardData as any).partnerName} Anniversary`;
      case 'memory':
        return `A Memory from ${(cardData as any).year}`;
      case 'milestone':
        return (cardData as any).title;
      case 'family-stats':
        return `${cardData.personName}'s Family Tree`;
      default:
        return 'Family Moment';
    }
  }, [cardData]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Card Preview Container */}
      <div
        className="relative w-full bg-muted rounded-xl overflow-hidden shadow-elevation-3"
        style={{ aspectRatio: currentRatio }}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-10">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Card Image */}
        <Image
          src={cardUrl}
          alt={shareTitle}
          fill
          className="object-contain"
          onLoad={() => {
            setLoading(false);
            setError(null);
          }}
          onError={() => {
            setLoading(false);
            setError('Failed to generate card preview');
          }}
          unoptimized // Required for dynamic API routes
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Theme Selector */}
        {allowThemeChange && (
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <Select
              value={cardData.theme || 'royal-violet'}
              onValueChange={(value) => handleThemeChange(value as CardTheme)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${theme.preview}`}
                      />
                      <span>{theme.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Size Selector */}
        {allowSizeChange && (
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
            <Select value={size} onValueChange={handleSizeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share Button */}
        <ShareButton
          cardUrl={absoluteCardUrl}
          title={shareTitle}
          text={`${shareTitle} - Made with GeneTree`}
          variant="default"
        />
      </div>
    </div>
  );
}
