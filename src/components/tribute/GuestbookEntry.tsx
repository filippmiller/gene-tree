'use client';

import { useTranslations } from 'next-intl';
import type { TributeGuestbookEntryWithAuthor } from '@/types/tribute';
import { getTributeTypeEmoji } from '@/types/tribute';

interface GuestbookEntryProps {
  entry: TributeGuestbookEntryWithAuthor;
  className?: string;
}

export default function GuestbookEntry({ entry, className = '' }: GuestbookEntryProps) {
  const t = useTranslations('tribute');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const authorName = entry.author
    ? `${entry.author.first_name} ${entry.author.last_name}`
    : t('anonymous');

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Tribute type icon or avatar */}
        <div className="flex-shrink-0">
          {entry.tribute_type !== 'message' ? (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
              {getTributeTypeEmoji(entry.tribute_type)}
            </div>
          ) : entry.author?.avatar_url ? (
            <img
              src={entry.author.avatar_url}
              alt={authorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
              {entry.author?.first_name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-gray-900">{authorName}</span>
            <span className="text-xs text-gray-500">
              {formatDate(entry.created_at)} {formatTime(entry.created_at)}
            </span>
          </div>

          {entry.message ? (
            <p className="text-gray-700 whitespace-pre-wrap">{entry.message}</p>
          ) : (
            <p className="text-gray-500 italic">
              {entry.tribute_type === 'flower'
                ? t('leftFlower')
                : entry.tribute_type === 'candle'
                ? t('litCandle')
                : t('leftTribute')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
