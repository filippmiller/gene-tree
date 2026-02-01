'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Calendar as CalendarIcon,
  Bell,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createClient } from '@/lib/supabase/client';
import {
  type MilestoneCategory,
  type MilestoneInsert,
  MILESTONE_CATEGORIES,
  MILESTONE_TYPES,
  getMilestonesByCategory,
  getDefaultTitle,
} from '@/lib/milestones/types';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface MilestoneFormProps {
  locale: string;
  currentUserId: string;
  initialProfileId?: string;
  familyMembers: Profile[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MilestoneForm({
  locale,
  currentUserId,
  initialProfileId,
  familyMembers,
  onSuccess,
  onCancel,
}: MilestoneFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [profileId, setProfileId] = useState(initialProfileId || currentUserId);
  const [category, setCategory] = useState<MilestoneCategory>('life');
  const [milestoneType, setMilestoneType] = useState('birthday');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'family' | 'private'>('family');
  const [remindAnnually, setRemindAnnually] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);

  const dateLocale = locale === 'ru' ? ru : enUS;

  // Translations
  const t = locale === 'ru' ? {
    title: 'Добавить событие',
    profileLabel: 'Кому относится',
    categoryLabel: 'Категория',
    typeLabel: 'Тип события',
    titleLabel: 'Название',
    titlePlaceholder: 'Название события',
    descriptionLabel: 'Описание',
    descriptionPlaceholder: 'Добавьте подробности...',
    dateLabel: 'Дата',
    mediaLabel: 'Фото/видео',
    uploadMedia: 'Загрузить медиа',
    visibilityLabel: 'Видимость',
    visibilityPublic: 'Всем',
    visibilityFamily: 'Семье',
    visibilityPrivate: 'Только мне',
    reminderLabel: 'Напоминать ежегодно',
    reminderDaysLabel: 'За сколько дней напомнить',
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Сохранение...',
    errorRequired: 'Заполните обязательные поля',
    errorUpload: 'Ошибка загрузки',
    categories: {
      baby: 'Малыш',
      education: 'Образование',
      career: 'Карьера',
      relationship: 'Отношения',
      life: 'Жизнь',
      custom: 'Другое',
    },
  } : {
    title: 'Add Milestone',
    profileLabel: 'For whom',
    categoryLabel: 'Category',
    typeLabel: 'Milestone type',
    titleLabel: 'Title',
    titlePlaceholder: 'Milestone title',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Add details...',
    dateLabel: 'Date',
    mediaLabel: 'Photos/videos',
    uploadMedia: 'Upload media',
    visibilityLabel: 'Visibility',
    visibilityPublic: 'Public',
    visibilityFamily: 'Family only',
    visibilityPrivate: 'Private',
    reminderLabel: 'Remind annually',
    reminderDaysLabel: 'Days before reminder',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    errorRequired: 'Please fill in required fields',
    errorUpload: 'Upload error',
    categories: {
      baby: 'Baby',
      education: 'Education',
      career: 'Career',
      relationship: 'Relationship',
      life: 'Life',
      custom: 'Custom',
    },
  };

  // Update title when type changes
  useEffect(() => {
    if (milestoneType && !title) {
      setTitle(getDefaultTitle(milestoneType, locale));
    }
  }, [milestoneType, locale]);

  // Get types for selected category
  const availableTypes = getMilestonesByCategory(category);

  // When category changes, select first type
  useEffect(() => {
    const types = getMilestonesByCategory(category);
    if (types.length > 0 && !types.find(t => t.id === milestoneType)) {
      setMilestoneType(types[0].id);
      setTitle(getDefaultTitle(types[0].id, locale));
    }
  }, [category]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    setError(null);

    try {
      const supabase = createClient();
      const newUrls: string[] = [];
      const newPreviews: string[] = [];

      for (const file of Array.from(files)) {
        // Create preview
        const objectUrl = URL.createObjectURL(file);
        newPreviews.push(objectUrl);

        // Upload file
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `milestones/${currentUserId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        newUrls.push(filePath);
      }

      setMediaUrls(prev => [...prev, ...newUrls]);
      setMediaPreviews(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(t.errorUpload);
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!profileId || !title || !milestoneDate) {
      setError(t.errorRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          milestone_type: milestoneType,
          category,
          title,
          description: description || null,
          milestone_date: milestoneDate,
          media_urls: mediaUrls,
          visibility,
          remind_annually: remindAnnually,
          reminder_days_before: reminderDaysBefore,
        } as MilestoneInsert),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create milestone');
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating milestone:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t.title}</h2>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Profile selector */}
      <div className="space-y-2">
        <Label>{t.profileLabel}</Label>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {familyMembers.map(member => (
              <SelectItem key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
                {member.id === currentUserId && (locale === 'ru' ? ' (Я)' : ' (Me)')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t.categoryLabel}</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as MilestoneCategory)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MILESTONE_CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {t.categories[cat.id as keyof typeof t.categories] || cat.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>{t.typeLabel}</Label>
        <Select value={milestoneType} onValueChange={setMilestoneType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {getDefaultTitle(type.id, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>{t.titleLabel}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>{t.dateLabel}</Label>
        <Input
          type="date"
          value={milestoneDate}
          onChange={(e) => setMilestoneDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{t.descriptionLabel}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={3}
        />
      </div>

      {/* Media Upload */}
      <div className="space-y-2">
        <Label>{t.mediaLabel}</Label>
        <div className="space-y-3">
          {/* Preview grid */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
          >
            {uploadingMedia ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {t.uploadMedia}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <Label>{t.visibilityLabel}</Label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="family">{t.visibilityFamily}</SelectItem>
            <SelectItem value="public">{t.visibilityPublic}</SelectItem>
            <SelectItem value="private">{t.visibilityPrivate}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reminder Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-500" />
          <span className="font-medium">{t.reminderLabel}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={remindAnnually}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            remindAnnually ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          onClick={() => setRemindAnnually(!remindAnnually)}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              remindAnnually ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Reminder days (shown when remind is on) */}
      {remindAnnually && (
        <div className="space-y-2 pl-4 border-l-2 border-violet-500">
          <Label>{t.reminderDaysLabel}</Label>
          <Select
            value={reminderDaysBefore.toString()}
            onValueChange={(v) => setReminderDaysBefore(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 {locale === 'ru' ? 'день' : 'day'}</SelectItem>
              <SelectItem value="3">3 {locale === 'ru' ? 'дня' : 'days'}</SelectItem>
              <SelectItem value="7">7 {locale === 'ru' ? 'дней' : 'days'}</SelectItem>
              <SelectItem value="14">14 {locale === 'ru' ? 'дней' : 'days'}</SelectItem>
              <SelectItem value="30">30 {locale === 'ru' ? 'дней' : 'days'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          {t.cancel}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={loading || uploadingMedia}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
      </div>
    </div>
  );
}
