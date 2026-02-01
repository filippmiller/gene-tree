'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { Mic, Square, Loader2, Play, Pause, RotateCcw, Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  targetProfileId: string;
  promptId?: string;
  promptText?: string;
  onComplete?: (storyId: string, transcript?: string) => void;
  onCancel?: () => void;
  locale?: 'en' | 'ru';
}

type RecorderState =
  | 'idle'
  | 'recording'
  | 'preview'
  | 'uploading'
  | 'transcribing'
  | 'editing'
  | 'done'
  | 'error';

const MAX_DURATION_SECONDS = 120; // 2 minutes

const translations = {
  en: {
    title: 'Record Your Story',
    subtitle: 'Click the button to start recording, then click again to stop.',
    promptLabel: 'Story Prompt',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording...',
    uploading: 'Saving...',
    transcribing: 'Transcribing...',
    preview: 'Preview',
    playPreview: 'Play',
    pausePreview: 'Pause',
    reRecord: 'Re-record',
    saveStory: 'Save Story',
    cancel: 'Cancel',
    editTranscript: 'Edit Transcript',
    saveTranscript: 'Save Changes',
    cancelEdit: 'Cancel Edit',
    transcriptLabel: 'Transcript',
    noTranscript: 'No transcript available',
    success: 'Story saved successfully!',
    micPermissionDenied: 'Microphone access denied. Please check your browser settings.',
    browserNotSupported: 'Your browser does not support audio recording.',
    maxDurationReached: 'Maximum duration reached (2 minutes)',
    errorUploading: 'Failed to upload. Please try again.',
    errorTranscribing: 'Transcription failed. You can still save the recording.',
  },
  ru: {
    title: 'Записать историю',
    subtitle: 'Нажмите кнопку для начала записи, затем нажмите ещё раз для остановки.',
    promptLabel: 'Подсказка',
    startRecording: 'Начать запись',
    stopRecording: 'Остановить',
    recording: 'Идёт запись...',
    uploading: 'Сохранение...',
    transcribing: 'Транскрибирование...',
    preview: 'Предпросмотр',
    playPreview: 'Воспроизвести',
    pausePreview: 'Пауза',
    reRecord: 'Записать заново',
    saveStory: 'Сохранить историю',
    cancel: 'Отмена',
    editTranscript: 'Редактировать текст',
    saveTranscript: 'Сохранить изменения',
    cancelEdit: 'Отменить',
    transcriptLabel: 'Расшифровка',
    noTranscript: 'Расшифровка недоступна',
    success: 'История сохранена!',
    micPermissionDenied: 'Доступ к микрофону запрещён. Проверьте настройки браузера.',
    browserNotSupported: 'Ваш браузер не поддерживает запись звука.',
    maxDurationReached: 'Достигнута максимальная длительность (2 минуты)',
    errorUploading: 'Ошибка загрузки. Попробуйте ещё раз.',
    errorTranscribing: 'Ошибка транскрибирования. Вы всё равно можете сохранить запись.',
  },
};

export default function VoiceRecorder({
  targetProfileId,
  promptId,
  promptText,
  onComplete,
  onCancel,
  locale = 'en',
}: Props) {
  const t = translations[locale];
  const supabase = getSupabaseBrowser();

  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [editedTranscript, setEditedTranscript] = useState<string>('');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  // Check microphone permission on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());
          setHasMicPermission(true);
        })
        .catch(() => setHasMicPermission(false));
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t.browserNotSupported);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyser for waveform visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('preview');
      };

      recorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setDuration(0);
      setState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        setDuration(elapsed);

        if (elapsed >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
      }, 1000);

      // Start waveform animation
      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Sample 20 bars from the frequency data
          const bars = 20;
          const step = Math.floor(dataArray.length / bars);
          const waveform: number[] = [];
          for (let i = 0; i < bars; i++) {
            const value = dataArray[i * step];
            waveform.push(value / 255);
          }
          setWaveformData(waveform);
        }
        animationRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

    } catch (err) {
      console.error('[VoiceRecorder] Failed to start recording', err);
      setError(t.micPermissionDenied);
      setHasMicPermission(false);
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  }, []);

  const playPreview = useCallback(() => {
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

  const resetRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript(null);
    setEditedTranscript('');
    setStoryId(null);
    setDuration(0);
    setWaveformData([]);
    setIsPlaying(false);
    setState('idle');
    setError(null);
  }, [audioUrl]);

  const uploadAndTranscribe = useCallback(async () => {
    if (!audioBlob) return;

    try {
      setState('uploading');
      setError(null);

      const size = audioBlob.size;
      const fileExt = audioBlob.type.includes('webm') ? 'webm' : 'mp4';
      const contentType = audioBlob.type;

      // 1) Get signed upload URL
      const signedRes = await fetch('/api/voice-stories/signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_profile_id: targetProfileId,
          duration_seconds: duration,
          size,
          content_type: contentType,
          file_ext: fileExt,
          prompt_id: promptId,
        }),
      });

      if (!signedRes.ok) {
        const body = await signedRes.json().catch(() => ({}));
        throw new Error(body.error || t.errorUploading);
      }

      const signed = await signedRes.json() as {
        uploadUrl: string;
        token: string;
        bucket: 'audio';
        path: string;
        storyId: string;
      };

      setStoryId(signed.storyId);

      // 2) Upload to signed URL
      const file = new File([audioBlob], `story.${fileExt}`, { type: contentType });
      const { error: uploadError } = await supabase.storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file);

      if (uploadError) {
        throw uploadError;
      }

      // 3) Commit the upload
      const commitRes = await fetch('/api/voice-stories/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: signed.storyId }),
      });

      if (!commitRes.ok) {
        const body = await commitRes.json().catch(() => ({}));
        throw new Error(body.error || t.errorUploading);
      }

      // 4) Request transcription
      setState('transcribing');

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: signed.storyId }),
      });

      if (transcribeRes.ok) {
        const transcribeData = await transcribeRes.json();
        if (transcribeData.success && transcribeData.transcript) {
          setTranscript(transcribeData.transcript);
          setEditedTranscript(transcribeData.transcript);
        }
      } else {
        // Transcription failed but upload succeeded
        setError(t.errorTranscribing);
      }

      setState('done');
      onComplete?.(signed.storyId, transcript || undefined);

    } catch (err) {
      console.error('[VoiceRecorder] Upload error', err);
      setError(err instanceof Error ? err.message : t.errorUploading);
      setState('error');
    }
  }, [audioBlob, duration, targetProfileId, promptId, supabase, t, onComplete, transcript]);

  const saveEditedTranscript = useCallback(async () => {
    if (!storyId || editedTranscript === transcript) {
      setState('done');
      return;
    }

    try {
      // Update transcript via API
      const res = await fetch('/api/voice-stories/update-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, transcript: editedTranscript }),
      });

      if (!res.ok) {
        throw new Error('Failed to update transcript');
      }

      setTranscript(editedTranscript);
      setState('done');
    } catch (err) {
      console.error('[VoiceRecorder] Failed to update transcript', err);
      setState('done');
    }
  }, [storyId, editedTranscript, transcript]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRecording = state === 'recording';
  const isBusy = state === 'uploading' || state === 'transcribing';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Story Prompt */}
      {promptText && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">{t.promptLabel}</p>
          <p className="text-gray-800 dark:text-gray-200">{promptText}</p>
        </div>
      )}

      {/* Recording Controls */}
      {(state === 'idle' || state === 'recording') && (
        <div className="flex flex-col items-center space-y-4">
          {/* Waveform Visualization */}
          {isRecording && (
            <div className="flex items-end justify-center h-16 gap-1 w-full max-w-xs">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className="w-2 bg-gradient-to-t from-red-500 to-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(8, value * 64)}px` }}
                />
              ))}
              {waveformData.length === 0 && Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-300 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          )}

          {/* Timer */}
          {isRecording && (
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                / {formatDuration(MAX_DURATION_SECONDS)}
              </div>
            </div>
          )}

          {/* Record Button */}
          <button
            type="button"
            disabled={hasMicPermission === false}
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg',
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
              hasMicPermission === false && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isRecording ? t.stopRecording : t.startRecording}
          </p>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && audioUrl && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{t.preview}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={playPreview}
                className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="text-lg font-mono text-gray-900 dark:text-white">
                  {formatDuration(duration)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t.recording}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetRecording}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t.reRecord}
            </button>
            <button
              onClick={uploadAndTranscribe}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t.saveStory}
            </button>
          </div>
        </div>
      )}

      {/* Uploading/Transcribing State */}
      {isBusy && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">
            {state === 'uploading' ? t.uploading : t.transcribing}
          </p>
        </div>
      )}

      {/* Done State */}
      {state === 'done' && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span className="font-medium">{t.success}</span>
            </div>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.transcriptLabel}</p>
                <button
                  onClick={() => setState('editing')}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Editing State */}
      {state === 'editing' && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{t.editTranscript}</p>
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="w-full h-32 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditedTranscript(transcript || '');
                setState('done');
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              {t.cancelEdit}
            </button>
            <button
              onClick={saveEditedTranscript}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors"
            >
              <Check className="w-4 h-4" />
              {t.saveTranscript}
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {(state === 'error' || error) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          {state === 'error' && (
            <button
              onClick={resetRecording}
              className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
            >
              {t.reRecord}
            </button>
          )}
        </div>
      )}

      {/* Microphone Permission Warning */}
      {hasMicPermission === false && state === 'idle' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-orange-700 dark:text-orange-400">{t.micPermissionDenied}</p>
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && state !== 'done' && !isBusy && (
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
