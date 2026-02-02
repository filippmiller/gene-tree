'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Check,
  X,
  Minus,
  AlertTriangle,
  Users,
  BookOpen,
  Calendar,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { describeExtendedMatchReasons } from '@/lib/duplicates/detector';
import { buildProfileComparison } from '@/types/duplicate';
import type {
  EnhancedPotentialDuplicate,
  EnhancedProfileData,
  ProfileComparisonField,
} from '@/types/duplicate';

interface DuplicateComparisonModalProps {
  duplicateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: (
    duplicateId: string,
    keepProfileId: string,
    mergeProfileId: string
  ) => Promise<void>;
  onDismiss: (duplicateId: string) => Promise<void>;
  locale?: 'en' | 'ru';
}

function ComparisonRow({
  field,
  locale,
}: {
  field: ProfileComparisonField;
  locale: 'en' | 'ru';
}) {
  const label = locale === 'ru' ? field.labelRu : field.label;
  const hasValueA = field.profileAValue !== null && field.profileAValue !== '';
  const hasValueB = field.profileBValue !== null && field.profileBValue !== '';

  return (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 py-3 border-b last:border-0">
      <div
        className={cn(
          'text-sm',
          field.isMatch && hasValueA && 'font-medium text-green-600 dark:text-green-400'
        )}
      >
        {hasValueA ? field.profileAValue : <span className="text-muted-foreground">-</span>}
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {field.isMatch && hasValueA && hasValueB ? (
          <Badge variant="secondary" className="h-5">
            <Check className="h-3 w-3 mr-1" />
            {field.matchType === 'exact'
              ? locale === 'ru'
                ? 'Совпадает'
                : 'Match'
              : field.matchType === 'variant'
                ? locale === 'ru'
                  ? 'Вариант'
                  : 'Variant'
                : locale === 'ru'
                  ? 'Похоже'
                  : 'Similar'}
          </Badge>
        ) : hasValueA && hasValueB ? (
          <Badge variant="outline" className="h-5">
            <X className="h-3 w-3 mr-1" />
            {locale === 'ru' ? 'Различается' : 'Different'}
          </Badge>
        ) : (
          <Badge variant="outline" className="h-5">
            <Minus className="h-3 w-3" />
          </Badge>
        )}
      </div>

      <div
        className={cn(
          'text-sm text-right',
          field.isMatch && hasValueB && 'font-medium text-green-600 dark:text-green-400'
        )}
      >
        {hasValueB ? field.profileBValue : <span className="text-muted-foreground">-</span>}
      </div>
    </div>
  );
}

function ProfileHeader({
  profile,
  isSelected,
  onSelect,
  disabled,
  locale,
}: {
  profile: EnhancedProfileData;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
  locale: 'en' | 'ru';
}) {
  const initials =
    `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const texts = {
    en: { keep: 'Keep This', relationships: 'relationships', stories: 'stories' },
    ru: { keep: 'Оставить', relationships: 'связей', stories: 'историй' },
  };
  const t = texts[locale];

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        'p-4 rounded-lg border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || ''} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold">{fullName}</h4>
          {profile.is_living === false && (
            <Badge variant="outline" size="sm">
              {locale === 'ru' ? 'Усопший' : 'Deceased'}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {profile.relationships_count || 0} {t.relationships}
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {profile.stories_count || 0} {t.stories}
        </div>
      </div>

      {isSelected && (
        <div className="mt-3">
          <Badge variant="default" className="w-full justify-center">
            {t.keep}
          </Badge>
        </div>
      )}
    </div>
  );
}

export function DuplicateComparisonModal({
  duplicateId,
  open,
  onOpenChange,
  onMerge,
  onDismiss,
  locale = 'en',
}: DuplicateComparisonModalProps) {
  const [duplicate, setDuplicate] = useState<EnhancedPotentialDuplicate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (!duplicateId || !open) {
      setDuplicate(null);
      setSelectedProfile(null);
      return;
    }

    async function fetchDuplicate() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/duplicates/${duplicateId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setDuplicate(data.duplicate);
      } catch (error) {
        console.error('Failed to fetch duplicate:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDuplicate();
  }, [duplicateId, open]);

  const texts = {
    en: {
      title: 'Compare Profiles',
      description: 'Review the details and decide if these are the same person',
      matchReasons: 'Why we think these might be duplicates',
      selectProfile: 'Click on the profile you want to keep',
      samePerson: 'Same Person - Merge',
      differentPeople: 'Different People',
      merging: 'Merging...',
      dismissing: 'Dismissing...',
      confidence: 'Match Confidence',
      sharedRelatives: 'Shared Relatives',
    },
    ru: {
      title: 'Сравнение профилей',
      description: 'Проверьте данные и решите, это один и тот же человек',
      matchReasons: 'Почему мы думаем, что это дубликаты',
      selectProfile: 'Нажмите на профиль, который хотите оставить',
      samePerson: 'Тот же человек - Объединить',
      differentPeople: 'Разные люди',
      merging: 'Объединение...',
      dismissing: 'Отклонение...',
      confidence: 'Уверенность совпадения',
      sharedRelatives: 'Общие родственники',
    },
  };
  const t = texts[locale];

  const handleMerge = async () => {
    if (!duplicate || !selectedProfile) return;

    const mergeProfileId =
      selectedProfile === duplicate.profile_a_id
        ? duplicate.profile_b_id
        : duplicate.profile_a_id;

    setIsMerging(true);
    try {
      await onMerge(duplicate.id, selectedProfile, mergeProfileId);
      onOpenChange(false);
    } finally {
      setIsMerging(false);
    }
  };

  const handleDismiss = async () => {
    if (!duplicate) return;

    setIsDismissing(true);
    try {
      await onDismiss(duplicate.id);
      onOpenChange(false);
    } finally {
      setIsDismissing(false);
    }
  };

  const disabled = isLoading || isMerging || isDismissing;

  // Build comparison fields
  const comparisonFields =
    duplicate?.profile_a && duplicate?.profile_b
      ? buildProfileComparison(duplicate.profile_a, duplicate.profile_b)
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : duplicate ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Confidence and metadata */}
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant={duplicate.confidence_score >= 80 ? 'destructive' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {t.confidence}: {duplicate.confidence_score}%
                </Badge>

                {duplicate.shared_relatives_count > 0 && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Users className="h-3 w-3 mr-1" />
                    {duplicate.shared_relatives_count} {t.sharedRelatives}
                  </Badge>
                )}

                {duplicate.is_deceased_pair && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {locale === 'ru' ? 'Усопшие профили' : 'Deceased Profiles'}
                  </Badge>
                )}
              </div>

              {/* Match reasons */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                  {t.matchReasons}
                </h4>
                <div className="space-y-1">
                  {describeExtendedMatchReasons(duplicate.match_reasons, locale).map(
                    (reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{reason}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Profile headers */}
              <div className="grid md:grid-cols-2 gap-4">
                {duplicate.profile_a && (
                  <ProfileHeader
                    profile={duplicate.profile_a}
                    isSelected={selectedProfile === duplicate.profile_a_id}
                    onSelect={() => setSelectedProfile(duplicate.profile_a_id)}
                    disabled={disabled}
                    locale={locale}
                  />
                )}
                {duplicate.profile_b && (
                  <ProfileHeader
                    profile={duplicate.profile_b}
                    isSelected={selectedProfile === duplicate.profile_b_id}
                    onSelect={() => setSelectedProfile(duplicate.profile_b_id)}
                    disabled={disabled}
                    locale={locale}
                  />
                )}
              </div>

              {/* Instruction text */}
              {!selectedProfile && (
                <p className="text-sm text-muted-foreground text-center">
                  {t.selectProfile}
                </p>
              )}

              <Separator />

              {/* Field comparison */}
              <div className="space-y-1">
                {comparisonFields.map((field) => (
                  <ComparisonRow key={field.key} field={field} locale={locale} />
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-auto">
          <Button variant="outline" onClick={handleDismiss} disabled={disabled}>
            {isDismissing ? t.dismissing : t.differentPeople}
          </Button>
          <Button
            variant="default"
            onClick={handleMerge}
            disabled={disabled || !selectedProfile}
          >
            {isMerging ? t.merging : t.samePerson}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DuplicateComparisonModal;
