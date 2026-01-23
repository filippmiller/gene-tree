'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface AnswerFormProps {
  questionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function AnswerForm({
  questionId,
  onSuccess,
  onCancel,
  className = '',
}: AnswerFormProps) {
  const t = useTranslations('elderQuestions');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      setError(t('answerRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/elder-questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={t('writeAnswer')}
        rows={4}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={submitting}
      />

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submitAnswer')}
        </button>
      </div>
    </form>
  );
}
