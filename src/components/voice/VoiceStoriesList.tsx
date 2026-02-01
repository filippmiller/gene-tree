'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { Play, Pause, Volume2, Clock, User, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface VoiceStory {
  id: string;
  target_profile_id: string;
  narrator_profile_id: string;
  bucket: string;
  path: string;
  duration_seconds: number | null;
  transcript_text: string | null;
  transcript_lang: string | null;
  title: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  narrator?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface Props {
  profileId: string;
  locale?: 'en' | 'ru';
  canDelete?: boolean;
  showNarrator?: boolean;
}

const translations = {
  en: {
    title: 'Voice Stories',
    noStories: 'No voice stories yet',
    beFirst: 'Be the first to record a story about this person.',
    pending: 'Pending Review',
    by: 'by',
    transcript: 'Transcript',
    showTranscript: 'Show transcript',
    hideTranscript: 'Hide transcript',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this story?',
    errorLoading: 'Failed to load stories',
    errorPlaying: 'Failed to play audio',
  },
  ru: {
    title: 'Голосовые истории',
    noStories: 'Пока нет голосовых историй',
    beFirst: 'Будьте первым, кто запишет историю об этом человеке.',
    pending: 'На модерации',
    by: 'от',
    transcript: 'Расшифровка',
    showTranscript: 'Показать расшифровку',
    hideTranscript: 'Скрыть расшифровку',
    delete: 'Удалить',
    confirmDelete: 'Вы уверены, что хотите удалить эту историю?',
    errorLoading: 'Не удалось загрузить истории',
    errorPlaying: 'Не удалось воспроизвести аудио',
  },
};

export default function VoiceStoriesList({
  profileId,
  locale = 'en',
  canDelete = false,
  showNarrator = true,
}: Props) {
  const t = translations[locale];
  const supabase = getSupabaseBrowser();

  const [stories, setStories] = useState<VoiceStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch stories on mount
  useEffect(() => {
    async function fetchStories() {
      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('voice_stories')
          .select(`
            id,
            target_profile_id,
            narrator_profile_id,
            bucket,
            path,
            duration_seconds,
            transcript_text,
            transcript_lang,
            title,
            status,
            created_at,
            narrator:user_profiles!voice_stories_narrator_profile_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('target_profile_id', profileId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to flatten narrator
        const transformedStories = (data || []).map((story: any) => ({
          ...story,
          narrator: story.narrator ? {
            first_name: story.narrator.first_name,
            last_name: story.narrator.last_name,
            avatar_url: story.narrator.avatar_url,
          } : undefined,
        }));

        setStories(transformedStories);
      } catch (err) {
        console.error('[VoiceStoriesList] Failed to fetch stories', err);
        setError(t.errorLoading);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [profileId, supabase, t.errorLoading]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke all audio URLs
      Object.values(audioUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [audioUrls]);

  const getAudioUrl = useCallback(async (story: VoiceStory): Promise<string | null> => {
    // Check if we already have the URL cached
    if (audioUrls[story.id]) {
      return audioUrls[story.id];
    }

    try {
      const { data, error } = await supabase.storage
        .from(story.bucket)
        .createSignedUrl(story.path, 3600); // 1 hour expiry

      if (error || !data) {
        console.error('[VoiceStoriesList] Failed to get signed URL', error);
        return null;
      }

      // Cache the URL
      setAudioUrls(prev => ({ ...prev, [story.id]: data.signedUrl }));
      return data.signedUrl;
    } catch (err) {
      console.error('[VoiceStoriesList] Error getting audio URL', err);
      return null;
    }
  }, [supabase, audioUrls]);

  const playStory = useCallback(async (story: VoiceStory) => {
    // If already playing this story, pause it
    if (playingId === story.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const url = await getAudioUrl(story);
    if (!url) {
      setError(t.errorPlaying);
      return;
    }

    audioRef.current = new Audio(url);
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.onerror = () => {
      setError(t.errorPlaying);
      setPlayingId(null);
    };

    try {
      await audioRef.current.play();
      setPlayingId(story.id);
    } catch (err) {
      console.error('[VoiceStoriesList] Failed to play audio', err);
      setError(t.errorPlaying);
    }
  }, [playingId, getAudioUrl, t.errorPlaying]);

  const toggleTranscript = (storyId: string) => {
    setExpandedTranscripts(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('voice_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error('[VoiceStoriesList] Failed to delete story', err);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: locale === 'ru' ? ru : enUS,
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.title}</h2>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.title}</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.title}</h2>
        <div className="text-center py-8">
          <Volume2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t.noStories}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t.beFirst}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.title}</h2>

      <div className="space-y-4">
        {stories.map(story => (
          <div
            key={story.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start gap-4">
              {/* Play Button */}
              <button
                onClick={() => playStory(story)}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  playingId === story.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                )}
              >
                {playingId === story.id ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {story.title && (
                    <h3 className="font-medium text-gray-900 dark:text-white">{story.title}</h3>
                  )}
                  {story.status === 'pending' && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                      {t.pending}
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(story.duration_seconds)}
                  </span>
                  {showNarrator && story.narrator && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {t.by} {story.narrator.first_name}
                    </span>
                  )}
                  <span>{formatDate(story.created_at)}</span>
                </div>

                {/* Transcript Toggle */}
                {story.transcript_text && (
                  <button
                    onClick={() => toggleTranscript(story.id)}
                    className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {expandedTranscripts.has(story.id) ? t.hideTranscript : t.showTranscript}
                  </button>
                )}

                {/* Expanded Transcript */}
                {expandedTranscripts.has(story.id) && story.transcript_text && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {story.transcript_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              {canDelete && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === story.id ? null : story.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeMenu === story.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={() => {
                          deleteStory(story.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.delete}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
