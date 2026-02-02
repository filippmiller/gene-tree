'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useThreadMessages } from '@/hooks/useMessages';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { ThreadParticipant, FamilyMessage } from '@/types/messaging';

interface MessageThreadProps {
  threadId: string;
  otherParticipant: ThreadParticipant | null;
}

function formatMessageTime(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isRu = locale === 'ru';

    if (isToday) {
      return d.toLocaleTimeString(isRu ? 'ru-RU' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return d.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

interface MessageBubbleProps {
  message: FamilyMessage;
  isOwn: boolean;
  locale: string;
  showTime?: boolean;
}

function MessageBubble({ message, isOwn, locale, showTime = true }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%]',
        isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isOwn
            ? 'bg-gradient-to-r from-primary to-emerald-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md'
        )}
      >
        {message.content}
      </div>
      {showTime && (
        <span
          className={cn(
            'text-[10px] text-muted-foreground mt-1 px-1',
            isOwn ? 'text-right' : 'text-left'
          )}
        >
          {formatMessageTime(message.created_at, locale)}
          {isOwn && message.read_at && (
            <span className="ml-1 text-primary/70">
              {'read'}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default function MessageThread({ threadId, otherParticipant }: MessageThreadProps) {
  const t = useTranslations('messaging');
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    isSending,
  } = useThreadMessages({ threadId, enabled: true });

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue('');

    const success = await sendMessage(content);
    if (!success) {
      // Restore input if send failed
      setInputValue(content);
    }
  }, [inputValue, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set height to scrollHeight (max 120px)
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              {t('startConversation', {
                name: otherParticipant?.first_name || t('them'),
              })}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.from_user_id === currentUserId;
            // Show time if first message, or if time gap is > 5 minutes
            const prevMessage = messages[index - 1];
            const showTime =
              !prevMessage ||
              new Date(message.created_at).getTime() -
                new Date(prevMessage.created_at).getTime() >
                5 * 60 * 1000;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                locale={locale}
                showTime={showTime}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-3 bg-white/50 dark:bg-gray-900/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            className={cn(
              'flex-1 min-h-[40px] max-h-[120px] resize-none rounded-xl border border-border/50',
              'bg-white dark:bg-gray-800 px-4 py-2.5 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
              'transition-all duration-200'
            )}
            rows={1}
            disabled={isSending}
          />
          <Button
            size="icon"
            className={cn(
              'h-10 w-10 shrink-0 rounded-xl',
              'bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90',
              'shadow-lg shadow-primary/25'
            )}
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          {t('enterToSend')}
        </p>
      </div>
    </div>
  );
}
