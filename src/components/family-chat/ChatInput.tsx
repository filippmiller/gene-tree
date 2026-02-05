'use client';

/**
 * Chat Input Component
 *
 * Text input for sending messages with auto-resize
 * and keyboard shortcuts.
 */

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => Promise<boolean>;
  isSending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  isSending = false,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 5000,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending || disabled) return;

    const success = await onSend(content);
    if (success) {
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [content, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxLength) {
        setContent(value);
      }

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    },
    [maxLength]
  );

  const isOverLimit = content.length > maxLength * 0.9;
  const charCount = content.length;

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[200px] resize-none pr-16',
              disabled && 'opacity-50'
            )}
          />

          {/* Character count */}
          {content.length > 100 && (
            <span
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Hint text */}
      <p className="mt-1 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

export default ChatInput;
