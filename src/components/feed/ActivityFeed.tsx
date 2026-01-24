'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ActivityItem from './ActivityItem';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Inbox } from 'lucide-react';
import type { ActivityEventWithActor, ActivityFeedResponse } from '@/types/activity';

interface ActivityFeedProps {
  initialEvents?: ActivityEventWithActor[];
  initialCursor?: string | null;
  limit?: number;
  className?: string;
}

export default function ActivityFeed({
  initialEvents,
  initialCursor,
  limit = 20,
  className = '',
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEventWithActor[]>(initialEvents || []);
  const [cursor, setCursor] = useState<string | null>(initialCursor ?? null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(!initialEvents);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch initial data if not provided
  useEffect(() => {
    if (!initialEvents) {
      fetchEvents();
    }
  }, []);

  const fetchEvents = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (loadMore && cursor) {
        params.set('cursor', cursor);
      }

      const response = await fetch(`/api/activity/feed?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }

      const data: ActivityFeedResponse = await response.json();

      if (loadMore) {
        setEvents(prev => [...prev, ...data.events]);
      } else {
        setEvents(data.events);
      }

      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && cursor) {
      fetchEvents(true);
    }
  }, [isLoadingMore, hasMore, cursor]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleRefresh = () => {
    setCursor(null);
    setHasMore(true);
    fetchEvents(false);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 mb-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-500/20">
            <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="py-4">
            {isLoadingMore && (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
              </div>
            )}
            {!hasMore && events.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                No more activity to show
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-violet-500" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            Activity from your family will appear here
          </p>
        </div>
      )}
    </div>
  );
}
