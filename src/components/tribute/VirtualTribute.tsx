'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TributeType, CreateTributeEntryRequest } from '@/types/tribute';

interface VirtualTributeProps {
  profileId: string;
  onSuccess?: () => void;
  className?: string;
}

const TRIBUTE_OPTIONS: { type: TributeType; emoji: string; labelKey: string }[] = [
  { type: 'message', emoji: '💬', labelKey: 'writeMessage' },
  { type: 'flower', emoji: '🌹', labelKey: 'leaveFlower' },
  { type: 'candle', emoji: '🕯️', labelKey: 'lightCandle' },
];

export default function VirtualTribute({
  profileId,
  onSuccess,
  className = '',
}: VirtualTributeProps) {
  const t = useTranslations('tribute');
  const [selectedType, setSelectedType] = useState<TributeType>('message');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;

    // For message type, require some content
    if (selectedType === 'message' && !message.trim()) {
      setError(t('messageRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: CreateTributeEntryRequest = {
        tribute_profile_id: profileId,
        tribute_type: selectedType,
        ...(message.trim() && { message: message.trim() }),
      };

      const res = await fetch(`/api/tribute/${profileId}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit tribute');
      }

      setSuccess(true);
      setMessage('');

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">
          {selectedType === 'flower' ? '🌹' : selectedType === 'candle' ? '🕯️' : '💝'}
        </div>
        <p className="text-green-600 font-medium">{t('tributeSubmitted')}</p>
        <p className="text-sm text-gray-500 mt-2">{t('thankYou')}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tribute Type Selection */}
      <div className="flex gap-3 justify-center">
        {TRIBUTE_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => setSelectedType(option.type)}
            className={`
              flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
              ${
                selectedType === option.type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }
            `}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className="text-sm font-medium">{t(option.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Message Input (for message type or optional for others) */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            selectedType === 'message'
              ? t('writeMemory')
              : t('optionalMessage')
          }
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {message.length}/500
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('submitting') : t('submitTribute')}
        </button>
      </div>
    </div>
  );
}
