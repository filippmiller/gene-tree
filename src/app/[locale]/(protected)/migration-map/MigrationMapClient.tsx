/**
 * MigrationMapClient Component
 *
 * Client-side wrapper for the migration map with refresh capability.
 */

'use client';

import { useState, useCallback } from 'react';
import { MigrationMap } from '@/components/migration';
import { Button } from '@/components/ui/button';
import type { MigrationData } from '@/lib/migration/types';

interface MigrationMapClientProps {
  initialData: MigrationData;
  locale: string;
}

export default function MigrationMapClient({
  initialData,
  locale,
}: MigrationMapClientProps) {
  const [data, setData] = useState<MigrationData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/migration/data');
      if (!response.ok) {
        throw new Error('Failed to fetch migration data');
      }
      const newData = await response.json();
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const labels = {
    en: {
      refresh: 'Refresh Data',
      loading: 'Loading...',
      error: 'Error loading data',
    },
    ru: {
      refresh: 'Обновить данные',
      loading: 'Загрузка...',
      error: 'Ошибка загрузки данных',
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading}
        >
          {isLoading ? t.loading : t.refresh}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {t.error}: {error}
        </div>
      )}

      {/* Migration Map */}
      <MigrationMap data={data} locale={locale} />
    </div>
  );
}
