'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from 'next-intl';
import { Wand2, Palette, Sparkles, Image as ImageIcon } from 'lucide-react';
import ColorizeButton from './ColorizeButton';
import BeforeAfter from './BeforeAfter';

interface PhotoMagicDialogProps {
  photoId: string;
  photoUrl: string;
  photoCaption?: string;
  trigger?: React.ReactNode;
  onEnhanced?: (newPhotoId: string, newPhotoUrl: string) => void;
}

type EnhancementType = 'colorize' | 'enhance' | 'restore';

interface Enhancement {
  type: EnhancementType;
  icon: React.ReactNode;
  title: string;
  description: string;
  available: boolean;
}

export default function PhotoMagicDialog({
  photoId,
  photoUrl,
  photoCaption,
  trigger,
  onEnhanced,
}: PhotoMagicDialogProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState<EnhancementType | null>(null);
  const [result, setResult] = useState<{
    type: EnhancementType;
    beforeUrl: string;
    afterUrl: string;
    newPhotoId?: string;
    isDemo?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = locale === 'ru' ? {
    title: 'Магия фото',
    subtitle: 'Улучшите старые фотографии с помощью ИИ',
    colorize: 'Раскрасить',
    colorizeDesc: 'Добавить цвета к черно-белому фото',
    enhance: 'Улучшить качество',
    enhanceDesc: 'Повысить разрешение и четкость',
    restore: 'Реставрировать',
    restoreDesc: 'Восстановить поврежденное фото',
    comingSoon: 'Скоро',
    processing: 'Обработка...',
    back: 'Назад',
    save: 'Сохранить',
    tryAnother: 'Попробовать другое',
    errorTitle: 'Ошибка',
    demoNotice: 'Демо-режим: API не настроен. Настройте REPLICATE_API_TOKEN для реального раскрашивания.',
  } : {
    title: 'Photo Magic',
    subtitle: 'Enhance old photos with AI',
    colorize: 'Colorize',
    colorizeDesc: 'Add colors to black & white photos',
    enhance: 'Enhance Quality',
    enhanceDesc: 'Increase resolution and clarity',
    restore: 'Restore',
    restoreDesc: 'Fix damaged or faded photos',
    comingSoon: 'Coming Soon',
    processing: 'Processing...',
    back: 'Back',
    save: 'Save',
    tryAnother: 'Try Another',
    errorTitle: 'Error',
    demoNotice: 'Demo mode: API not configured. Set REPLICATE_API_TOKEN for real colorization.',
  };

  const enhancements: Enhancement[] = [
    {
      type: 'colorize',
      icon: <Palette className="w-5 h-5" />,
      title: t.colorize,
      description: t.colorizeDesc,
      available: true,
    },
    {
      type: 'enhance',
      icon: <Sparkles className="w-5 h-5" />,
      title: t.enhance,
      description: t.enhanceDesc,
      available: false, // Coming soon
    },
    {
      type: 'restore',
      icon: <ImageIcon className="w-5 h-5" />,
      title: t.restore,
      description: t.restoreDesc,
      available: false, // Coming soon
    },
  ];

  const handleColorized = (colorizedUrl: string, colorizedPhotoId?: string, isDemo?: boolean) => {
    setResult({
      type: 'colorize',
      beforeUrl: photoUrl,
      afterUrl: colorizedUrl,
      newPhotoId: colorizedPhotoId,
      isDemo,
    });
    setProcessing(null);
    setError(null);

    if (colorizedPhotoId && colorizedUrl) {
      onEnhanced?.(colorizedPhotoId, colorizedUrl);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setProcessing(null);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProcessing(null);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog animation
    setTimeout(() => {
      handleReset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className="gap-2">
            <Wand2 className="w-4 h-4" />
            {t.title}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show result comparison */}
          {result && (
            <div className="space-y-4">
              {/* Demo mode notice */}
              {result.isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                  <p>{t.demoNotice}</p>
                </div>
              )}
              <BeforeAfter
                beforeUrl={result.beforeUrl}
                afterUrl={result.afterUrl}
                showControls={true}
                onClose={handleReset}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                  {t.tryAnother}
                </Button>
                <Button onClick={handleClose}>{t.save}</Button>
              </div>
            </div>
          )}

          {/* Show error */}
          {error && !result && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">{t.errorTitle}</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                {t.back}
              </Button>
            </div>
          )}

          {/* Show enhancement options */}
          {!result && !error && (
            <>
              {/* Preview of original image */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={photoUrl}
                  alt={photoCaption || 'Photo to enhance'}
                  className="w-full max-h-64 object-contain"
                />
                {photoCaption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-3 py-2">
                    {photoCaption}
                  </div>
                )}
              </div>

              {/* Enhancement options */}
              <div className="grid gap-3">
                {enhancements.map((enhancement) => (
                  <div
                    key={enhancement.type}
                    className={`
                      relative flex items-center gap-4 p-4 rounded-lg border transition-all
                      ${
                        enhancement.available
                          ? 'hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      }
                      ${processing === enhancement.type ? 'border-purple-500 bg-purple-50' : ''}
                    `}
                  >
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        ${enhancement.available ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}
                      `}
                    >
                      {enhancement.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{enhancement.title}</span>
                        {!enhancement.available && (
                          <Badge variant="secondary" className="text-xs">
                            {t.comingSoon}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{enhancement.description}</p>
                    </div>

                    {enhancement.available && enhancement.type === 'colorize' && (
                      <ColorizeButton
                        photoId={photoId}
                        photoUrl={photoUrl}
                        onColorized={handleColorized}
                        onError={handleError}
                        variant="default"
                        size="default"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
