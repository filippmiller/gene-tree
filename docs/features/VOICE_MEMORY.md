# Voice Memory System

> **Feature ID:** Sprint3-C1
> **Status:** Complete
> **Added:** February 2, 2026

## Overview

Voice Memory is a quick audio recording feature that allows users to capture and preserve family memories in their own voice. Limited to 60 seconds, it's designed for spontaneous storytelling moments - a quick memory about grandma, a childhood story, or a message for future generations.

This feature supports the platform's philosophy that "stories matter" by providing a low-friction way to capture memories before they're forgotten.

## Architecture

```
+------------------------------------------------------------------+
|                     QuickVoiceRecorder                            |
|                 (Recording UI Component)                          |
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                   Recording States                        |   |
|   |                                                           |   |
|   |   [idle]  -->  [recording]  -->  [preview]  -->  [saving] |   |
|   |     |              |                |               |      |   |
|   |     v              v                v               v      |   |
|   |   Start         Waveform        Playback         Upload    |   |
|   |   Button        Animation       Controls         Progress  |   |
|   |                   Timer          Title                     |   |
|   |                                  Privacy                   |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
+--------------------+               +------------------------+
|  useVoiceRecorder  |               |   useVoiceMemories     |
|                    |               |                        |
| - MediaRecorder    |               | - CRUD operations      |
| - AudioContext     |               | - Signed URLs          |
| - Waveform data    |               | - Pagination           |
+--------------------+               +------------------------+
                                                |
                                                v
              +----------------------------------+
              |          API Routes              |
              |                                  |
              |  POST /api/voice-memories/upload |
              |  POST /api/voice-memories/:id/confirm|
              |  GET  /api/voice-memories        |
              |  GET  /api/voice-memories/:id    |
              |  PATCH /api/voice-memories/:id   |
              |  DELETE /api/voice-memories/:id  |
              +----------------------------------+
                              |
                              v
              +----------------------------------+
              |       Supabase Storage           |
              |                                  |
              |   Bucket: voice-memories         |
              |   Path: {user_id}/{memory_id}.webm|
              |   Max size: 10 MB                |
              +----------------------------------+
```

## Database Schema

### voice_memories

```sql
CREATE TABLE public.voice_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who created this memory
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who this memory is about (optional)
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Basic info
  title TEXT,
  description TEXT,

  -- Storage location
  storage_path TEXT NOT NULL,

  -- Audio metadata
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  file_size_bytes INTEGER,

  -- Future: AI transcription
  transcription TEXT,

  -- Privacy control
  privacy_level TEXT NOT NULL DEFAULT 'family'
    CHECK (privacy_level IN ('public', 'family', 'private')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT voice_memories_unique_path UNIQUE (storage_path)
);
```

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-memories',
  'voice-memories',
  false,              -- Private bucket
  10485760,           -- 10 MB max
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
);
```

### Indexes

```sql
CREATE INDEX idx_voice_memories_user_id ON voice_memories(user_id, created_at DESC);
CREATE INDEX idx_voice_memories_profile_id ON voice_memories(profile_id, created_at DESC);
CREATE INDEX idx_voice_memories_privacy ON voice_memories(privacy_level);
```

## Files

### Components

| File | Purpose |
|------|---------|
| `src/components/voice-memory/QuickVoiceRecorder.tsx` | Main recording interface |
| `src/components/voice-memory/VoiceMemoryPlayer.tsx` | Playback component with controls |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useVoiceRecorder.ts` | MediaRecorder API wrapper with waveform |
| `src/hooks/useVoiceMemories.ts` | CRUD operations and signed URL management |

### Types

| File | Purpose |
|------|---------|
| `src/types/voice-memory.ts` | TypeScript interfaces and types |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/voice-memories/route.ts` | List voice memories |
| `src/app/api/voice-memories/upload/route.ts` | Get signed upload URL |
| `src/app/api/voice-memories/[id]/route.ts` | Get, update, delete memory |
| `src/app/api/voice-memories/[id]/confirm/route.ts` | Confirm upload completion |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/20260202400001_voice_memories.sql` | Schema, RLS, storage policies |

## Component Props

### QuickVoiceRecorder

```typescript
interface QuickVoiceRecorderProps {
  profileId?: string;           // Who the memory is about
  profileName?: string;         // Display name for "About {name}"
  locale: 'en' | 'ru';          // Current locale
  onComplete?: () => void;      // Called after successful save
  onCancel?: () => void;        // Called when user cancels
}
```

### VoiceMemoryPlayer

```typescript
interface VoiceMemoryPlayerProps {
  memory: VoiceMemoryWithProfile;       // Memory data with profile info
  playbackUrl?: string;                  // Pre-signed URL (optional)
  canDelete?: boolean;                   // Show delete button
  onDelete?: () => void;                 // Delete callback
  onPlay?: () => Promise<string | null>; // Get playback URL on demand
  locale: 'en' | 'ru';                   // Current locale
}
```

## Hook APIs

### useVoiceRecorder

```typescript
interface UseVoiceRecorderReturn {
  // State
  isRecording: boolean;
  isPaused: boolean;
  duration: number;              // Current recording duration in seconds
  audioBlob: Blob | null;        // Recorded audio data
  audioUrl: string | null;       // Object URL for playback
  error: string | null;
  hasPermission: boolean | null;
  waveformData: number[];        // Array of 20 frequency values (0-1)
  isSupported: boolean;          // Browser supports MediaRecorder

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}
```

### useVoiceMemories

```typescript
interface UseVoiceMemoriesOptions {
  profileId?: string;           // Filter by profile
  limit?: number;               // Page size (default: 20)
  autoLoad?: boolean;           // Load on mount (default: true)
}

interface UseVoiceMemoriesReturn {
  // Data
  memories: VoiceMemoryWithProfile[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createMemory: (blob: Blob, data: CreateOptions) => Promise<VoiceMemory | null>;
  updateMemory: (id: string, data: UpdateOptions) => Promise<VoiceMemory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  getPlaybackUrl: (memoryId: string) => Promise<string | null>;
}
```

## API Endpoints

### POST /api/voice-memories/upload

Get a signed URL for uploading audio.

**Request:**
```json
{
  "profile_id": "uuid",           // optional
  "title": "Summer 1985",         // optional
  "description": "...",           // optional
  "duration_seconds": 45,
  "file_size_bytes": 234567,
  "content_type": "audio/webm",
  "privacy_level": "family"
}
```

**Response:**
```json
{
  "upload_url": "https://...",
  "token": "signed-token",
  "storage_path": "user-id/memory-id.webm",
  "memory_id": "uuid"
}
```

### POST /api/voice-memories/:id/confirm

Confirm that the upload completed successfully.

**Response:**
```json
{
  "memory": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Summer 1985",
    "duration_seconds": 45,
    "privacy_level": "family",
    "created_at": "2026-02-02T12:00:00Z"
  }
}
```

### GET /api/voice-memories

List voice memories.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| profile_id | string | - | Filter by profile |
| limit | number | 20 | Results per page |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Summer 1985",
      "duration_seconds": 45,
      "privacy_level": "family",
      "created_at": "2026-02-02T12:00:00Z",
      "profile": { "first_name": "John", "last_name": "Doe" },
      "creator": { "first_name": "Jane", "last_name": "Doe" }
    }
  ],
  "total": 5,
  "hasMore": false
}
```

### GET /api/voice-memories/:id

Get memory details with signed playback URL.

**Response:**
```json
{
  "memory": { ... },
  "playback_url": "https://signed-url-valid-1-hour"
}
```

### PATCH /api/voice-memories/:id

Update memory metadata.

**Request:**
```json
{
  "title": "New title",
  "description": "New description",
  "privacy_level": "private"
}
```

### DELETE /api/voice-memories/:id

Delete a memory (storage file and database record).

**Response:**
```json
{ "success": true }
```

## Recording Flow

```
User clicks Record
        |
        v
Request microphone permission
        |
    +---+---+
    |       |
 Denied   Granted
    |       |
    v       v
 Show    Start MediaRecorder
 Error      |
            v
     Start timer & waveform animation
            |
            v
     User clicks Stop (or 60s auto-stop)
            |
            v
     Generate Blob & Object URL
            |
            v
     Show Preview (Play/Re-record/Save)
            |
    +-------+-------+
    |               |
 Re-record        Save
    |               |
    v               v
  Reset         Upload Flow
  State
```

## Upload Flow

```
User clicks Save
        |
        v
POST /api/voice-memories/upload
(Creates pending DB record, returns signed URL)
        |
        v
Upload blob to signed URL
        |
        v
POST /api/voice-memories/:id/confirm
(Marks record as complete)
        |
        v
Show success state
        |
        v
Call onComplete callback
```

## Privacy Levels

| Level | Icon | Who Can See |
|-------|------|-------------|
| public | Globe | Everyone |
| family | Users | Connected family members |
| private | Lock | Only the creator |

## RLS Policies

### voice_memories table

**SELECT:**
- Owner can always see their own
- Public memories visible to everyone
- Family memories visible if:
  - Memory is about the viewer
  - Viewer is in creator's family circle
  - Creator is in viewer's family circle
- Admins can see everything

**INSERT:**
- User can only create memories for themselves (`user_id = auth.uid()`)

**UPDATE:**
- User can only update their own memories

**DELETE:**
- User can delete their own memories
- Admins can delete any memory

### Storage Bucket

**INSERT:**
- User can upload to their own folder (`{user_id}/`)

**SELECT:**
- User can read from their own folder
- Admins can read everything
- (Family access via signed URLs from API)

**DELETE:**
- User can delete from their own folder

## Waveform Visualization

The recorder captures real-time frequency data using Web Audio API:

```typescript
// Setup
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
source.connect(analyser);

// Animation loop (60fps)
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);

// Sample 20 bars from frequency data
const bars = 20;
const step = Math.floor(dataArray.length / bars);
const waveform = [];
for (let i = 0; i < bars; i++) {
  waveform.push(dataArray[i * step] / 255); // Normalize to 0-1
}
```

## Localization

### English

```typescript
const en = {
  title: 'Quick Voice Memory',
  recordHint: 'Tap to start recording',
  recording: 'Recording...',
  maxDuration: 'Max 60 seconds',
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
  micPermissionDenied: 'Microphone access denied...',
  browserNotSupported: 'Your browser does not support audio recording...',
  autoStopWarning: 'Recording will auto-stop at 60 seconds',
};
```

### Russian

```typescript
const ru = {
  title: 'Быстрая голосовая запись',
  recordHint: 'Нажмите, чтобы начать запись',
  recording: 'Запись...',
  maxDuration: 'Макс. 60 секунд',
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
  micPermissionDenied: 'Доступ к микрофону запрещён...',
  browserNotSupported: 'Ваш браузер не поддерживает запись звука...',
  autoStopWarning: 'Запись автоматически остановится через 60 секунд',
};
```

## Browser Support

### Required APIs

- `navigator.mediaDevices.getUserMedia`
- `MediaRecorder`
- `AudioContext`
- `AnalyserNode`

### Supported MIME Types (in order of preference)

1. `audio/webm;codecs=opus`
2. `audio/webm`
3. `audio/mp4`
4. `audio/ogg`

### Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 49+ | Full support |
| Firefox 25+ | Full support |
| Safari 14.1+ | Full support |
| Edge 79+ | Full support |
| Safari iOS 14.5+ | Full support |
| Chrome Android | Full support |

## Testing Checklist

### Recording Tests

- [ ] Microphone permission request appears
- [ ] Permission denial shows error message
- [ ] Start recording shows waveform
- [ ] Timer counts up correctly
- [ ] Auto-stop at 60 seconds works
- [ ] Stop button creates valid audio blob
- [ ] Waveform responds to audio levels

### Preview Tests

- [ ] Play button starts playback
- [ ] Pause button pauses playback
- [ ] Audio ends and button resets
- [ ] Re-record clears and resets state
- [ ] Title input accepts text (max 100 chars)
- [ ] Privacy selector changes value

### Upload Tests

- [ ] Save triggers upload flow
- [ ] Loading state shows during upload
- [ ] Success state shows checkmark
- [ ] onComplete callback fires after success
- [ ] Error state shows error message
- [ ] Retry is possible after error

### Playback Tests

- [ ] Player loads with memory data
- [ ] Play button fetches signed URL
- [ ] Progress bar updates during playback
- [ ] Seek by clicking progress bar works
- [ ] Download button downloads file
- [ ] Delete shows confirmation
- [ ] Delete removes memory from list

### Edge Cases

- [ ] Very short recording (1 second) saves
- [ ] Exactly 60 seconds stops cleanly
- [ ] Network error during upload shows retry option
- [ ] Refreshing during recording prompts warning
- [ ] Multiple recordings in same session work

## Future Improvements

1. **AI Transcription** - Automatic speech-to-text for searchability
2. **Background Music** - Optional subtle background during playback
3. **Trim Editor** - Cut unwanted portions before saving
4. **Longer Recordings** - Premium feature for 5+ minute memories
5. **Voice Effects** - Fun filters for playback (not stored)
6. **Shared Recording Sessions** - Multiple family members contribute
7. **Voice Messages** - Send voice memories directly to family members
8. **Playlist Feature** - Create collections of voice memories
9. **Export Options** - Download as MP3, share to social media
10. **Offline Recording** - Record without internet, sync later
