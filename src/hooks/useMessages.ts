'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  ThreadWithDetails,
  FamilyMessage,
  ThreadParticipant,
} from '@/types/messaging';

interface UseMessagesOptions {
  /**
   * Whether to enable real-time subscriptions
   * @default true
   */
  enabled?: boolean;
}

interface UseMessagesResult {
  /**
   * List of message threads with details
   */
  threads: ThreadWithDetails[];
  /**
   * Total unread message count
   */
  unreadCount: number;
  /**
   * Whether threads are loading
   */
  isLoading: boolean;
  /**
   * Error if any
   */
  error: Error | null;
  /**
   * Refresh threads from server
   */
  refreshThreads: () => Promise<void>;
  /**
   * Get or create a thread with a user
   */
  getOrCreateThread: (recipientId: string) => Promise<string | null>;
  /**
   * Whether realtime is connected
   */
  isConnected: boolean;
}

/**
 * Hook for managing message threads and unread counts
 */
export function useMessages(options: UseMessagesOptions = {}): UseMessagesResult {
  const { enabled = true } = options;

  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/threads');
      if (!res.ok) {
        throw new Error('Failed to fetch threads');
      }
      const data = await res.json();
      setThreads(data.threads || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch threads'));
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const refreshThreads = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchThreads(), fetchUnreadCount()]);
    setIsLoading(false);
  }, [fetchThreads, fetchUnreadCount]);

  const getOrCreateThread = useCallback(async (recipientId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      if (!res.ok) {
        throw new Error('Failed to create thread');
      }
      const data = await res.json();
      // Refresh threads to include the new one
      await refreshThreads();
      return data.thread?.id || null;
    } catch (err) {
      console.error('Error creating thread:', err);
      return null;
    }
  }, [refreshThreads]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseBrowser();

    const setupSubscription = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new messages
      const channel = supabase
        .channel('messages-inbox')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_messages',
          },
          (payload) => {
            // Refresh threads when a new message arrives
            fetchThreads();
            // If message is not from current user, increment unread
            if (payload.new && (payload.new as FamilyMessage).from_user_id !== user.id) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'family_messages',
          },
          () => {
            // Refresh when messages are marked as read
            fetchUnreadCount();
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
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, fetchThreads, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refreshThreads();
    }
  }, [enabled, refreshThreads]);

  return {
    threads,
    unreadCount,
    isLoading,
    error,
    refreshThreads,
    getOrCreateThread,
    isConnected,
  };
}

// ============================================================================
// Hook for a single message thread
// ============================================================================

interface UseThreadMessagesOptions {
  threadId: string | null;
  enabled?: boolean;
}

interface UseThreadMessagesResult {
  messages: FamilyMessage[];
  otherParticipant: ThreadParticipant | null;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<boolean>;
  markAsRead: () => Promise<void>;
  isSending: boolean;
  isConnected: boolean;
}

/**
 * Hook for managing messages within a single thread
 */
export function useThreadMessages(options: UseThreadMessagesOptions): UseThreadMessagesResult {
  const { threadId, enabled = true } = options;

  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [otherParticipant, setOtherParticipant] = useState<ThreadParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;

    try {
      const res = await fetch(`/api/messages/threads/${threadId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setOtherParticipant(data.other_participant || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!threadId || !content.trim()) return false;

    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/threads/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      // Optimistically add the message
      setMessages((prev) => [...prev, data.message]);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [threadId]);

  const markAsRead = useCallback(async () => {
    if (!threadId) return;

    try {
      await fetch(`/api/messages/threads/${threadId}/read`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [threadId]);

  // Set up realtime subscription for this thread
  useEffect(() => {
    if (!enabled || !threadId) return;

    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const newMessage = payload.new as FamilyMessage;
          // Add message if not already present (avoid duplicates from optimistic update)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Mark as read if from other user
          const { data: { user } } = await supabase.auth.getUser();
          if (user && newMessage.from_user_id !== user.id) {
            markAsRead();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, threadId, markAsRead]);

  // Initial fetch
  useEffect(() => {
    if (enabled && threadId) {
      setIsLoading(true);
      fetchMessages();
    }
  }, [enabled, threadId, fetchMessages]);

  // Mark as read when thread is opened
  useEffect(() => {
    if (enabled && threadId && messages.length > 0) {
      markAsRead();
    }
  }, [enabled, threadId, messages.length, markAsRead]);

  return {
    messages,
    otherParticipant,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    isSending,
    isConnected,
  };
}

export default useMessages;
