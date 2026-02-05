/**
 * Input Sanitization Utilities for Gene-Tree
 *
 * Provides XSS protection and input validation for user-generated content.
 * Uses DOMPurify for HTML sanitization.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content, removing potentially dangerous elements
 * Use for rich text fields like bios, stories, etc.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
    // Ensure links open in new tab and are safe
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Sanitize plain text, stripping all HTML
 * Use for names, titles, and other plain text fields
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';

  // First strip all HTML tags
  const stripped = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Decode HTML entities
  return stripped
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Sanitize a URL, ensuring it's safe to use
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, and tel
  if (
    !lowerUrl.startsWith('http://') &&
    !lowerUrl.startsWith('https://') &&
    !lowerUrl.startsWith('mailto:') &&
    !lowerUrl.startsWith('tel:') &&
    !lowerUrl.startsWith('/')
  ) {
    // If no protocol, assume https for external URLs
    if (trimmed.includes('.') && !trimmed.startsWith('/')) {
      return `https://${trimmed}`;
    }
  }

  return trimmed;
}

/**
 * Sanitize an object's string properties recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    htmlFields?: string[];  // Fields that allow HTML
    urlFields?: string[];   // Fields that are URLs
  } = {}
): T {
  const { htmlFields = [], urlFields = [] } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        result[key] = sanitizeHtml(value);
      } else if (urlFields.includes(key)) {
        result[key] = sanitizeUrl(value);
      } else {
        result[key] = sanitizeText(value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeText(item);
        }
        if (item && typeof item === 'object') {
          return sanitizeObject(item as Record<string, unknown>, options);
        }
        return item;
      });
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize phone number
 * Returns digits only, or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
  if (!phone) return null;

  // Extract digits and plus sign
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Must have at least 7 digits
  if (cleaned.replace(/\D/g, '').length < 7) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize a UUID string
 */
export function sanitizeUuid(uuid: string): string | null {
  if (!uuid) return null;

  const trimmed = uuid.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Escape special characters for use in SQL LIKE patterns
 * Prevents SQL injection in LIKE queries
 */
export function escapeLikePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Profile sanitization preset
 * Use when sanitizing user profile data
 */
export function sanitizeProfileData<T extends Record<string, unknown>>(data: T): T {
  return sanitizeObject(data, {
    htmlFields: ['bio'],  // Bio allows limited HTML
    urlFields: ['avatar_url', 'website'],
  });
}

/**
 * Message sanitization preset
 * Use when sanitizing chat messages
 */
export function sanitizeMessageData<T extends Record<string, unknown>>(data: T): T {
  return sanitizeObject(data, {
    htmlFields: [],  // No HTML in messages
    urlFields: [],
  });
}

/**
 * Story sanitization preset
 * Use when sanitizing stories and memory book content
 */
export function sanitizeStoryData<T extends Record<string, unknown>>(data: T): T {
  return sanitizeObject(data, {
    htmlFields: ['content', 'description'],  // Rich text fields
    urlFields: ['media_url', 'thumbnail_url'],
  });
}
