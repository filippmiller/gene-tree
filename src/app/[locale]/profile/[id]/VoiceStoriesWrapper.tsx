'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

interface VoiceStory {
  id: string;
  narrator_profile_id: string;
  target_profile_id: string;
  bucket: string;
  path: string;
  duration_seconds: number | null;
  transcript_text: string | null;
  created_at: string;
  narrator?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface Props {
  targetProfileId: string;
  locale: 'en' | 'ru';
}

const translations = {
  en: {
    voiceStories: 'Voice Stories',
    noStories: 'No voice stories yet',
    recordedBy: 'Recorded by',
    play: 'Play',
    pause: 'Pause',
    loading: 'Loading...',
  },
  ru: {
    voiceStories: 'Голосовые истории',
    noStories: 'Пока нет голосовых историй',
    recordedBy: 'Записал(а)',
    play: 'Воспроизвести',
    pause: 'Пауза',
    loading: 'Загрузка...',
  },
};

export default function VoiceStoriesWrapper({ targetProfileId, locale }: Props) {
  const t = translations[locale];
  const [stories, setStories] = useState<VoiceStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadStories() {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('voice_stories')
        .select(`
          id,
          narrator_profile_id,
          target_profile_id,
          bucket,
          path,
          duration_seconds,
          transcript_text,
          created_at,
          narrator:user_profiles!narrator_profile_id(first_name, last_name, avatar_url)
        `)
        .eq('target_profile_id', targetProfileId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStories(data as unknown as VoiceStory[]);
      }
      setLoading(false);
    }

    loadStories();
  }, [targetProfileId]);

  const playStory = async (story: VoiceStory) => {
    if (playingId === story.id) {
      // Pause current
      audio?.pause();
      setPlayingId(null);
      return;
    }

    // Stop previous
    audio?.pause();

    const supabase = getSupabaseBrowser();
    const { data } = await supabase.storage
      .from(story.bucket)
      .createSignedUrl(story.path, 3600);

    if (data?.signedUrl) {
      const newAudio = new Audio(data.signedUrl);
      newAudio.onended = () => setPlayingId(null);
      newAudio.play();
      setAudio(newAudio);
      setPlayingId(story.id);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Volume2 className="w-5 h-5" />
        {t.voiceStories}
      </h2>
      <div className="space-y-3">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <button
              onClick={() => playStory(story)}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              {playingId === story.id ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              {story.narrator && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.recordedBy} {story.narrator.first_name} {story.narrator.last_name}
                </p>
              )}
              {story.transcript_text && (
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {story.transcript_text}
                </p>
              )}
              {story.duration_seconds && (
                <p className="text-xs text-gray-500">
                  {Math.floor(story.duration_seconds / 60)}:{String(Math.floor(story.duration_seconds % 60)).padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
