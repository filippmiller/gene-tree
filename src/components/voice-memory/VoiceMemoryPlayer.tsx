'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Download, Trash2, Clock, User, Globe, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceMemoryWithProfile, VoiceMemoryPrivacyLevel } from '@/types/voice-memory';

interface Props {
  memory: VoiceMemoryWithProfile;
  playbackUrl?: string;
  canDelete?: boolean;
  onDelete?: () => void;
  onPlay?: () => Promise<string | null | undefined>; // Returns playback URL
  locale: 'en' | 'ru';
}

const translations = {
  en: {
    play: 'Play',
    pause: 'Pause',
    download: 'Download',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this memory?',
    recordedBy: 'Recorded by',
    about: 'About',
    privacyFamily: 'Family only',
    privacyPrivate: 'Private',
    privacyPublic: 'Public',
    loading: 'Loading...',
    noTitle: 'Untitled memory',
  },
  ru: {
    play: 'Воспроизвести',
    pause: 'Пауза',
    download: 'Скачать',
    delete: 'Удалить',
    confirmDelete: 'Вы уверены, что хотите удалить эту запись?',
    recordedBy: 'Записал(а)',
    about: 'О',
    privacyFamily: 'Только семья',
    privacyPrivate: 'Личное',
    privacyPublic: 'Публичное',
    loading: 'Загрузка...',
    noTitle: 'Без названия',
  },
};

const privacyIcons: Record<VoiceMemoryPrivacyLevel, React.ReactNode> = {
  public: <Globe className="w-3 h-3" />,
  family: <Users className="w-3 h-3" />,
  private: <Lock className="w-3 h-3" />,
};

export default function VoiceMemoryPlayer({
  memory,
  playbackUrl: initialPlaybackUrl,
  canDelete = false,
  onDelete,
  onPlay,
  locale,
}: Props) {
  const t = translations[locale];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState(initialPlaybackUrl);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    // Get playback URL if not available
    let url: string | undefined = playbackUrl;
    if (!url && onPlay) {
      setIsLoading(true);
      const result = await onPlay();
      url = result ?? undefined;
      setIsLoading(false);

      if (!url) {
        return; // Failed to get URL
      }
      setPlaybackUrl(url);
    }

    if (!url) return;

    // Create or reuse audio element
    if (!audioRef.current || audioRef.current.src !== url) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }

    // Play
    try {
      await audioRef.current.play();
      setIsPlaying(true);

      // Update progress
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const duration = audioRef.current.duration || memory.duration_seconds;
          setProgress((current / duration) * 100);
        }
      }, 100);
    } catch (err) {
      console.error('[VoiceMemoryPlayer] Play error:', err);
    }
  }, [isPlaying, playbackUrl, onPlay, memory.duration_seconds]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * (audioRef.current.duration || memory.duration_seconds);

    audioRef.current.currentTime = time;
    setProgress(percentage * 100);
  }, [memory.duration_seconds]);

  const handleDownload = useCallback(async () => {
    let url: string | undefined = playbackUrl;
    if (!url && onPlay) {
      setIsLoading(true);
      const result = await onPlay();
      url = result ?? undefined;
      setIsLoading(false);
    }

    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `memory-${memory.id}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [playbackUrl, onPlay, memory.id]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete?.();
  }, [onDelete]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const creatorName = memory.creator
    ? [memory.creator.first_name, memory.creator.last_name].filter(Boolean).join(' ') || '?'
    : '?';

  const profileName = memory.profile
    ? [memory.profile.first_name, memory.profile.last_name].filter(Boolean).join(' ')
    : null;

  const displayTitle = memory.title || t.noTitle;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-start gap-4">
        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
            isPlaying
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Duration */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {displayTitle}
            </h4>
            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(memory.duration_seconds)}
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer mb-2 overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Creator */}
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {creatorName}
            </span>

            {/* About */}
            {profileName && (
              <span>
                {t.about}: {profileName}
              </span>
            )}

            {/* Privacy */}
            <span className="flex items-center gap-1">
              {privacyIcons[memory.privacy_level]}
              {memory.privacy_level === 'family' && t.privacyFamily}
              {memory.privacy_level === 'private' && t.privacyPrivate}
              {memory.privacy_level === 'public' && t.privacyPublic}
            </span>

            {/* Date */}
            <span className="ml-auto">
              {formatDate(memory.created_at)}
            </span>
          </div>

          {/* Description */}
          {memory.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {memory.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={t.download}
          >
            <Download className="w-4 h-4" />
          </button>

          {canDelete && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-xs">Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
