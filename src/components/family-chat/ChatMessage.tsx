'use client';

/**
 * Chat Message Component
 *
 * Displays a single message in the family chat.
 * Handles both user messages and system messages.
 */

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { FamilyChatMessageWithSender, ChatMessageType } from '@/types/family-chat';
import {
  Cake,
  Heart,
  Flame,
  UserPlus,
  Star,
  Clock,
  Bot,
} from 'lucide-react';

interface ChatMessageProps {
  message: FamilyChatMessageWithSender;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const SYSTEM_MESSAGE_ICONS: Record<ChatMessageType, typeof Bot> = {
  system: Bot,
  birthday: Cake,
  anniversary: Heart,
  memorial: Flame,
  welcome: UserPlus,
  milestone: Star,
  memory: Clock,
  user: Bot, // Won't be used for user messages
};

const SYSTEM_MESSAGE_COLORS: Record<ChatMessageType, string> = {
  system: 'bg-muted text-muted-foreground',
  birthday: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  anniversary: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  memorial: 'bg-[#8B949E]/10 text-[#8B949E] dark:bg-[#8B949E]/10 dark:text-[#8B949E]',
  welcome: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  milestone: 'bg-[#D29922]/10 text-[#D29922] dark:bg-[#D29922]/10 dark:text-[#D29922]',
  memory: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  user: '',
};

function ChatMessageComponent({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = false,
}: ChatMessageProps) {
  const isSystemMessage = message.message_type !== 'user';
  const senderName = message.sender
    ? `${message.sender.first_name} ${message.sender.last_name}`
    : 'Unknown';
  const initials = message.sender
    ? `${message.sender.first_name?.[0] || ''}${message.sender.last_name?.[0] || ''}`
    : '?';

  // System message rendering
  if (isSystemMessage) {
    const Icon = SYSTEM_MESSAGE_ICONS[message.message_type];
    const colorClass = SYSTEM_MESSAGE_COLORS[message.message_type];

    return (
      <div className="flex justify-center py-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm',
            colorClass
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  // User message rendering
  return (
    <div
      className={cn(
        'flex gap-3 py-1',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={message.sender?.avatar_url || undefined}
            alt={senderName}
          />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      {/* Empty space when hiding avatar for alignment */}
      {!showAvatar && <div className="w-8 shrink-0" />}

      {/* Message bubble */}
      <div
        className={cn(
          'flex max-w-[70%] flex-col',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender name (for other people's messages) */}
        {!isOwnMessage && showAvatar && (
          <span className="mb-1 text-xs font-medium text-muted-foreground">
            {senderName}
          </span>
        )}

        {/* Message content */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <span className="mt-1 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);
export default ChatMessage;
