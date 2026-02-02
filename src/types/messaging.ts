/**
 * Types for the family messaging system
 */

export interface MessageThread {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMessage {
  id: string;
  thread_id: string;
  from_user_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ThreadParticipant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface ThreadWithDetails {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_participant: ThreadParticipant;
  last_message: {
    content: string;
    created_at: string;
    from_user_id: string;
  } | null;
  unread_count: number;
}

export interface MessageWithSender extends FamilyMessage {
  sender: ThreadParticipant;
}

export interface CreateThreadRequest {
  recipient_id: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface ThreadsResponse {
  threads: ThreadWithDetails[];
}

export interface MessagesResponse {
  messages: FamilyMessage[];
  thread: MessageThread;
  other_participant: ThreadParticipant;
}

export interface UnreadCountResponse {
  count: number;
}

export interface SendMessageResponse {
  message: FamilyMessage;
}

export interface CreateThreadResponse {
  thread: MessageThread;
}
