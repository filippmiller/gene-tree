'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactionType } from '@/types/reactions';
import { REACTION_EMOJIS, REACTION_LABELS } from '@/types/reactions';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function ReactionButton({
  type,
  count,
  isSelected,
  onClick,
  disabled = false,
  size = 'sm',
}: ReactionButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1 rounded-full transition-all',
        size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm',
        isSelected
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
          : 'hover:bg-gray-100 text-gray-600'
      )}
      title={REACTION_LABELS[type]}
      aria-label={`${REACTION_LABELS[type]}${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={isSelected}
    >
      <span className={cn(
        'transition-transform',
        isSelected && 'scale-110'
      )}>
        {REACTION_EMOJIS[type]}
      </span>
      {count > 0 && (
        <span className="font-medium">{count}</span>
      )}
    </Button>
  );
}
