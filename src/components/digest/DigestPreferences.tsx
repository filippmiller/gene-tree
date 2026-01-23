'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type {
  EmailPreferences,
  UpdateEmailPreferencesRequest,
  DigestDay
} from '@/types/email-preferences';
import {
  DEFAULT_EMAIL_PREFERENCES,
  DIGEST_DAY_OPTIONS,
  EMAIL_PREFERENCE_FIELDS
} from '@/types/email-preferences';

interface DigestPreferencesProps {
  className?: string;
}

export default function DigestPreferences({ className = '' }: DigestPreferencesProps) {
  const t = useTranslations('emailPreferences');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>(DEFAULT_EMAIL_PREFERENCES);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch('/api/digest/preferences');
        if (!res.ok) throw new Error('Failed to fetch preferences');
        const data = await res.json();
        setPreferences(data.preferences);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const handleToggle = async (key: keyof Omit<EmailPreferences, 'digest_day'>) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    await savePreference({ [key]: newValue });
  };

  const handleDayChange = async (day: DigestDay) => {
    setPreferences(prev => ({ ...prev, digest_day: day }));
    await savePreference({ digest_day: day });
  };

  const savePreference = async (update: UpdateEmailPreferencesRequest) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/digest/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      // Revert on error
      const res = await fetch('/api/digest/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('title')}
        </h2>

        {/* Status indicators */}
        {saving && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('saving')}
          </span>
        )}
        {success && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('saved')}
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Toggle preferences */}
        {EMAIL_PREFERENCE_FIELDS.map(field => (
          <div key={field.key} className="flex items-start justify-between gap-4">
            <div>
              <label className="font-medium text-gray-900">
                {t(`fields.${field.key}.label`)}
              </label>
              <p className="text-sm text-gray-500">
                {t(`fields.${field.key}.description`)}
              </p>
            </div>

            <button
              role="switch"
              aria-checked={preferences[field.key]}
              onClick={() => handleToggle(field.key)}
              disabled={saving}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                border-2 border-transparent transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${preferences[field.key] ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${preferences[field.key] ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        ))}

        {/* Digest day selector */}
        {preferences.weekly_digest && (
          <div className="pt-4 border-t">
            <label className="font-medium text-gray-900 block mb-2">
              {t('digestDay.label')}
            </label>
            <select
              value={preferences.digest_day}
              onChange={(e) => handleDayChange(e.target.value as DigestDay)}
              disabled={saving}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {DIGEST_DAY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`digestDay.days.${option.value}`)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
