'use client';

import { useState, useEffect, useCallback } from 'react';
import { DuplicateCard } from './DuplicateCard';
import { DuplicateComparisonModal } from './DuplicateComparisonModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Scan, Users, Clock, Check } from 'lucide-react';
import type { PotentialDuplicate, DuplicateStatus } from '@/lib/duplicates/types';

interface DuplicateQueueProps {
  initialStatus?: DuplicateStatus;
  locale?: 'en' | 'ru';
}

interface QueueData {
  duplicates: (PotentialDuplicate & {
    is_deceased_pair?: boolean;
    shared_relatives_count?: number;
  })[];
  total: number;
  pendingCount: number;
  hasMore: boolean;
}

interface ScanResult {
  success: boolean;
  scanType: string;
  profilesScanned: number;
  duplicatesFound: number;
  duplicatesInserted: number;
  durationMs: number;
}

export function DuplicateQueue({ initialStatus = 'pending', locale = 'en' }: DuplicateQueueProps) {
  const [data, setData] = useState<QueueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DuplicateStatus>(initialStatus);
  const [offset, setOffset] = useState(0);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);
  const [showDeceasedOnly, setShowDeceasedOnly] = useState(false);

  const texts = {
    en: {
      title: 'Duplicate Detection',
      description: 'Review and merge duplicate profiles to maintain data quality.',
      pending: 'pending',
      scanFor: 'Scan for Duplicates',
      scanning: 'Scanning...',
      fullScan: 'Full Scan',
      fullScanDesc: 'Scan all profiles',
      deceasedScan: 'Deceased Only',
      deceasedScanDesc: 'Focus on memorial profiles',
      noDuplicates: 'No duplicates found',
      allReviewed: 'All potential duplicates have been reviewed.',
      noStatus: 'No {status} duplicates.',
      scanNew: 'Scan for New Duplicates',
      loadMore: 'Load More',
      scanComplete: 'Scan Complete',
      profilesScanned: 'profiles scanned',
      found: 'found',
      inserted: 'new',
      deceasedPairs: 'Deceased Pairs',
      showDeceasedOnly: 'Show Deceased Only',
      showAll: 'Show All',
      statusPending: 'Pending',
      statusMerged: 'Merged',
      statusNotDuplicate: 'Not Duplicate',
    },
    ru: {
      title: 'Обнаружение дубликатов',
      description: 'Проверяйте и объединяйте дублирующиеся профили для поддержания качества данных.',
      pending: 'ожидает',
      scanFor: 'Поиск дубликатов',
      scanning: 'Сканирование...',
      fullScan: 'Полное сканирование',
      fullScanDesc: 'Проверить все профили',
      deceasedScan: 'Только усопших',
      deceasedScanDesc: 'Фокус на мемориальных профилях',
      noDuplicates: 'Дубликаты не найдены',
      allReviewed: 'Все потенциальные дубликаты проверены.',
      noStatus: 'Нет дубликатов со статусом {status}.',
      scanNew: 'Искать новые дубликаты',
      loadMore: 'Загрузить ещё',
      scanComplete: 'Сканирование завершено',
      profilesScanned: 'профилей проверено',
      found: 'найдено',
      inserted: 'новых',
      deceasedPairs: 'Пары усопших',
      showDeceasedOnly: 'Только усопших',
      showAll: 'Показать все',
      statusPending: 'Ожидает',
      statusMerged: 'Объединено',
      statusNotDuplicate: 'Не дубликат',
    },
  };
  const t = texts[locale];

  const fetchQueue = useCallback(
    async (resetOffset = false) => {
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
    },
    [status, offset]
  );

  const handleScan = async (scanType: 'full' | 'deceased_only' = 'full') => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const params = new URLSearchParams({
        scanType,
        minConfidence: scanType === 'deceased_only' ? '60' : '50',
        includeRelationships: 'true',
      });

      const response = await fetch(`/api/duplicates/scan?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Scan failed');
      }

      setScanResult(result);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadMore = () => {
    setOffset((prev) => prev + 20);
  };

  useEffect(() => {
    if (offset > 0) {
      fetchQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Filter duplicates if showing deceased only
  const filteredDuplicates = showDeceasedOnly
    ? data?.duplicates.filter((d) => d.is_deceased_pair) || []
    : data?.duplicates || [];

  // Count deceased pairs
  const deceasedPairCount =
    data?.duplicates.filter((d) => d.is_deceased_pair).length || 0;

  const statusLabels: Record<DuplicateStatus, string> = {
    pending: t.statusPending,
    merged: t.statusMerged,
    not_duplicate: t.statusNotDuplicate,
    dismissed: t.statusNotDuplicate,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <Badge variant="secondary" size="lg">
              {data.pendingCount} {t.pending}
            </Badge>
          )}

          {/* Scan dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isScanning}>
                {isScanning ? (
                  <>
                    <Scan className="h-4 w-4 mr-2 animate-spin" />
                    {t.scanning}
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    {t.scanFor}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Scan Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleScan('full')}>
                <Users className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">{t.fullScan}</div>
                  <div className="text-xs text-muted-foreground">{t.fullScanDesc}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleScan('deceased_only')}>
                <Clock className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">{t.deceasedScan}</div>
                  <div className="text-xs text-muted-foreground">{t.deceasedScanDesc}</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scan result notification */}
      {scanResult && (
        <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t.scanComplete}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {scanResult.profilesScanned} {t.profilesScanned} - {scanResult.duplicatesFound}{' '}
                {t.found}, {scanResult.duplicatesInserted} {t.inserted}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setScanResult(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status filter */}
        {(['pending', 'merged', 'not_duplicate'] as DuplicateStatus[]).map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {statusLabels[s]}
          </Button>
        ))}

        {/* Separator */}
        <div className="w-px h-8 bg-border mx-2" />

        {/* Deceased filter */}
        {deceasedPairCount > 0 && (
          <Button
            variant={showDeceasedOnly ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowDeceasedOnly(!showDeceasedOnly)}
          >
            {showDeceasedOnly ? t.showAll : t.showDeceasedOnly}
            <Badge variant="outline" className="ml-2">
              {deceasedPairCount}
            </Badge>
          </Button>
        )}
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
      {!isLoading && filteredDuplicates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Check className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noDuplicates}</h3>
            <p className="text-muted-foreground mt-1">
              {status === 'pending'
                ? t.allReviewed
                : t.noStatus.replace('{status}', statusLabels[status])}
            </p>
            {status === 'pending' && (
              <Button onClick={() => handleScan('full')} disabled={isScanning} className="mt-4">
                {t.scanNew}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duplicate cards */}
      {filteredDuplicates.length > 0 && (
        <div className="space-y-6">
          {filteredDuplicates.map((duplicate) => (
            <DuplicateCard
              key={duplicate.id}
              duplicate={duplicate}
              onMerge={handleMerge}
              onDismiss={handleDismiss}
              onViewDetails={() => setSelectedDuplicateId(duplicate.id)}
              isLoading={isLoading}
              showDeceasedBadge={duplicate.is_deceased_pair}
              sharedRelativesCount={duplicate.shared_relatives_count}
            />
          ))}

          {/* Load more */}
          {data?.hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {t.loadMore}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Comparison Modal */}
      <DuplicateComparisonModal
        duplicateId={selectedDuplicateId}
        open={!!selectedDuplicateId}
        onOpenChange={(open) => !open && setSelectedDuplicateId(null)}
        onMerge={handleMerge}
        onDismiss={handleDismiss}
        locale={locale}
      />
    </div>
  );
}
