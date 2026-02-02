'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, ChevronRight, Scan } from 'lucide-react';

interface DuplicateWidgetData {
  pendingCount: number;
  highConfidenceCount: number;
  deceasedPairCount: number;
}

interface DuplicateDetectionWidgetProps {
  locale?: 'en' | 'ru';
}

export function DuplicateDetectionWidget({ locale = 'en' }: DuplicateDetectionWidgetProps) {
  const t = useTranslations('duplicates');
  const [data, setData] = useState<DuplicateWidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/duplicates/queue?status=pending&limit=1');

        if (!response.ok) {
          if (response.status === 403) {
            // User is not admin, hide widget
            setData(null);
            return;
          }
          throw new Error('Failed to fetch');
        }

        const result = await response.json();

        setData({
          pendingCount: result.pendingCount || 0,
          highConfidenceCount: (result.duplicates || []).filter(
            (d: { confidence_score: number }) => d.confidence_score >= 80
          ).length,
          deceasedPairCount: (result.duplicates || []).filter(
            (d: { is_deceased_pair?: boolean }) => d.is_deceased_pair
          ).length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Don't render if not admin or no pending duplicates
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.pendingCount === 0) {
    return null;
  }

  const texts = {
    en: {
      title: 'Potential Duplicate Profiles',
      description: 'We found profiles that might be the same person',
      pending: 'pending review',
      highConfidence: 'high confidence',
      deceased: 'deceased pairs',
      review: 'Review Duplicates',
      scan: 'Scan Now',
    },
    ru: {
      title: 'Возможные дубликаты профилей',
      description: 'Мы нашли профили, которые могут быть одним и тем же человеком',
      pending: 'ожидают проверки',
      highConfidence: 'высокая вероятность',
      deceased: 'пары усопших',
      review: 'Проверить дубликаты',
      scan: 'Сканировать',
    },
  };

  const text = texts[locale];

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{text.title}</CardTitle>
              <CardDescription>{text.description}</CardDescription>
            </div>
          </div>
          {data.highConfidenceCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {data.highConfidenceCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.pendingCount}
            </span>
            <span className="text-sm text-muted-foreground">{text.pending}</span>
          </div>

          {data.highConfidenceCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-red-600 border-red-300">
                {data.highConfidenceCount} {text.highConfidence}
              </Badge>
            </div>
          )}

          {data.deceasedPairCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {data.deceasedPairCount} {text.deceased}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link href="/admin/duplicates" className="flex-1">
            <Button variant="default" className="w-full gap-2">
              {text.review}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default DuplicateDetectionWidget;
