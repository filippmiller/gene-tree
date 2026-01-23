'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactionButton from './ReactionButton';
import type {
  ReactionType,
  ReactionTargetType,
  ReactionCounts,
} from '@/types/reactions';
import { REACTION_TYPES, emptyReactionCounts } from '@/types/reactions';

interface ReactionBarProps {
  targetType: ReactionTargetType;
  targetId: string;
  initialCounts?: ReactionCounts;
  initialUserReaction?: ReactionType | null;
  size?: 'sm' | 'md';
  className?: string;
}

export default function ReactionBar({
  targetType,
  targetId,
  initialCounts,
  initialUserReaction = null,
  size = 'sm',
  className = '',
}: ReactionBarProps) {
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts || emptyReactionCounts());
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial data if not provided
  useEffect(() => {
    if (!initialCounts) {
      fetchReactions();
    }
  }, [targetType, targetId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/reactions/${targetType}/${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts);
        setUserReaction(data.userReaction);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = useCallback(async (reactionType: ReactionType) => {
    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const previousCounts = { ...counts };
    const previousUserReaction = userReaction;

    // Calculate new state optimistically
    const newCounts = { ...counts };

    if (userReaction === reactionType) {
      // Toggle off
      newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1);
      newCounts.total = Math.max(0, newCounts.total - 1);
      setUserReaction(null);
    } else {
      // Add new or switch
      if (userReaction) {
        // Remove old reaction
        newCounts[userReaction] = Math.max(0, newCounts[userReaction] - 1);
      } else {
        // First reaction
        newCounts.total += 1;
      }
      newCounts[reactionType] += 1;
      setUserReaction(reactionType);
    }
    setCounts(newCounts);

    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }

      const data = await response.json();
      // Update with server response
      setCounts(data.counts);
      setUserReaction(data.userReaction);
    } catch (error) {
      // Revert on error
      console.error('Error updating reaction:', error);
      setCounts(previousCounts);
      setUserReaction(previousUserReaction);
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId, counts, userReaction, isLoading]);

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {REACTION_TYPES.map((type) => (
        <ReactionButton
          key={type}
          type={type}
          count={counts[type]}
          isSelected={userReaction === type}
          onClick={() => handleReaction(type)}
          disabled={isLoading}
          size={size}
        />
      ))}
    </div>
  );
}
