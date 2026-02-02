'use client';

import { useState } from 'react';
import { Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickVoiceRecorder from './QuickVoiceRecorder';

interface Props {
  profileId?: string;
  profileName?: string;
  locale: 'en' | 'ru';
  onMemoryCreated?: () => void;
}

const translations = {
  en: {
    recordMemory: 'Record a memory',
    close: 'Close',
  },
  ru: {
    recordMemory: 'Записать воспоминание',
    close: 'Закрыть',
  },
};

/**
 * Floating action button for quick voice recording
 * Shows on profile pages, opens recorder in a modal/sheet
 */
export default function QuickVoiceButton({
  profileId,
  profileName,
  locale,
  onMemoryCreated,
}: Props) {
  const t = translations[locale];
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = () => {
    setIsOpen(false);
    onMemoryCreated?.();
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'flex items-center gap-2 px-4 py-3',
          'bg-gradient-to-r from-purple-600 to-purple-700',
          'hover:from-purple-700 hover:to-purple-800',
          'text-white font-medium rounded-full shadow-lg',
          'transition-all duration-200 hover:scale-105',
          'group'
        )}
        title={t.recordMemory}
      >
        <Mic className="w-5 h-5" />
        <span className="hidden sm:inline">{t.recordMemory}</span>
      </button>

      {/* Modal/Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
              title={t.close}
            >
              <X className="w-6 h-6" />
            </button>

            <QuickVoiceRecorder
              profileId={profileId}
              profileName={profileName}
              locale={locale}
              onComplete={handleComplete}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
