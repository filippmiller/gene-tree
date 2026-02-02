'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceMemories } from '@/hooks/useVoiceMemories';
import type { VoiceMemoryPrivacyLevel } from '@/types/voice-memory';

const MAX_DURATION = 60;

interface Props {
  profileId?: string;
  profileName?: string;
  locale: 'en' | 'ru';
  onComplete?: () => void;
  onCancel?: () => void;
}

const translations = {
  en: {
    title: 'Quick Voice Memory',
    recordHint: 'Tap to start recording',
    recording: 'Recording...',
    maxDuration: `Max ${MAX_DURATION} seconds`,
    preview: 'Preview',
    stopRecording: 'Tap to stop',
    play: 'Play',
    pause: 'Pause',
    reRecord: 'Re-record',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    titleLabel: 'Title (optional)',
    titlePlaceholder: 'e.g., "Memory of summer 1985"',
    privacyLabel: 'Who can see this?',
    privacyFamily: 'Family',
    privacyPrivate: 'Only me',
    privacyPublic: 'Everyone',
    aboutPerson: 'About',
    success: 'Memory saved!',
    micPermissionDenied: 'Microphone access denied. Please allow microphone access in your browser settings.',
    browserNotSupported: 'Your browser does not support audio recording. Please try Chrome, Firefox, or Safari.',
    autoStopWarning: 'Recording will auto-stop at 60 seconds',
  },
  ru: {
    title: 'Быстрая голосовая запись',
    recordHint: 'Нажмите, чтобы начать запись',
    recording: 'Запись...',
    maxDuration: `Макс. ${MAX_DURATION} секунд`,
    preview: 'Предпросмотр',
    stopRecording: 'Нажмите, чтобы остановить',
    play: 'Воспроизвести',
    pause: 'Пауза',
    reRecord: 'Записать заново',
    save: 'Сохранить',
    saving: 'Сохранение...',
    cancel: 'Отмена',
    titleLabel: 'Название (необязательно)',
    titlePlaceholder: 'напр., "Воспоминание о лете 1985"',
    privacyLabel: 'Кто может видеть?',
    privacyFamily: 'Семья',
    privacyPrivate: 'Только я',
    privacyPublic: 'Все',
    aboutPerson: 'О',
    success: 'Запись сохранена!',
    micPermissionDenied: 'Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.',
    browserNotSupported: 'Ваш браузер не поддерживает запись звука. Попробуйте Chrome, Firefox или Safari.',
    autoStopWarning: 'Запись автоматически остановится через 60 секунд',
  },
};

type RecorderState = 'idle' | 'recording' | 'preview' | 'saving' | 'done';

export default function QuickVoiceRecorder({
  profileId,
  profileName,
  locale,
  onComplete,
  onCancel,
}: Props) {
  const t = translations[locale];

  const [state, setState] = useState<RecorderState>('idle');
  const [title, setTitle] = useState('');
  const [privacy, setPrivacy] = useState<VoiceMemoryPrivacyLevel>('family');
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    error: recorderError,
    hasPermission,
    waveformData,
    isSupported,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const { createMemory } = useVoiceMemories({ autoLoad: false });

  // Sync recorder state with component state
  useEffect(() => {
    if (isRecording) {
      setState('recording');
    } else if (audioBlob && state === 'recording') {
      setState('preview');
    }
  }, [isRecording, audioBlob, state]);

  // Auto-stop at max duration
  useEffect(() => {
    if (duration >= MAX_DURATION && isRecording) {
      stopRecording();
    }
  }, [duration, isRecording, stopRecording]);

  const handleStartRecording = useCallback(async () => {
    setSaveError(null);
    await startRecording();
  }, [startRecording]);

  const handlePlayPause = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  const handleReset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    resetRecording();
    setState('idle');
    setSaveError(null);
  }, [resetRecording]);

  const handleSave = useCallback(async () => {
    if (!audioBlob) return;

    setState('saving');
    setSaveError(null);

    try {
      const result = await createMemory(audioBlob, {
        profile_id: profileId,
        title: title.trim() || undefined,
        duration_seconds: duration,
        privacy_level: privacy,
      });

      if (result) {
        setState('done');
        setTimeout(() => {
          onComplete?.();
        }, 1500);
      } else {
        setSaveError('Failed to save memory');
        setState('preview');
      }
    } catch (err) {
      console.error('[QuickVoiceRecorder] Save error:', err);
      setSaveError('Failed to save memory');
      setState('preview');
    }
  }, [audioBlob, createMemory, profileId, title, duration, privacy, onComplete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Browser not supported
  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Mic className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-orange-700 dark:text-orange-400">{t.browserNotSupported}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 text-gray-500 dark:text-gray-400 text-sm"
          >
            {t.cancel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.title}</h3>
        {profileName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.aboutPerson} {profileName}
          </p>
        )}
      </div>

      {/* Idle State */}
      {state === 'idle' && (
        <div className="flex flex-col items-center py-6 space-y-4">
          <button
            onClick={handleStartRecording}
            disabled={hasPermission === false}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg',
              'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
              'hover:scale-105 active:scale-95',
              hasPermission === false && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Mic className="w-10 h-10 text-white" />
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.recordHint}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{t.maxDuration}</p>
        </div>
      )}

      {/* Recording State */}
      {state === 'recording' && (
        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Waveform */}
          <div className="flex items-end justify-center h-16 gap-1 w-full max-w-xs">
            {waveformData.length > 0 ? (
              waveformData.map((value, index) => (
                <div
                  key={index}
                  className="w-2 bg-gradient-to-t from-red-500 to-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(8, value * 64)}px` }}
                />
              ))
            ) : (
              Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-3 bg-red-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
              {formatDuration(duration)}
            </div>
            <div className="text-sm text-red-500 animate-pulse mt-1">{t.recording}</div>
          </div>

          {/* Stop Button */}
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors shadow-lg animate-pulse"
          >
            <Square className="w-8 h-8 text-white" fill="white" />
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.stopRecording}</p>

          {/* Auto-stop warning near max */}
          {duration >= 50 && (
            <p className="text-xs text-orange-500">{t.autoStopWarning}</p>
          )}
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && (
        <div className="space-y-4">
          {/* Playback */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white transition-colors flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div>
                <p className="font-mono text-lg text-gray-900 dark:text-white">
                  {formatDuration(duration)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.preview}</p>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.titleLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Privacy Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.privacyLabel}
            </label>
            <div className="flex gap-2">
              {(['family', 'private', 'public'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setPrivacy(level)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    privacy === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {level === 'family' && t.privacyFamily}
                  {level === 'private' && t.privacyPrivate}
                  {level === 'public' && t.privacyPublic}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {saveError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t.reRecord}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Saving State */}
      {state === 'saving' && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t.saving}</p>
        </div>
      )}

      {/* Done State */}
      {state === 'done' && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-700 dark:text-green-400 font-medium">{t.success}</p>
        </div>
      )}

      {/* Microphone Permission Error */}
      {(recorderError || hasPermission === false) && state === 'idle' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-orange-700 dark:text-orange-400 text-sm">
            {recorderError || t.micPermissionDenied}
          </p>
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && state !== 'saving' && state !== 'done' && (
        <button
          onClick={onCancel}
          className="w-full text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm py-2"
        >
          {t.cancel}
        </button>
      )}
    </div>
  );
}
