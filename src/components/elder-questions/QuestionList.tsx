'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ElderQuestionWithProfiles } from '@/types/elder-questions';
import { getStatusLabel, getStatusColor, getVisibilityIcon } from '@/types/elder-questions';
import AnswerForm from './AnswerForm';

interface QuestionListProps {
  role?: 'asker' | 'elder' | 'all';
  status?: 'pending' | 'answered' | 'declined';
  currentUserId: string;
  className?: string;
}

export default function QuestionList({
  role = 'all',
  status,
  currentUserId,
  className = '',
}: QuestionListProps) {
  const t = useTranslations('elderQuestions');
  const [questions, setQuestions] = useState<ElderQuestionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [role, status]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `/api/elder-questions?role=${role}`;
      if (status) url += `&status=${status}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load questions');
      }

      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    setAnsweringId(null);
    fetchQuestions();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 text-red-700 rounded-lg p-4 ${className}`}>
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <div className="text-4xl mb-4">❓</div>
        <p>{t('noQuestions')}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {questions.map((question) => {
        const isElder = question.elder_id === currentUserId;
        const isAsker = question.asker_id === currentUserId;
        const canAnswer = isElder && question.status === 'pending';

        return (
          <div
            key={question.id}
            className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {question.asker?.avatar_url ? (
                  <img
                    src={question.asker.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {question.asker?.first_name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <span className="font-medium text-sm">
                    {isAsker ? t('you') : `${question.asker?.first_name} ${question.asker?.last_name}`}
                  </span>
                  <span className="text-gray-400 mx-1">{t('askedTo')}</span>
                  <span className="font-medium text-sm">
                    {isElder ? t('you') : `${question.elder?.first_name} ${question.elder?.last_name}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {getVisibilityIcon(question.visibility)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(question.status)}`}>
                  {getStatusLabel(question.status)}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="mb-3">
              <p className="text-gray-800 font-medium">{question.question}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(question.created_at)}
              </p>
            </div>

            {/* Answer */}
            {question.status === 'answered' && question.answer && (
              <div className="bg-green-50 rounded-lg p-3 mt-3">
                <p className="text-gray-700">{question.answer}</p>
                {question.answered_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('answeredOn')} {formatDate(question.answered_at)}
                  </p>
                )}
              </div>
            )}

            {/* Declined */}
            {question.status === 'declined' && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3 text-gray-500 text-sm">
                {t('questionDeclined')}
              </div>
            )}

            {/* Answer Form */}
            {canAnswer && answeringId === question.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <AnswerForm
                  questionId={question.id}
                  onSuccess={handleAnswerSubmit}
                  onCancel={() => setAnsweringId(null)}
                />
              </div>
            )}

            {/* Actions */}
            {canAnswer && answeringId !== question.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setAnsweringId(question.id)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('answer')}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(t('confirmDecline'))) return;
                    await fetch(`/api/elder-questions/${question.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ decline: true }),
                    });
                    fetchQuestions();
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('decline')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
