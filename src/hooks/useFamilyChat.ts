'use client';

/**
 * Family Group Chat Hook
 *
 * Manages the family group chat with real-time updates,
 * message sending, and read tracking.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  FamilyChatWithDetails,
  FamilyChatMemberWithProfile,
  FamilyChatMember,
  FamilyChatMessageWithSender,
  GetChatResponse,
} from '@/types/family-chat';

interface UseFamilyChatOptions {
  /**
   * Whether to enable the chat
   * @default true
   */
  enabled?: boolean;
}

interface UseFamilyChatResult {
  /**
   * Chat details with unread count and last message
   */
  chat: FamilyChatWithDetails | null;
  /**
   * List of chat members with profiles
   */
  members: FamilyChatMemberWithProfile[];
  /**
   * Current user's membership
   */
  currentMember: FamilyChatMember | null;
  /**
   * Chat messages (newest at the end)
   */
  messages: FamilyChatMessageWithSender[];
  /**
   * Unread message count
   */
  unreadCount: number;
  /**
   * Whether there are more messages to load
   */
  hasMoreMessages: boolean;
  /**
   * Whether initial data is loading
   */
  isLoading: boolean;
  /**
   * Whether messages are loading
   */
  isLoadingMessages: boolean;
  /**
   * Error if any
   */
  error: Error | null;
  /**
   * Send a message
   */
  sendMessage: (content: string) => Promise<boolean>;
  /**
   * Whether a message is being sent
   */
  isSending: boolean;
  /**
   * Load more messages (older)
   */
  loadMoreMessages: () => Promise<void>;
  /**
   * Mark messages as read
   */
  markAsRead: () => Promise<void>;
  /**
   * Refresh chat data
   */
  refreshChat: () => Promise<void>;
  /**
   * Whether realtime is connected
   */
  isConnected: boolean;
}

/**
 * Hook for managing family group chat
 */
export function useFamilyChat(options: UseFamilyChatOptions = {}): UseFamilyChatResult {
  const { enabled = true } = options;

  const [chat, setChat] = useState<FamilyChatWithDetails | null>(null);
  const [members, setMembers] = useState<FamilyChatMemberWithProfile[]>([]);
  const [currentMember, setCurrentMember] = useState<FamilyChatMember | null>(null);
  const [messages, setMessages] = useState<FamilyChatMessageWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorRef = useRef<string | null>(null);

  // Fetch chat details
  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch('/api/family-chat');
      if (!res.ok) {
        throw new Error('Failed to fetch chat');
      }
      const data: GetChatResponse = await res.json();
      setChat(data.chat);
      setMembers(data.members);
      setCurrentMember(data.current_member);
      setUnreadCount(data.chat.unread_count);
      setError(null);
      return data.chat.id;
    } catch (err) {
      console.error('[FamilyChat] Error fetching chat:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch chat'));
      return null;
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (cursor?: string | null) => {
    try {
      const url = cursor
        ? `/api/family-chat/messages?cursor=${encodeURIComponent(cursor)}`
        : '/api/family-chat/messages';

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();

      if (cursor) {
        // Prepend older messages
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        // Initial load
        setMessages(data.messages);
      }

      setHasMoreMessages(data.has_more);
      cursorRef.current = data.cursor || null;
      setError(null);
    } catch (err) {
      console.error('[FamilyChat] Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    }
  }, []);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMessages) return;

    setIsLoadingMessages(true);
    await fetchMessages(cursorRef.current);
    setIsLoadingMessages(false);
  }, [hasMoreMessages, isLoadingMessages, fetchMessages]);

  // Send message
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!content.trim() || isSending) return false;

    setIsSending(true);
    try {
      const res = await fetch('/api/family-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await res.json();

      // Optimistically add message (will be deduplicated by realtime)
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });

      return true;
    } catch (err) {
      console.error('[FamilyChat] Error sending message:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    try {
      await fetch('/api/family-chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
    } catch (err) {
      console.error('[FamilyChat] Error marking as read:', err);
    }
  }, []);

  // Refresh chat data
  const refreshChat = useCallback(async () => {
    setIsLoading(true);
    await fetchChat();
    await fetchMessages();
    setIsLoading(false);
  }, [fetchChat, fetchMessages]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enabled || !chat) return;

    const supabase = getSupabaseBrowser();

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new messages in this chat
      const channel = supabase
        .channel(`family-chat-${chat.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `chat_id=eq.${chat.id}`,
          },
          async (payload) => {
            const newMessage = payload.new as FamilyChatMessageWithSender;

            // Fetch sender info if not present
            if (newMessage.sender_id && !newMessage.sender) {
              const { data: sender } = await supabase
                .from('user_profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', newMessage.sender_id)
                .single();

              newMessage.sender = sender || null;
            }

            // Add message if not already present (dedup from optimistic update)
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Increment unread if from another user
            if (newMessage.sender_id !== user.id) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `chat_id=eq.${chat.id}`,
          },
          (payload) => {
            const updatedMessage = payload.new as FamilyChatMessageWithSender;

            // Update message in list (handles edits and deletes)
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
            );
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseBrowser();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, chat]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      setIsLoading(true);
      const chatId = await fetchChat();
      if (chatId) {
        await fetchMessages();
      }
      setIsLoading(false);
    };

    init();
  }, [enabled, fetchChat, fetchMessages]);

  return {
    chat,
    members,
    currentMember,
    messages,
    unreadCount,
    hasMoreMessages,
    isLoading,
    isLoadingMessages,
    error,
    sendMessage,
    isSending,
    loadMoreMessages,
    markAsRead,
    refreshChat,
    isConnected,
  };
}

export default useFamilyChat;
