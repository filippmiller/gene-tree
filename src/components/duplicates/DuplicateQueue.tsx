'use client';

import { useState, useEffect, useCallback } from 'react';
import { DuplicateCard } from './DuplicateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PotentialDuplicate, DuplicateStatus } from '@/lib/duplicates/types';

interface DuplicateQueueProps {
  initialStatus?: DuplicateStatus;
}

interface QueueData {
  duplicates: PotentialDuplicate[];
  total: number;
  pendingCount: number;
  hasMore: boolean;
}

export function DuplicateQueue({ initialStatus = 'pending' }: DuplicateQueueProps) {
  const [data, setData] = useState<QueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DuplicateStatus>(initialStatus);
  const [offset, setOffset] = useState(0);

  const fetchQueue = useCallback(async (resetOffset = false) => {
    setIsLoading(true);
    setError(null);

    const currentOffset = resetOffset ? 0 : offset;
    if (resetOffset) setOffset(0);

    try {
      const params = new URLSearchParams({
        status,
        offset: currentOffset.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/duplicates/queue?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch queue');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [status, offset]);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/duplicates/scan');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Scan failed');
      }

      // Refresh the queue after scanning
      await fetchQueue(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleMerge = async (
    duplicateId: string,
    keepProfileId: string,
    mergeProfileId: string
  ) => {
    try {
      const response = await fetch('/api/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateId, keepProfileId, mergeProfileId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Merge failed');
      }

      // Remove the merged duplicate from the list
      setData((prev) =>
        prev
          ? {
              ...prev,
              duplicates: prev.duplicates.filter((d) => d.id !== duplicateId),
              pendingCount: prev.pendingCount - 1,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
    }
  };

  const handleDismiss = async (duplicateId: string) => {
    try {
      const response = await fetch('/api/duplicates/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Dismiss failed');
      }

      // Remove the dismissed duplicate from the list
      setData((prev) =>
        prev
          ? {
              ...prev,
              duplicates: prev.duplicates.filter((d) => d.id !== duplicateId),
              pendingCount: prev.pendingCount - 1,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dismiss failed');
    }
  };

  useEffect(() => {
    fetchQueue(true);
  }, [status]);

  const loadMore = () => {
    setOffset((prev) => prev + 20);
  };

  useEffect(() => {
    if (offset > 0) {
      fetchQueue();
    }
  }, [offset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Duplicate Detection</h2>
          <p className="text-muted-foreground">
            Review and merge duplicate profiles to maintain data quality.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <Badge variant="secondary" size="lg">
              {data.pendingCount} pending
            </Badge>
          )}
          <Button onClick={handleScan} loading={isScanning} variant="outline">
            {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(['pending', 'merged', 'not_duplicate'] as DuplicateStatus[]).map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && !data && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data?.duplicates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No duplicates found</h3>
            <p className="text-muted-foreground mt-1">
              {status === 'pending'
                ? 'All potential duplicates have been reviewed.'
                : `No ${status.replace('_', ' ')} duplicates.`}
            </p>
            {status === 'pending' && (
              <Button onClick={handleScan} loading={isScanning} className="mt-4">
                Scan for New Duplicates
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duplicate cards */}
      {data?.duplicates && data.duplicates.length > 0 && (
        <div className="space-y-6">
          {data.duplicates.map((duplicate) => (
            <DuplicateCard
              key={duplicate.id}
              duplicate={duplicate}
              onMerge={handleMerge}
              onDismiss={handleDismiss}
              isLoading={isLoading}
            />
          ))}

          {/* Load more */}
          {data.hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore} loading={isLoading}>
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
