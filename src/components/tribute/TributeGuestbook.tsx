'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TributeGuestbookEntryWithAuthor } from '@/types/tribute';
import GuestbookEntry from './GuestbookEntry';

interface TributeGuestbookProps {
  profileId: string;
  initialEntries?: TributeGuestbookEntryWithAuthor[];
  className?: string;
}

export default function TributeGuestbook({
  profileId,
  initialEntries = [],
  className = '',
}: TributeGuestbookProps) {
  const t = useTranslations('tribute');
  const [entries, setEntries] = useState<TributeGuestbookEntryWithAuthor[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialEntries.length >= 5);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/tribute/${profileId}/guestbook?page=${nextPage}&pageSize=10`
      );
      const data = await res.json();

      if (data.success && data.entries.length > 0) {
        setEntries((prev) => [...prev, ...data.entries]);
        setPage(nextPage);
        setHasMore(data.entries.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading guestbook:', err);
    } finally {
      setLoading(false);
    }
  };

  if (entries.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <div className="text-4xl mb-4">📖</div>
        <p>{t('noEntriesYet')}</p>
        <p className="text-sm mt-2">{t('beFirstToLeave')}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {entries.map((entry) => (
        <GuestbookEntry key={entry.id} entry={entry} />
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
