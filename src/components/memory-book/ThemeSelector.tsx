'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { BookThemeId, BookTheme } from '@/lib/memory-book/types';
import { BOOK_THEMES } from '@/lib/memory-book/types';

interface ThemeSelectorProps {
  selectedTheme: BookThemeId;
  onSelect: (theme: BookThemeId) => void;
}

export default function ThemeSelector({
  selectedTheme,
  onSelect,
}: ThemeSelectorProps) {
  const themes = Object.values(BOOK_THEMES);

  return (
    <div className="grid grid-cols-2 gap-4">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme.id)}
          className={cn(
            'relative p-4 rounded-lg border-2 transition-all duration-200',
            'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            selectedTheme === theme.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          {/* Selected indicator */}
          {selectedTheme === theme.id && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Theme preview */}
          <div
            className="w-full h-24 rounded-md mb-3 relative overflow-hidden"
            style={{ backgroundColor: theme.colors.background }}
          >
            {/* Mini preview of theme */}
            <div className="absolute inset-0 p-3 flex flex-col">
              {/* Header simulation */}
              <div
                className="h-2 w-16 rounded-sm mb-2"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="h-1.5 w-24 rounded-sm mb-3"
                style={{ backgroundColor: theme.colors.secondary }}
              />
              {/* Content lines */}
              <div className="space-y-1.5">
                <div
                  className="h-1 w-full rounded-sm"
                  style={{ backgroundColor: theme.colors.border }}
                />
                <div
                  className="h-1 w-3/4 rounded-sm"
                  style={{ backgroundColor: theme.colors.border }}
                />
                <div
                  className="h-1 w-5/6 rounded-sm"
                  style={{ backgroundColor: theme.colors.border }}
                />
              </div>
              {/* Accent element */}
              <div
                className="absolute bottom-2 right-2 w-8 h-8 rounded"
                style={{
                  backgroundColor: theme.colors.accent,
                  borderRadius: theme.styles.borderRadius,
                }}
              />
            </div>
          </div>

          {/* Theme info */}
          <h3 className="font-semibold text-gray-900 text-left">{theme.name}</h3>
          <p className="text-xs text-gray-500 text-left mt-1">
            {theme.description}
          </p>

          {/* Color swatches */}
          <div className="flex gap-1 mt-3">
            {[
              theme.colors.primary,
              theme.colors.secondary,
              theme.colors.accent,
            ].map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
