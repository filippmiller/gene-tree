'use client';

/**
 * Family Chat Component
 *
 * Main component for the family group chat feature.
 * Combines message list, input, and member management.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useFamilyChat } from '@/hooks/useFamilyChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMembers } from './ChatMembers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Wifi,
  WifiOff,
  ChevronUp,
  Loader2,
  AlertCircle,
  Settings,
  Bell,
  BellOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { FamilyChatRole } from '@/types/family-chat';

interface FamilyChatProps {
  className?: string;
}

export function FamilyChat({ className }: FamilyChatProps) {
  const {
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
    isConnected,
  } = useFamilyChat();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Mark messages as read when chat is visible
  useEffect(() => {
    if (messages.length > 0 && unreadCount > 0) {
      markAsRead();
    }
  }, [messages.length, unreadCount, markAsRead]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom);

    // Load more messages when scrolling to top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
  }, []);

  // Admin actions
  const handleMute = async (userId: string, muted: boolean) => {
    await fetch('/api/family-chat/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mute',
        data: { user_id: userId, muted },
      }),
    });
  };

  const handleSetRole = async (userId: string, role: FamilyChatRole) => {
    await fetch('/api/family-chat/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_role',
        data: { user_id: userId, role },
      }),
    });
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    await fetch('/api/family-chat/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications_enabled: newValue }),
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex h-full items-center justify-center p-8', className)}>
        <Alert variant="error" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load family chat. Please try again later.
            <br />
            <span className="text-xs opacity-75">{error.message}</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No chat (shouldn't happen, but handle gracefully)
  if (!chat || !currentMember) {
    return (
      <div className={cn('flex h-full items-center justify-center p-8', className)}>
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
          <p className="mt-2">Family chat not available</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentMember.role === 'admin';
  const isMuted = currentMember.is_muted && (!currentMember.muted_until || new Date(currentMember.muted_until) > new Date());

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">{chat.name}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{members.length} members</span>
              <span>•</span>
              {isConnected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#D29922]">
                  <WifiOff className="h-3 w-3" />
                  Reconnecting...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Members sheet */}
          <ChatMembers
            members={members}
            currentUserId={currentMember.user_id}
            isAdmin={isAdmin}
            onMute={isAdmin ? handleMute : undefined}
            onSetRole={isAdmin ? handleSetRole : undefined}
          />

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleNotifications}>
                {notificationsEnabled ? (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    Mute notifications
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Enable notifications
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {isAdmin ? 'You are an admin' : 'You are a member'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {/* Load more indicator */}
        {isLoadingMessages && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Load more button */}
        {hasMoreMessages && !isLoadingMessages && (
          <div className="flex justify-center py-2">
            <Button variant="ghost" size="sm" onClick={loadMoreMessages}>
              <ChevronUp className="mr-1 h-4 w-4" />
              Load older messages
            </Button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No messages yet</p>
              <p className="text-sm">Be the first to say hello to your family!</p>
            </div>
          </div>
        )}

        {/* Messages list */}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showAvatar =
            !prevMessage ||
            prevMessage.sender_id !== message.sender_id ||
            prevMessage.message_type !== 'user' ||
            // Show avatar if more than 5 minutes gap
            new Date(message.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() >
              5 * 60 * 1000;

          const nextMessage = messages[index + 1];
          const showTimestamp =
            !nextMessage ||
            nextMessage.sender_id !== message.sender_id ||
            nextMessage.message_type !== 'user' ||
            new Date(nextMessage.created_at).getTime() -
              new Date(message.created_at).getTime() >
              5 * 60 * 1000;

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === currentMember.user_id}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
            />
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-24 right-8">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ChevronUp className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}

      {/* Muted warning */}
      {isMuted && (
        <div className="border-t bg-[#D29922]/10 px-4 py-2 text-center text-sm text-[#D29922] dark:bg-[#D29922]/10 dark:text-[#D29922]">
          You are muted and cannot send messages
          {currentMember.muted_until && (
            <span> until {new Date(currentMember.muted_until).toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isSending={isSending}
        disabled={isMuted}
        placeholder={isMuted ? 'You are muted' : 'Type a message...'}
      />
    </div>
  );
}

export default FamilyChat;
