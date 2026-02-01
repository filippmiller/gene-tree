'use client';

/**
 * BiographyPreview Component
 *
 * A compact biography preview that can be embedded in profile pages.
 * Shows the introduction section with a link to the full biography.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { GeneratedBiography } from '@/lib/biography/types';

interface BiographyPreviewProps {
  profileId: string;
  locale: 'en' | 'ru';
  className?: string;
}

const translations = {
  en: {
    title: 'Biography',
    viewFull: 'Read Full Biography',
    generating: 'Generating biography...',
    error: 'Could not generate biography',
    completeness: 'Completeness',
    noContent: 'Add more information to generate a biography',
  },
  ru: {
    title: 'Биография',
    viewFull: 'Читать полную биографию',
    generating: 'Генерация биографии...',
    error: 'Не удалось сгенерировать биографию',
    completeness: 'Полнота',
    noContent: 'Добавьте больше информации для генерации биографии',
  },
};

export function BiographyPreview({
  profileId,
  locale,
  className = '',
}: BiographyPreviewProps) {
  const t = translations[locale];
  const [biography, setBiography] = useState<GeneratedBiography | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBiography() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/biography/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId, locale }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          setBiography(data.data);
        } else {
          setError(data.error || t.error);
        }
      } catch (err) {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }

    fetchBiography();
  }, [profileId, locale, t.error]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t.generating}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !biography) {
    return null; // Silently don't render if there's an error
  }

  // Get the introduction section
  const introSection = biography.sections.find((s) => s.id === 'introduction');

  // If no content, show minimal prompt
  if (!introSection || biography.sections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{t.noContent}</p>
          <Link href={`/${locale}/profile/${profileId}/biography`}>
            <Button variant="outline" size="sm" className="gap-1">
              {t.viewFull}
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Truncate intro for preview
  const maxLength = 250;
  const introText =
    introSection.content.length > maxLength
      ? introSection.content.slice(0, maxLength) + '...'
      : introSection.content;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-lg">{t.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t.completeness}</span>
            <Progress value={biography.completenessScore} className="w-16 h-1.5" />
            <span className="text-xs font-medium">{biography.completenessScore}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {introText}
        </p>
        <Link href={`/${locale}/profile/${profileId}/biography`}>
          <Button variant="outline" size="sm" className="gap-1">
            {t.viewFull}
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default BiographyPreview;
