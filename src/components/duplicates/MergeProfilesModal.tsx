'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  AlertTriangle,
  Check,
  Users,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import type { EnhancedProfileData, EnhancedMergeRequest } from '@/types/duplicate';

interface MergeProfilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateId: string;
  keepProfile: EnhancedProfileData;
  mergeProfile: EnhancedProfileData;
  onConfirm: (request: EnhancedMergeRequest) => Promise<void>;
  locale?: 'en' | 'ru';
}

interface MergeableField {
  key: string;
  label: string;
  labelRu: string;
  keepValue: string | null;
  mergeValue: string | null;
  canMerge: boolean;
}

function getMergeableFields(
  keepProfile: EnhancedProfileData,
  mergeProfile: EnhancedProfileData
): MergeableField[] {
  const fields: { key: keyof EnhancedProfileData; label: string; labelRu: string }[] = [
    { key: 'middle_name', label: 'Middle Name', labelRu: 'Отчество' },
    { key: 'maiden_name', label: 'Maiden Name', labelRu: 'Девичья фамилия' },
    { key: 'nickname', label: 'Nickname', labelRu: 'Прозвище' },
    { key: 'birth_date', label: 'Birth Date', labelRu: 'Дата рождения' },
    { key: 'birth_city', label: 'Birth City', labelRu: 'Город рождения' },
    { key: 'birth_country', label: 'Birth Country', labelRu: 'Страна рождения' },
    { key: 'death_date', label: 'Death Date', labelRu: 'Дата смерти' },
    { key: 'death_place', label: 'Death Place', labelRu: 'Место смерти' },
    { key: 'occupation', label: 'Occupation', labelRu: 'Профессия' },
    { key: 'bio', label: 'Biography', labelRu: 'Биография' },
    { key: 'avatar_url', label: 'Avatar', labelRu: 'Аватар' },
  ];

  return fields.map((f) => {
    const keepValue = keepProfile[f.key];
    const mergeValue = mergeProfile[f.key];

    return {
      key: f.key,
      label: f.label,
      labelRu: f.labelRu,
      keepValue: keepValue ? String(keepValue) : null,
      mergeValue: mergeValue ? String(mergeValue) : null,
      // Can merge if keep profile is missing this value but merge profile has it
      canMerge:
        (!keepValue || keepValue === '') && mergeValue !== null && mergeValue !== '',
    };
  });
}

export function MergeProfilesModal({
  open,
  onOpenChange,
  duplicateId,
  keepProfile,
  mergeProfile,
  onConfirm,
  locale = 'en',
}: MergeProfilesModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mergeableFields = getMergeableFields(keepProfile, mergeProfile);
  const fieldsToMerge = mergeableFields.filter((f) => f.canMerge);

  const texts = {
    en: {
      title: 'Confirm Profile Merge',
      description: 'Review and confirm the merge. This action cannot be undone.',
      keepProfile: 'Keep Profile',
      mergeProfile: 'Merge From',
      dataToMerge: 'Select data to copy from the merged profile',
      noDataToMerge: 'No additional data to merge. The kept profile already has all the information.',
      willTransfer: 'The following will be transferred to the kept profile:',
      relationships: 'relationships',
      stories: 'stories',
      photos: 'photos',
      warning: 'Warning: This action is irreversible',
      warningText:
        'The merged profile will be permanently deleted. All their relationships, stories, and photos will be transferred to the kept profile.',
      notes: 'Resolution Notes (optional)',
      notesPlaceholder: 'Add any notes about this merge decision...',
      cancel: 'Cancel',
      confirm: 'Confirm Merge',
      merging: 'Merging...',
    },
    ru: {
      title: 'Подтверждение объединения',
      description: 'Проверьте и подтвердите объединение. Это действие нельзя отменить.',
      keepProfile: 'Оставить профиль',
      mergeProfile: 'Объединить из',
      dataToMerge: 'Выберите данные для копирования из объединяемого профиля',
      noDataToMerge:
        'Нет дополнительных данных для объединения. Оставляемый профиль уже содержит всю информацию.',
      willTransfer: 'Следующее будет перенесено в оставляемый профиль:',
      relationships: 'связей',
      stories: 'историй',
      photos: 'фото',
      warning: 'Внимание: Это действие необратимо',
      warningText:
        'Объединяемый профиль будет удален навсегда. Все его связи, истории и фото будут перенесены в оставляемый профиль.',
      notes: 'Заметки о решении (необязательно)',
      notesPlaceholder: 'Добавьте заметки о решении объединить...',
      cancel: 'Отмена',
      confirm: 'Подтвердить объединение',
      merging: 'Объединение...',
    },
  };
  const t = texts[locale];

  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        duplicateId,
        keepProfileId: keepProfile.id,
        mergeProfileId: mergeProfile.id,
        fieldsToMerge: Array.from(selectedFields),
        resolutionNotes: resolutionNotes || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const keepName = [keepProfile.first_name, keepProfile.last_name].filter(Boolean).join(' ');
  const mergeName = [mergeProfile.first_name, mergeProfile.last_name].filter(Boolean).join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Profile visualization */}
            <div className="flex items-center justify-center gap-4">
              {/* Keep profile */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-primary bg-primary/5">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={keepProfile.avatar_url || ''} alt={keepName} />
                  <AvatarFallback>
                    {keepProfile.first_name?.[0]}
                    {keepProfile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{keepName}</p>
                  <Badge variant="secondary" size="sm">
                    {t.keepProfile}
                  </Badge>
                </div>
              </div>

              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

              {/* Merge profile */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-muted opacity-70">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mergeProfile.avatar_url || ''} alt={mergeName} />
                  <AvatarFallback>
                    {mergeProfile.first_name?.[0]}
                    {mergeProfile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{mergeName}</p>
                  <Badge variant="outline" size="sm">
                    {t.mergeProfile}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* What will be transferred */}
            <div>
              <h4 className="font-medium mb-3">{t.willTransfer}</h4>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Users className="h-3 w-3 mr-1" />
                  {mergeProfile.relationships_count || 0} {t.relationships}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {mergeProfile.stories_count || 0} {t.stories}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {mergeProfile.photos_count || 0} {t.photos}
                </Badge>
              </div>
            </div>

            {/* Fields to merge */}
            {fieldsToMerge.length > 0 ? (
              <div>
                <h4 className="font-medium mb-3">{t.dataToMerge}</h4>
                <div className="space-y-2">
                  {fieldsToMerge.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.has(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <Label
                        htmlFor={field.key}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <span className="font-medium">
                          {locale === 'ru' ? field.labelRu : field.label}:
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {field.mergeValue}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noDataToMerge}</p>
            )}

            {/* Warning */}
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t.warning}</strong>
                <br />
                {t.warningText}
              </AlertDescription>
            </Alert>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? t.merging : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MergeProfilesModal;
