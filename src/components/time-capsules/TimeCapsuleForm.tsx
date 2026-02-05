'use client';

import { useState, useRef } from 'react';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Upload,
  X,
  Loader2,
  Mic,
  Video,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CreateTimeCapsuleRequest,
  CapsuleMediaType,
  DeliveryTrigger,
  TimeCapsuleWithProfiles,
} from '@/lib/time-capsules/types';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface TimeCapsuleFormProps {
  locale: string;
  currentUserId: string;
  familyMembers: Profile[];
  initialData?: TimeCapsuleWithProfiles;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TimeCapsuleForm({
  locale,
  currentUserId,
  familyMembers,
  initialData,
  onSuccess,
  onCancel,
}: TimeCapsuleFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Special value for "To My Family" option (Radix Select doesn't allow empty strings)
  const FAMILY_BROADCAST_VALUE = '__family_broadcast__';

  // Form state
  const [recipientId, setRecipientId] = useState<string>(
    initialData?.recipient_profile_id || FAMILY_BROADCAST_VALUE
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [message, setMessage] = useState(initialData?.message || '');
  const [deliveryDate, setDeliveryDate] = useState<Date>(
    initialData
      ? new Date(initialData.scheduled_delivery_date)
      : addDays(new Date(), 30)
  );
  const [deliveryTrigger, setDeliveryTrigger] = useState<DeliveryTrigger>(
    initialData?.delivery_trigger || 'date'
  );

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<CapsuleMediaType>(
    initialData?.media_type || null
  );
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(
    initialData?.media_url || null
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = locale === 'ru' ? {
    createTitle: 'Создать капсулу времени',
    editTitle: 'Редактировать капсулу',
    recipientLabel: 'Кому адресована?',
    selectRecipient: 'Выберите получателя',
    toFamily: 'Всей семье',
    titleLabel: 'Заголовок',
    titlePlaceholder: 'Дайте название вашему посланию',
    messageLabel: 'Сообщение',
    messagePlaceholder: 'Напишите своё послание в будущее...',
    deliveryDateLabel: 'Дата доставки',
    pickDate: 'Выберите дату',
    deliveryTriggerLabel: 'Когда доставить?',
    triggerDate: 'В определённую дату',
    triggerAfterPassing: 'После моего ухода',
    addMedia: 'Добавить файл',
    removeMedia: 'Удалить файл',
    seal: 'Запечатать капсулу',
    save: 'Сохранить изменения',
    cancel: 'Отмена',
    saving: 'Сохранение...',
    errorRequired: 'Заголовок обязателен',
    errorUpload: 'Ошибка загрузки файла',
  } : {
    createTitle: 'Create Time Capsule',
    editTitle: 'Edit Time Capsule',
    recipientLabel: 'Who is this for?',
    selectRecipient: 'Select recipient',
    toFamily: 'To My Family',
    titleLabel: 'Title',
    titlePlaceholder: 'Give your message a title',
    messageLabel: 'Message',
    messagePlaceholder: 'Write your message for the future...',
    deliveryDateLabel: 'Delivery Date',
    pickDate: 'Pick a date',
    deliveryTriggerLabel: 'When to deliver?',
    triggerDate: 'On a specific date',
    triggerAfterPassing: 'After I\'m gone',
    addMedia: 'Add attachment',
    removeMedia: 'Remove attachment',
    seal: 'Seal Time Capsule',
    save: 'Save Changes',
    cancel: 'Cancel',
    saving: 'Saving...',
    errorRequired: 'Title is required',
    errorUpload: 'Failed to upload file',
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine media type
    let type: CapsuleMediaType = null;
    if (file.type.startsWith('audio/')) type = 'audio';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('image/')) type = 'image';

    if (!type) {
      setError('Invalid file type');
      return;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    setExistingMediaUrl(null);

    // Create preview for images
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreview(null);
    setExistingMediaUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile) return existingMediaUrl;

    // Get signed upload URL
    const signedRes = await fetch('/api/time-capsules/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_size_bytes: mediaFile.size,
        content_type: mediaFile.type,
      }),
    });

    if (!signedRes.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { upload_url, storage_path } = await signedRes.json();

    // Upload file
    const uploadRes = await fetch(upload_url, {
      method: 'PUT',
      body: mediaFile,
      headers: {
        'Content-Type': mediaFile.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file');
    }

    return storage_path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t.errorRequired);
      return;
    }

    setLoading(true);

    try {
      // Upload media if present
      let mediaUrl: string | null = null;
      if (mediaFile || existingMediaUrl) {
        mediaUrl = await uploadMedia();
      }

      const payload: CreateTimeCapsuleRequest = {
        recipient_profile_id: recipientId === FAMILY_BROADCAST_VALUE ? null : recipientId,
        title: title.trim(),
        message: message.trim() || null,
        media_type: mediaUrl ? mediaType : null,
        media_url: mediaUrl,
        scheduled_delivery_date: deliveryDate.toISOString(),
        delivery_trigger: deliveryTrigger,
      };

      const url = initialData
        ? `/api/time-capsules/${initialData.id}`
        : '/api/time-capsules';

      const method = initialData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save time capsule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        {initialData ? t.editTitle : t.createTitle}
      </h2>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Recipient Selection */}
      <div className="space-y-2">
        <Label>{t.recipientLabel}</Label>
        <Select value={recipientId} onValueChange={setRecipientId}>
          <SelectTrigger>
            <SelectValue placeholder={t.selectRecipient} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FAMILY_BROADCAST_VALUE}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{t.toFamily}</span>
              </div>
            </SelectItem>
            {familyMembers
              .filter((m) => m.id !== currentUserId)
              .map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t.titleLabel}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          maxLength={200}
          required
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">{t.messageLabel}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          rows={5}
          maxLength={10000}
        />
      </div>

      {/* Delivery Date */}
      <div className="space-y-2">
        <Label htmlFor="deliveryDate">{t.deliveryDateLabel}</Label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="deliveryDate"
            type="date"
            value={format(deliveryDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                setDeliveryDate(date);
              }
            }}
            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Delivery Trigger */}
      <div className="space-y-2">
        <Label>{t.deliveryTriggerLabel}</Label>
        <Select
          value={deliveryTrigger}
          onValueChange={(v) => setDeliveryTrigger(v as DeliveryTrigger)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t.triggerDate}</SelectItem>
            <SelectItem value="after_passing">{t.triggerAfterPassing}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Upload */}
      <div className="space-y-2">
        <Label>{t.addMedia}</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*,image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!mediaFile && !existingMediaUrl ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {t.addMedia}
          </Button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            {mediaType === 'image' && mediaPreview && (
              <img
                src={mediaPreview}
                alt=""
                className="w-12 h-12 rounded object-cover"
              />
            )}
            {mediaType === 'audio' && (
              <div className="w-12 h-12 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Mic className="w-6 h-6 text-violet-600" />
              </div>
            )}
            {mediaType === 'video' && (
              <div className="w-12 h-12 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Video className="w-6 h-6 text-violet-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {mediaFile?.name || existingMediaUrl?.split('/').pop()}
              </p>
              {mediaFile && (
                <p className="text-xs text-muted-foreground">
                  {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveMedia}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.saving}
            </>
          ) : initialData ? (
            t.save
          ) : (
            t.seal
          )}
        </Button>
      </div>
    </form>
  );
}
