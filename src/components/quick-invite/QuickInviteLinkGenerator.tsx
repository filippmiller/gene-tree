'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ShareButtons } from './ShareButtons';
import { Link2, Copy, Check, Plus } from 'lucide-react';
import type { QuickInviteLink, QuickLinkExpiration } from '@/types/quick-invite';

interface QuickInviteLinkGeneratorProps {
  locale?: string;
  onLinkCreated?: (link: QuickInviteLink) => void;
}

const translations = {
  en: {
    title: 'Create Quick Invite Link',
    description: 'Generate a shareable link with QR code for your family event',
    createLink: 'Create Invite Link',
    generating: 'Generating...',
    eventName: 'Event Name (optional)',
    eventNamePlaceholder: 'e.g., Smith Family Reunion 2026',
    expiration: 'Link Expires In',
    maxUses: 'Maximum Uses',
    linkReady: 'Your Link is Ready!',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    shareLink: 'Share this link',
    createAnother: 'Create Another',
    expirations: {
      '1h': '1 hour',
      '6h': '6 hours',
      '24h': '24 hours',
      '7d': '7 days',
    },
  },
  ru: {
    title: 'Создать быструю ссылку-приглашение',
    description: 'Сгенерируйте ссылку с QR-кодом для вашего семейного события',
    createLink: 'Создать ссылку',
    generating: 'Генерация...',
    eventName: 'Название события (опционально)',
    eventNamePlaceholder: 'напр., Воссоединение семьи Ивановых 2026',
    expiration: 'Ссылка истекает через',
    maxUses: 'Максимум использований',
    linkReady: 'Ваша ссылка готова!',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    shareLink: 'Поделиться ссылкой',
    createAnother: 'Создать ещё',
    expirations: {
      '1h': '1 час',
      '6h': '6 часов',
      '24h': '24 часа',
      '7d': '7 дней',
    },
  },
};

export function QuickInviteLinkGenerator({
  locale = 'en',
  onLinkCreated,
}: QuickInviteLinkGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [expiration, setExpiration] = useState<QuickLinkExpiration>('24h');
  const [maxUses, setMaxUses] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<QuickInviteLink | null>(null);
  const [copied, setCopied] = useState(false);

  const t = translations[locale as keyof typeof translations] || translations.en;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/quick-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiration,
          maxUses,
          eventName: eventName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link');
      }

      const data = await response.json();
      setGeneratedLink(data.link);
      onLinkCreated?.(data.link);
    } catch (error) {
      console.error('Error creating link:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    const url = `${window.location.origin}/join/${generatedLink.code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setEventName('');
    setExpiration('24h');
    setMaxUses(50);
  };

  const fullUrl = generatedLink
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${generatedLink.code}`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button leftIcon={<Link2 className="h-4 w-4" />}>
          {t.createLink}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{generatedLink ? t.linkReady : t.title}</DialogTitle>
          <DialogDescription>
            {!generatedLink && t.description}
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="eventName">{t.eventName}</Label>
              <Input
                id="eventName"
                placeholder={t.eventNamePlaceholder}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label>{t.expiration}</Label>
              <Select value={expiration} onValueChange={(v) => setExpiration(v as QuickLinkExpiration)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['1h', '6h', '24h', '7d'] as const).map((exp) => (
                    <SelectItem key={exp} value={exp}>
                      {t.expirations[exp]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="maxUses">{t.maxUses}</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                max={500}
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 50)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              loading={isGenerating}
            >
              {isGenerating ? t.generating : t.createLink}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* QR Code */}
            <QRCodeDisplay
              url={fullUrl}
              code={generatedLink.code}
              eventName={generatedLink.event_name}
              locale={locale}
            />

            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <Input
                value={fullUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="space-y-2">
              <Label>{t.shareLink}</Label>
              <ShareButtons
                url={fullUrl}
                eventName={generatedLink.event_name}
                locale={locale}
              />
            </div>

            {/* Create Another */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {t.createAnother}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
