// Family Group Chat Types
// Centralized type definitions for the family chat system

/**
 * Chat member roles
 */
export type FamilyChatRole = 'admin' | 'member';

/**
 * Message types for different kinds of chat content
 */
export type ChatMessageType =
  | 'user'        // Regular user message
  | 'system'      // System announcements
  | 'birthday'    // Birthday reminder
  | 'anniversary' // Wedding anniversary
  | 'memorial'    // Death memorial
  | 'welcome'     // New member joined
  | 'milestone'   // Family milestones
  | 'memory';     // "On This Day" memories

/**
 * Family group chat record
 */
export interface FamilyGroupChat {
  id: string;
  tree_root_user_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  member_limit: number;
  created_at: string;
  updated_at: string;
}

/**
 * Chat member record
 */
export interface FamilyChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: FamilyChatRole;
  is_muted: boolean;
  muted_until: string | null;
  notifications_enabled: boolean;
  email_notifications: boolean;
  last_read_at: string;
  last_read_message_id: string | null;
  joined_at: string;
}

/**
 * Chat member with profile info
 */
export interface FamilyChatMemberWithProfile extends FamilyChatMember {
  profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

/**
 * Chat message record
 */
export interface FamilyChatMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string;
  message_type: ChatMessageType;
  metadata: ChatMessageMetadata;
  memory_source_id: string | null;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  created_at: string;
  edited_at: string | null;
}

/**
 * Chat message with sender profile
 */
export interface FamilyChatMessageWithSender extends FamilyChatMessage {
  sender: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Metadata for different system message types
 */
export interface ChatMessageMetadata {
  // Welcome message
  user_id?: string;
  relationship_type?: string;

  // Birthday message
  person_id?: string;
  person_name?: string;
  age?: number;

  // Anniversary message
  person1_id?: string;
  person1_name?: string;
  person2_id?: string;
  person2_name?: string;
  years_married?: number;

  // Memorial message
  death_date?: string;
  years_since?: number;

  // Memory (On This Day)
  original_date?: string;
  years_ago?: number;
  original_sender_name?: string;
}

/**
 * "On This Day" memory result
 */
export interface OnThisDayMemory {
  message_id: string;
  content: string;
  sender_id: string | null;
  sender_name: string | null;
  created_at: string;
  years_ago: number;
}

/**
 * Chat with details for list display
 */
export interface FamilyChatWithDetails extends FamilyGroupChat {
  unread_count: number;
  member_count: number;
  last_message?: {
    content: string;
    sender_name: string | null;
    created_at: string;
    message_type: ChatMessageType;
  };
}

/**
 * API request/response types
 */

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: FamilyChatMessageWithSender;
}

export interface GetMessagesResponse {
  messages: FamilyChatMessageWithSender[];
  has_more: boolean;
  cursor?: string;
}

export interface GetChatResponse {
  chat: FamilyChatWithDetails;
  members: FamilyChatMemberWithProfile[];
  current_member: FamilyChatMember;
}

export interface UpdatePreferencesRequest {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
}

export interface MarkReadRequest {
  message_id?: string;
}

/**
 * Admin actions
 */
export interface AdminMuteRequest {
  user_id: string;
  muted: boolean;
  duration_hours?: number; // null = permanent
}

export interface AdminRoleRequest {
  user_id: string;
  role: FamilyChatRole;
}

export interface AdminDeleteMessageRequest {
  message_id: string;
}

/**
 * Realtime event payloads
 */
export interface ChatMessageInsertPayload {
  new: FamilyChatMessage;
}

export interface ChatMemberUpdatePayload {
  new: FamilyChatMember;
  old: FamilyChatMember;
}

/**
 * System message templates
 */
export const SYSTEM_MESSAGE_TEMPLATES = {
  birthday: (name: string, age: number) =>
    `🎂 Today is ${name}'s ${age}${getOrdinalSuffix(age)} birthday! Send them your wishes!`,

  birthday_upcoming: (name: string, days: number) =>
    `🎂 ${name}'s birthday is in ${days} day${days === 1 ? '' : 's'}!`,

  anniversary: (name1: string, name2: string, years: number) =>
    `💍 Happy ${years}${getOrdinalSuffix(years)} wedding anniversary to ${name1} and ${name2}!`,

  memorial: (name: string, years: number) =>
    `🕯️ Today we remember ${name}, ${years} year${years === 1 ? '' : 's'} since they passed.`,

  welcome: (name: string) =>
    `👋 Welcome to the family chat, ${name}!`,

  memory: (originalContent: string, senderName: string, yearsAgo: number) =>
    `📸 On this day ${yearsAgo} year${yearsAgo === 1 ? '' : 's'} ago, ${senderName} wrote:\n\n"${originalContent}"`,

  milestone: (description: string) =>
    `🌟 Family milestone: ${description}`,
} as const;

/**
 * Helper for ordinal suffixes (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
