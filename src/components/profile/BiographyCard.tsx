'use client';

/**
 * BiographyCard Component
 *
 * Displays a generated biography with:
 * - Expandable sections
 * - Missing field prompts
 * - Share functionality
 * - Print-friendly view
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Share2,
  Printer,
  AlertCircle,
  Plus,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import type { GeneratedBiography, MissingField } from '@/lib/biography/types';

interface BiographyCardProps {
  biography: GeneratedBiography;
  locale: 'en' | 'ru';
  onEditField?: (field: string, path?: string) => void;
  showMissingPrompts?: boolean;
  compact?: boolean;
  className?: string;
}

interface Translations {
  title: string;
  readMore: string;
  readLess: string;
  share: string;
  print: string;
  viewFull: string;
  missingInfo: string;
  addInfo: string;
  completeness: string;
  shareTitle: string;
  copyLink: string;
  copied: string;
  shareOnTwitter: string;
  shareOnFacebook: string;
  shareOnWhatsApp: string;
  importance: {
    high: string;
    medium: string;
    low: string;
  };
}

const translations: Record<'en' | 'ru', Translations> = {
  en: {
    title: 'Biography',
    readMore: 'Read more',
    readLess: 'Read less',
    share: 'Share',
    print: 'Print',
    viewFull: 'View Full Biography',
    missingInfo: 'Help complete this biography',
    addInfo: 'Add this info',
    completeness: 'Story Completeness',
    shareTitle: 'Share Biography',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    shareOnTwitter: 'Share on X',
    shareOnFacebook: 'Share on Facebook',
    shareOnWhatsApp: 'Share on WhatsApp',
    importance: {
      high: 'Important',
      medium: 'Helpful',
      low: 'Optional',
    },
  },
  ru: {
    title: 'Биография',
    readMore: 'Читать далее',
    readLess: 'Свернуть',
    share: 'Поделиться',
    print: 'Печать',
    viewFull: 'Полная биография',
    missingInfo: 'Помогите дополнить биографию',
    addInfo: 'Добавить',
    completeness: 'Полнота истории',
    shareTitle: 'Поделиться биографией',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    shareOnTwitter: 'Поделиться в X',
    shareOnFacebook: 'Поделиться в Facebook',
    shareOnWhatsApp: 'Поделиться в WhatsApp',
    importance: {
      high: 'Важно',
      medium: 'Полезно',
      low: 'Опционально',
    },
  },
};

function ImportanceBadge({
  importance,
  t,
}: {
  importance: MissingField['importance'];
  t: Translations;
}) {
  const variants = {
    high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${variants[importance]}`}>
      {t.importance[importance]}
    </span>
  );
}

export function BiographyCard({
  biography,
  locale,
  onEditField,
  showMissingPrompts = true,
  compact = false,
  className = '',
}: BiographyCardProps) {
  const router = useRouter();
  const t = translations[locale];
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(compact ? [] : biography.sections.map((s) => s.id))
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/${locale}/profile/${biography.profileId}/biography`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [biography.profileId, locale]);

  const handleShare = useCallback(
    (platform: 'twitter' | 'facebook' | 'whatsapp') => {
      const url = `${window.location.origin}/${locale}/profile/${biography.profileId}/biography`;
      const text = `${biography.fullName} - ${t.title}`;

      const urls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      };

      window.open(urls[platform], '_blank', 'width=550,height=420');
      setShareOpen(false);
    },
    [biography.profileId, biography.fullName, locale, t.title]
  );

  const handleAddInfo = useCallback(
    (field: MissingField) => {
      if (onEditField) {
        onEditField(field.field, field.editPath);
      } else if (field.editPath) {
        router.push(`/${locale}${field.editPath}`);
      }
    },
    [onEditField, router, locale]
  );

  const handleViewFull = useCallback(() => {
    router.push(`/${locale}/profile/${biography.profileId}/biography`);
  }, [router, locale, biography.profileId]);

  // Separate high-importance missing fields
  const highImportanceMissing = biography.missingFields.filter(
    (f) => f.importance === 'high'
  );
  const otherMissing = biography.missingFields.filter(
    (f) => f.importance !== 'high'
  );

  return (
    <Card className={`print:shadow-none ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-xl">{t.title}</CardTitle>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {/* Completeness indicator */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">
                {t.completeness}
              </span>
              <Progress
                value={biography.completenessScore}
                className="w-20 h-2"
              />
              <span className="text-xs font-medium">
                {biography.completenessScore}%
              </span>
            </div>

            {/* Share button */}
            <Popover open={shareOpen} onOpenChange={setShareOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  {t.share}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {copied ? t.copied : t.copyLink}
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {t.shareOnTwitter}
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {t.shareOnFacebook}
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {t.shareOnWhatsApp}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Print button */}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              {t.print}
            </Button>
          </div>
        </div>

        {/* Mobile completeness */}
        <div className="flex sm:hidden items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">{t.completeness}</span>
          <Progress value={biography.completenessScore} className="flex-1 h-2" />
          <span className="text-xs font-medium">{biography.completenessScore}%</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Biography sections */}
        {biography.sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const shouldTruncate = compact && section.content.length > 200;

          return (
            <div
              key={section.id}
              className="border-b border-border/50 last:border-0 pb-4 last:pb-0"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 text-muted-foreground leading-relaxed">
                  {shouldTruncate && !expandedSections.has(section.id) ? (
                    <>
                      {section.content.slice(0, 200)}...
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-primary hover:underline ml-1"
                      >
                        {t.readMore}
                      </button>
                    </>
                  ) : (
                    section.content
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Missing info prompts */}
        {showMissingPrompts && biography.missingFields.length > 0 && (
          <div className="mt-6 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-medium text-foreground">
                {t.missingInfo}
              </h4>
            </div>

            <div className="space-y-2">
              {/* High importance first */}
              {highImportanceMissing.map((field) => (
                <div
                  key={field.field}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{field.label}</span>
                      <ImportanceBadge importance={field.importance} t={t} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddInfo(field)}
                    className="ml-3 shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t.addInfo}
                  </Button>
                </div>
              ))}

              {/* Other importance */}
              {otherMissing.slice(0, compact ? 2 : 5).map((field) => (
                <div
                  key={field.field}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{field.label}</span>
                      <ImportanceBadge importance={field.importance} t={t} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddInfo(field)}
                    className="ml-3 shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t.addInfo}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View full biography link (when compact) */}
        {compact && (
          <div className="mt-4 print:hidden">
            <Button
              variant="link"
              onClick={handleViewFull}
              className="p-0 h-auto text-primary"
            >
              {t.viewFull}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  );
}

export default BiographyCard;
