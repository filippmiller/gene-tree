'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QuestionVisibility } from '@/types/elder-questions';

interface AskElderFormProps {
  elderId: string;
  elderName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function AskElderForm({
  elderId,
  elderName,
  onSuccess,
  onCancel,
  className = '',
}: AskElderFormProps) {
  const t = useTranslations('elderQuestions');
  const [question, setQuestion] = useState('');
  const [visibility, setVisibility] = useState<QuestionVisibility>('family');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError(t('questionRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/elder-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elder_id: elderId,
          question: question.trim(),
          visibility,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit question');
      }

      setQuestion('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('askQuestion', { name: elderName })}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('questionPlaceholder')}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('visibility')}
        </label>
        <div className="flex gap-3">
          {(['family', 'private'] as QuestionVisibility[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setVisibility(opt)}
              className={`
                px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                ${
                  visibility === opt
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }
              `}
            >
              {opt === 'family' ? '👨‍👩‍👧‍👦 ' : '🔒 '}
              {t(`visibility.${opt}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {visibility === 'family' ? t('visibilityFamilyHint') : t('visibilityPrivateHint')}
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !question.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('askQuestion')}
        </button>
      </div>
    </form>
  );
}
