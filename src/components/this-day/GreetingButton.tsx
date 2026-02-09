'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SendGreetingRequest } from '@/types/this-day';

interface GreetingButtonProps {
  eventId: string;
  greetingType: 'birthday' | 'anniversary' | 'memorial';
  defaultMessage?: string;
  onSent?: () => void;
}

export default function GreetingButton({
  eventId,
  greetingType,
  defaultMessage,
  onSent,
}: GreetingButtonProps) {
  const t = useTranslations('thisDay');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (sending || sent) return;

    setSending(true);
    setError(null);

    try {
      const body: SendGreetingRequest = {
        event_id: eventId,
        greeting_type: greetingType,
        message: defaultMessage,
      };

      const res = await fetch('/api/this-day/send-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send greeting');
      }

      setSent(true);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <span className="text-green-600 text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {t('greetingSent')}
      </span>
    );
  }

  if (error) {
    return (
      <button
        onClick={handleClick}
        className="text-red-600 text-sm hover:text-red-700"
        title={error}
      >
        {t('retry')}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        ${greetingType === 'birthday'
          ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
          : 'bg-[#58A6FF]/10 text-[#58A6FF] hover:bg-[#58A6FF]/20'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {sending ? (
        <span className="flex items-center gap-1">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          {greetingType === 'birthday' ? '🎉' : '💝'}
          {t('sendGreeting')}
        </span>
      )}
    </button>
  );
}
