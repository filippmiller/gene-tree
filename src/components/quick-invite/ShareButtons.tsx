'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  eventName?: string | null;
  locale?: string;
}

const translations = {
  en: {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    email: 'Email',
    share: 'Share',
    defaultMessage: 'Join our family tree! Use this link to sign up:',
    eventMessage: 'You are invited to {event}! Join our family tree:',
    emailSubject: 'Family Tree Invitation',
  },
  ru: {
    whatsapp: 'WhatsApp',
    sms: 'СМС',
    email: 'Email',
    share: 'Поделиться',
    defaultMessage: 'Присоединяйтесь к нашему семейному дереву! Используйте эту ссылку:',
    eventMessage: 'Вы приглашены на {event}! Присоединяйтесь к семейному дереву:',
    emailSubject: 'Приглашение в семейное дерево',
  },
};

export function ShareButtons({ url, eventName, locale = 'en' }: ShareButtonsProps) {
  const t = translations[locale as keyof typeof translations] || translations.en;

  const getMessage = () => {
    if (eventName) {
      return t.eventMessage.replace('{event}', eventName) + '\n\n' + url;
    }
    return t.defaultMessage + '\n\n' + url;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(getMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleSMS = () => {
    const message = encodeURIComponent(getMessage());
    // Use sms: protocol - works on mobile devices
    window.location.href = `sms:?body=${message}`;
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(eventName || t.emailSubject);
    const body = encodeURIComponent(getMessage());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName || t.emailSubject,
          text: getMessage(),
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(url);
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        className="flex-1 min-w-[100px] bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {t.whatsapp}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSMS}
        className="flex-1 min-w-[100px] bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {t.sms}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEmail}
        className="flex-1 min-w-[100px] bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
      >
        <Mail className="h-4 w-4 mr-2" />
        {t.email}
      </Button>

      {hasNativeShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex-1 min-w-[100px]"
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t.share}
        </Button>
      )}
    </div>
  );
}
