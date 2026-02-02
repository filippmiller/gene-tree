// ============================================================================
// Voice Memory TypeScript Types
// ============================================================================

export type VoiceMemoryPrivacyLevel = 'public' | 'family' | 'private';

/**
 * Voice Memory database record
 */
export interface VoiceMemory {
  id: string;
  user_id: string;
  profile_id: string | null;
  title: string | null;
  description: string | null;
  storage_path: string;
  duration_seconds: number;
  file_size_bytes: number | null;
  transcription: string | null;
  privacy_level: VoiceMemoryPrivacyLevel;
  created_at: string;
  updated_at: string;
}

/**
 * Voice Memory with related profile data
 */
export interface VoiceMemoryWithProfile extends VoiceMemory {
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  creator?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Voice Memory with signed playback URL
 */
export interface VoiceMemoryWithUrl extends VoiceMemoryWithProfile {
  playback_url: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to get signed upload URL
 */
export interface SignedUploadRequest {
  profile_id?: string;
  title?: string;
  description?: string;
  duration_seconds: number;
  file_size_bytes: number;
  content_type: string;
  privacy_level?: VoiceMemoryPrivacyLevel;
}

/**
 * Response with signed upload URL
 */
export interface SignedUploadResponse {
  upload_url: string;
  token: string;
  storage_path: string;
  memory_id: string;
}

/**
 * Request to create voice memory record
 */
export interface CreateVoiceMemoryRequest {
  profile_id?: string;
  title?: string;
  description?: string;
  storage_path: string;
  duration_seconds: number;
  file_size_bytes?: number;
  privacy_level?: VoiceMemoryPrivacyLevel;
}

/**
 * Request to update voice memory
 */
export interface UpdateVoiceMemoryRequest {
  title?: string;
  description?: string;
  privacy_level?: VoiceMemoryPrivacyLevel;
}

/**
 * List voice memories query params
 */
export interface ListVoiceMemoriesParams {
  profile_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface VoiceMemoriesListResponse {
  data: VoiceMemoryWithProfile[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseVoiceRecorderReturn {
  // State
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  hasPermission: boolean | null;
  waveformData: number[];

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

export interface UseVoiceMemoriesReturn {
  // Data
  memories: VoiceMemoryWithProfile[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createMemory: (data: CreateVoiceMemoryRequest) => Promise<VoiceMemory | null>;
  updateMemory: (id: string, data: UpdateVoiceMemoryRequest) => Promise<VoiceMemory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  getSignedUrl: (memoryId: string) => Promise<string | null>;
}
