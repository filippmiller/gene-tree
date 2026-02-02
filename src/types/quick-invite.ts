/**
 * Quick Invite Link Types
 *
 * Types for the quick invite link system that allows users to create
 * shareable links with QR codes for family events.
 */

export type QuickLinkExpiration = '1h' | '6h' | '24h' | '7d';

export interface QuickInviteLink {
  id: string;
  created_by: string;
  code: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  event_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickInviteLinkWithCreator extends QuickInviteLink {
  creator?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export type QuickLinkSignupStatus = 'pending' | 'approved' | 'rejected';

export interface QuickLinkSignup {
  id: string;
  link_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  claimed_relationship: string | null;
  status: QuickLinkSignupStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickLinkSignupWithLink extends QuickLinkSignup {
  link?: QuickInviteLink;
}

// API Request/Response types

export interface CreateQuickLinkRequest {
  expiration: QuickLinkExpiration;
  maxUses?: number;
  eventName?: string;
}

export interface CreateQuickLinkResponse {
  success: boolean;
  link?: QuickInviteLink;
  error?: string;
}

export interface UpdateQuickLinkRequest {
  isActive?: boolean;
  eventName?: string;
  maxUses?: number;
}

export interface QuickLinkSignupRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  claimedRelationship?: string;
}

export interface ApproveSignupRequest {
  signupId: string;
}

export interface RejectSignupRequest {
  signupId: string;
  reason?: string;
}

// Helper functions
export function getExpirationMs(expiration: QuickLinkExpiration): number {
  switch (expiration) {
    case '1h':
      return 60 * 60 * 1000;
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default 24h
  }
}

export function getExpirationLabel(expiration: QuickLinkExpiration, locale: string): string {
  const labels: Record<QuickLinkExpiration, Record<string, string>> = {
    '1h': { en: '1 hour', ru: '1 час' },
    '6h': { en: '6 hours', ru: '6 часов' },
    '24h': { en: '24 hours', ru: '24 часа' },
    '7d': { en: '7 days', ru: '7 дней' },
  };
  return labels[expiration][locale] || labels[expiration].en;
}

export function isLinkValid(link: QuickInviteLink): boolean {
  if (!link.is_active) return false;
  if (new Date(link.expires_at) <= new Date()) return false;
  if (link.current_uses >= link.max_uses) return false;
  return true;
}

export function getTimeRemaining(expiresAt: string): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
} {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { expired: false, days, hours, minutes };
}
