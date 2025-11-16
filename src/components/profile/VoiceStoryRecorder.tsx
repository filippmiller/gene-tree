'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mic, Square, Loader2 } from 'lucide-react';

interface Props {
  targetProfileId: string;
}

type RecorderState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function VoiceStoryRecorder({ targetProfileId }: Props) {
  const supabase = createClient();
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Try to pre-request permission (optional)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());
          setHasMicPermission(true);
        })
        .catch(() => setHasMicPermission(false));
    }
  }, []);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Ваш браузер не поддерживает запись звука');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationSeconds = startTimeRef.current
          ? Math.round((Date.now() - startTimeRef.current) / 1000)
          : undefined;

        await uploadBlob(blob, durationSeconds);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setState('recording');
    } catch (err: any) {
      console.error('[VoiceRecorder] Failed to start recording', err);
      setError('Не удалось получить доступ к микрофону');
      setHasMicPermission(false);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      setState('processing');
      recorder.stop();
    }
  }

  async function uploadBlob(blob: Blob, durationSeconds?: number) {
    try {
      setState('processing');

      const size = blob.size;
      const fileExt = 'webm';
      const contentType = 'audio/webm';

      // 1) Get signed upload URL
      const signedRes = await fetch('/api/voice-stories/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_profile_id: targetProfileId,
          duration_seconds: durationSeconds,
          size,
          content_type: contentType,
          file_ext: fileExt,
        }),
      });

      if (!signedRes.ok) {
        const body = await signedRes.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось подготовить загрузку');
      }

      const signed = (await signedRes.json()) as {
        uploadUrl: string;
        token: string;
        bucket: 'audio';
        path: string;
        storyId: string;
      };

      // 2) Upload to signed URL via Supabase client
      const file = new File([blob], `story.${fileExt}`, { type: contentType });

      const { error: uploadError } = await supabase.storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file);

      if (uploadError) {
        throw uploadError;
      }

      // 3) Commit
      const commitRes = await fetch('/api/voice-stories/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: signed.storyId }),
      });

      if (!commitRes.ok) {
        const body = await commitRes.json().catch(() => ({}));
        throw new Error(body.error || 'Не удалось сохранить историю');
      }

      setState('done');
    } catch (err: any) {
      console.error('[VoiceRecorder] Upload error', err);
      setError(err?.message || 'Ошибка при загрузке истории');
      setState('error');
    }
  }

  const isRecording = state === 'recording';
  const isBusy = state === 'processing';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Записать историю голосом</h2>
        <p className="text-xs text-gray-600 mt-1">
          Нажмите на кнопку, расскажите историю, затем нажмите ещё раз, чтобы остановить запись.
        </p>
      </div>

      <button
        type="button"
        disabled={isBusy || hasMicPermission === false}
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-white text-sm font-medium transition-colors
          ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
          ${isBusy ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение истории...
          </>
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4" />
            Остановить запись
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Начать запись
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {hasMicPermission === false && (
        <p className="text-xs text-orange-600">
          Доступ к микрофону запрещён. Проверьте настройки браузера и системы.
        </p>
      )}

      {state === 'done' && !error && (
        <p className="text-xs text-green-700">
          История сохранена! Она скоро появится на странице профиля.
        </p>
      )}
    </div>
  );
}
