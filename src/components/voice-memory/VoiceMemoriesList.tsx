'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { useVoiceMemories } from '@/hooks/useVoiceMemories';
import VoiceMemoryPlayer from './VoiceMemoryPlayer';

interface Props {
  profileId?: string;
  showHeader?: boolean;
  locale: 'en' | 'ru';
  currentUserId?: string;
}

const translations = {
  en: {
    title: 'Voice Memories',
    noMemories: 'No voice memories yet',
    noMemoriesHint: 'Be the first to record a memory',
    loading: 'Loading...',
    loadMore: 'Load more',
    error: 'Failed to load memories',
    retry: 'Retry',
  },
  ru: {
    title: 'Голосовые записи',
    noMemories: 'Пока нет голосовых записей',
    noMemoriesHint: 'Будьте первым, кто запишет воспоминание',
    loading: 'Загрузка...',
    loadMore: 'Загрузить ещё',
    error: 'Не удалось загрузить записи',
    retry: 'Повторить',
  },
};

export default function VoiceMemoriesList({
  profileId,
  showHeader = true,
  locale,
  currentUserId,
}: Props) {
  const t = translations[locale];
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const {
    memories,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    deleteMemory,
    getPlaybackUrl,
  } = useVoiceMemories({ profileId, autoLoad: true });

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const handleDelete = useCallback(async (memoryId: string) => {
    setDeletingIds(prev => new Set(prev).add(memoryId));
    const success = await deleteMemory(memoryId);
    if (!success) {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(memoryId);
        return next;
      });
    }
  }, [deleteMemory]);

  // Initial loading state
  if (isLoading && memories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {showHeader && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            {t.title}
          </h2>
        )}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && memories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {showHeader && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            {t.title}
          </h2>
        )}
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{t.error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (memories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {showHeader && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            {t.title}
          </h2>
        )}
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Mic className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t.noMemories}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t.noMemoriesHint}</p>
        </div>
      </div>
    );
  }

  // List with memories
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      {showHeader && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          {t.title}
          <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
            {memories.length} {locale === 'ru' ? 'записей' : 'memories'}
          </span>
        </h2>
      )}

      <div className="space-y-3">
        {memories
          .filter(m => !deletingIds.has(m.id))
          .map((memory) => (
            <VoiceMemoryPlayer
              key={memory.id}
              memory={memory}
              canDelete={currentUserId === memory.user_id}
              onDelete={() => handleDelete(memory.id)}
              onPlay={() => getPlaybackUrl(memory.id)}
              locale={locale}
            />
          ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-4">
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          ) : (
            <button
              onClick={loadMore}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              {t.loadMore}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
