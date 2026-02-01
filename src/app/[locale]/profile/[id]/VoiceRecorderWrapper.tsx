'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceRecorder } from '@/components/voice';

interface Props {
  targetProfileId: string;
  locale: 'en' | 'ru';
}

const translations = {
  en: {
    recordStory: 'Record a Story',
    recordDescription: 'Share a memory or story about this person',
  },
  ru: {
    recordStory: 'Записать историю',
    recordDescription: 'Поделитесь воспоминанием или историей об этом человеке',
  },
};

export default function VoiceRecorderWrapper({ targetProfileId, locale }: Props) {
  const t = translations[locale];
  const [showRecorder, setShowRecorder] = useState(false);

  if (showRecorder) {
    return (
      <div className="mb-6">
        <VoiceRecorder
          targetProfileId={targetProfileId}
          locale={locale}
          onComplete={() => {
            setShowRecorder(false);
            // Trigger a page refresh to show the new story
            window.location.reload();
          }}
          onCancel={() => setShowRecorder(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.recordStory}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.recordDescription}</p>
        </div>
        <button
          onClick={() => setShowRecorder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors"
        >
          <Mic className="w-4 h-4" />
          {t.recordStory}
        </button>
      </div>
    </div>
  );
}
