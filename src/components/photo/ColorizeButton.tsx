'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';

interface ColorizeButtonProps {
  photoId: string;
  photoUrl?: string;
  onColorized?: (colorizedUrl: string, colorizedPhotoId?: string) => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export default function ColorizeButton({
  photoId,
  photoUrl,
  onColorized,
  onError,
  variant = 'secondary',
  size = 'sm',
  className = '',
  disabled = false,
}: ColorizeButtonProps) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const t = locale === 'ru' ? {
    colorize: 'Раскрасить',
    colorizing: 'Обрабатываем...',
    analyzing: 'Анализируем изображение...',
    processing: 'Добавляем цвета...',
    saving: 'Сохраняем результат...',
    error: 'Не удалось раскрасить фото',
    success: 'Фото раскрашено!',
  } : {
    colorize: 'Colorize',
    colorizing: 'Processing...',
    analyzing: 'Analyzing image...',
    processing: 'Adding colors...',
    saving: 'Saving result...',
    error: 'Failed to colorize photo',
    success: 'Photo colorized!',
  };

  const handleColorize = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setProgress(t.analyzing);

    try {
      // Simulate progress stages (actual processing happens on server)
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev === t.analyzing) return t.processing;
          if (prev === t.processing) return t.saving;
          return prev;
        });
      }, 5000);

      const response = await fetch('/api/photo/colorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          photoUrl,
        }),
      });

      clearInterval(progressTimer);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.error);
      }

      setProgress(t.success);
      onColorized?.(data.colorizedUrl, data.colorizedPhotoId);

      // Reset after short delay to show success
      setTimeout(() => {
        setProgress('');
      }, 2000);

    } catch (error: any) {
      console.error('[ColorizeButton] Error:', error);
      const errorMessage = error.message || t.error;
      setProgress('');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleColorize}
      disabled={loading || disabled}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="truncate max-w-[120px]">{progress || t.colorizing}</span>
        </>
      ) : progress === t.success ? (
        <>
          <Sparkles className="w-4 h-4 text-green-500" />
          {t.success}
        </>
      ) : (
        <>
          <Palette className="w-4 h-4" />
          {t.colorize}
        </>
      )}
    </Button>
  );
}
