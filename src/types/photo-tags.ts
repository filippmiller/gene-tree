// Photo Tags Types
// Type definitions for the face tagging system

/**
 * Photo tag record from database
 */
export interface PhotoTag {
  id: string;
  photo_id: string;
  tagged_profile_id: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  tagged_by: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  created_at: string;
}

/**
 * Photo tag with profile info for display
 */
export interface PhotoTagWithProfile extends PhotoTag {
  tagged_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  tagger: {
    first_name: string;
    last_name: string;
  };
}

/**
 * Request to add a photo tag
 */
export interface AddPhotoTagRequest {
  tagged_profile_id: string;
  x_percent: number;
  y_percent: number;
  width_percent?: number;
  height_percent?: number;
}

/**
 * Response for photo tag operations
 */
export interface PhotoTagResponse {
  success: boolean;
  tag?: PhotoTagWithProfile;
  error?: string;
}

/**
 * Response for getting all tags on a photo
 */
export interface GetPhotoTagsResponse {
  tags: PhotoTagWithProfile[];
  total: number;
}

/**
 * Request to confirm a tag
 */
export interface ConfirmTagRequest {
  is_confirmed: boolean;
}

/**
 * Tag position for UI rendering
 */
export interface TagPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert percentage-based tag to pixel position
 */
export function tagToPixelPosition(
  tag: PhotoTag,
  imageWidth: number,
  imageHeight: number
): TagPosition {
  return {
    x: (tag.x_percent / 100) * imageWidth,
    y: (tag.y_percent / 100) * imageHeight,
    width: (tag.width_percent / 100) * imageWidth,
    height: (tag.height_percent / 100) * imageHeight,
  };
}

/**
 * Convert pixel position to percentage-based coordinates
 */
export function pixelToPercentPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): { x_percent: number; y_percent: number; width_percent: number; height_percent: number } {
  return {
    x_percent: Math.round((x / imageWidth) * 100 * 100) / 100,
    y_percent: Math.round((y / imageHeight) * 100 * 100) / 100,
    width_percent: Math.round((width / imageWidth) * 100 * 100) / 100,
    height_percent: Math.round((height / imageHeight) * 100 * 100) / 100,
  };
}

/**
 * Check if a click is inside a tag bounding box
 */
export function isClickInsideTag(
  clickX: number,
  clickY: number,
  tag: PhotoTag,
  imageWidth: number,
  imageHeight: number
): boolean {
  const pos = tagToPixelPosition(tag, imageWidth, imageHeight);
  const halfWidth = pos.width / 2;
  const halfHeight = pos.height / 2;

  return (
    clickX >= pos.x - halfWidth &&
    clickX <= pos.x + halfWidth &&
    clickY >= pos.y - halfHeight &&
    clickY <= pos.y + halfHeight
  );
}
