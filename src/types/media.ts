// ============================================================================
// Media System TypeScript Types
// ============================================================================

export type MediaStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type MediaVisibility = 'public' | 'family' | 'private' | 'unlisted';
export type MediaType = 
  | 'avatar' 
  | 'portrait' 
  | 'group' 
  | 'document' 
  | 'event' 
  | 'headstone' 
  | 'certificate' 
  | 'video'
  | 'other';

// AI Enhancement types
export type AIEnhancementType = 'colorization' | 'upscale' | 'restoration' | 'deblur';

export interface Photo {
  id: string;

  // Storage location
  bucket: 'avatars' | 'media';
  path: string;
  storage_object_id?: string;

  // Ownership & target
  uploaded_by: string;
  target_profile_id?: string;

  // Classification
  type: MediaType;
  status: MediaStatus;
  visibility: MediaVisibility;

  // Metadata
  caption?: string;
  taken_at?: string;
  exif?: Record<string, any>;
  sha256?: string;
  width?: number;
  height?: number;

  // Timestamps
  created_at: string;

  // Moderation fields
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  archived_at?: string;

  // AI Enhancement fields
  ai_enhanced?: boolean;
  ai_enhancement_type?: AIEnhancementType;
  original_photo_id?: string;
}

export interface PhotoPeople {
  photo_id: string;
  profile_id: string;
  role?: string;
}

export interface PhotoReview {
  id: string;
  photo_id: string;
  action: 'approve' | 'reject';
  actor: string;
  reason?: string;
  created_at: string;
}

export interface MediaJob {
  id: string;
  kind: 'thumbnail' | 'strip_exif' | 'hash' | 'move_to_approved' | 'delete';
  payload: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  
  created_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SignedUploadRequest {
  target_profile_id: string;
  type: MediaType;
  visibility?: MediaVisibility;
  file_ext: string;
  content_type: string;
  size: number;
  caption?: string;
}

export interface SignedUploadResponse {
  uploadUrl: string;
  token: string;
  bucket: 'media';
  path: string;
  photoId: string;
}

export interface CommitUploadRequest {
  photoId: string;
  width?: number;
  height?: number;
  sha256?: string;
}

export interface CommitUploadResponse {
  success: boolean;
  photo: Photo;
  jobs: string[];  // job IDs created
}

export interface ApprovePhotoRequest {
  photoId: string;
  visibility?: MediaVisibility;  // optional: change visibility on approve
}

export interface ApprovePhotoResponse {
  success: boolean;
  photo: Photo;
}

export interface RejectPhotoRequest {
  photoId: string;
  reason?: string;
}

export interface RejectPhotoResponse {
  success: boolean;
  photo: Photo;
}

export interface SetAvatarRequest {
  photoId: string;
  profileId: string;
}

export interface SetAvatarResponse {
  success: boolean;
  profile: {
    id: string;
    current_avatar_id: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PhotoWithProfile extends Photo {
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface PhotoWithUploader extends Photo {
  uploader?: {
    id: string;
    email?: string;
  };
}

// ============================================================================
// AI Enhancement Types
// ============================================================================

export interface ColorizeRequest {
  photoId: string;
  photoUrl?: string;
}

export interface ColorizeResponse {
  success: boolean;
  originalPhotoId: string;
  colorizedPhotoId?: string;
  colorizedUrl?: string;
  error?: string;
}

export interface PhotoWithOriginal extends Photo {
  originalPhoto?: Photo;
}
