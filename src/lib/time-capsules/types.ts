/**
 * Time Capsule Types
 * Type definitions for the time capsule messaging system
 */

// Delivery trigger types
export type DeliveryTrigger = 'date' | 'after_passing' | 'event';

// Delivery status
export type DeliveryStatus = 'scheduled' | 'delivered' | 'cancelled';

// Media types
export type CapsuleMediaType = 'audio' | 'video' | 'image' | null;

/**
 * Core time capsule record from database
 */
export interface TimeCapsule {
  id: string;
  created_by: string;
  recipient_profile_id: string | null;
  title: string;
  message: string | null;
  media_type: CapsuleMediaType;
  media_url: string | null;
  scheduled_delivery_date: string;
  delivery_trigger: DeliveryTrigger;
  delivered_at: string | null;
  delivery_status: DeliveryStatus;
  privacy_level: 'private';
  created_at: string;
  updated_at: string;
}

/**
 * Profile info for display
 */
export interface CapsuleProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

/**
 * Time capsule with joined profile data
 */
export interface TimeCapsuleWithProfiles extends TimeCapsule {
  creator: CapsuleProfile;
  recipient: CapsuleProfile | null;
}

/**
 * Request to create a new time capsule
 */
export interface CreateTimeCapsuleRequest {
  recipient_profile_id?: string | null;
  title: string;
  message?: string | null;
  media_type?: CapsuleMediaType;
  media_url?: string | null;
  scheduled_delivery_date: string;
  delivery_trigger?: DeliveryTrigger;
}

/**
 * Request to update a time capsule (only before delivery)
 */
export interface UpdateTimeCapsuleRequest {
  title?: string;
  message?: string | null;
  media_type?: CapsuleMediaType;
  media_url?: string | null;
  scheduled_delivery_date?: string;
  delivery_trigger?: DeliveryTrigger;
  delivery_status?: 'cancelled';
}

/**
 * Request for signed upload URL
 */
export interface TimeCapsuleSignedUploadRequest {
  capsule_id?: string;
  file_size_bytes: number;
  content_type: string;
}

/**
 * Response from signed upload endpoint
 */
export interface TimeCapsuleSignedUploadResponse {
  upload_url: string;
  token: string;
  storage_path: string;
}

/**
 * API response for list endpoint
 */
export interface TimeCapsuleListResponse {
  data: TimeCapsuleWithProfiles[];
  total: number;
  hasMore: boolean;
}

/**
 * Notification payload for time capsule delivery
 */
export interface TimeCapsuleDeliveredPayload {
  capsule_id: string;
  title: string;
  creator_name: string;
}

/**
 * Check if a capsule can be edited/deleted
 */
export function canModifyCapsule(capsule: TimeCapsule, userId: string): boolean {
  return capsule.created_by === userId && capsule.delivery_status === 'scheduled';
}

/**
 * Check if a capsule is sealed (not yet delivered)
 */
export function isSealed(capsule: TimeCapsule): boolean {
  return capsule.delivery_status === 'scheduled';
}

/**
 * Check if a capsule has been opened/delivered
 */
export function isDelivered(capsule: TimeCapsule): boolean {
  return capsule.delivery_status === 'delivered';
}

/**
 * Get time until delivery in human-readable format
 */
export function getTimeUntilDelivery(capsule: TimeCapsule): {
  days: number;
  isPast: boolean;
} {
  const deliveryDate = new Date(capsule.scheduled_delivery_date);
  const now = new Date();
  const diffMs = deliveryDate.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    days: Math.abs(days),
    isPast: diffMs < 0,
  };
}
