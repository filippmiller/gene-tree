'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ActivityItem from './ActivityItem';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
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
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Activity className="w-5 h-5" />
          <h3 className="font-semibold">Family Activity</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Events list */}
      {events.length > 0 ? (
        <div className="space-y-1">
          {events.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="py-4">
            {isLoadingMore && (
              <div className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
            {!hasMore && events.length > 0 && (
              <p className="text-center text-xs text-gray-400">
                No more activity to show
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
          <p className="text-xs mt-1">
            Activity from your family will appear here
          </p>
        </div>
      )}
    </div>
  );
}
