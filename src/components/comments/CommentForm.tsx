'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';
import { MAX_COMMENT_LENGTH } from '@/types/comments';

interface CommentFormProps {
  parentId?: string | null;
  onSubmit: (content: string, parentId: string | null) => Promise<void>;
  onCancel?: () => void;
  currentUser: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  placeholder?: string;
  autoFocus?: boolean;
}

export default function CommentForm({
  parentId = null,
  onSubmit,
  onCancel,
  currentUser,
  placeholder = 'Write a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), parentId);
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const userInitials = `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}`;
  const charsRemaining = MAX_COMMENT_LENGTH - content.length;

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={currentUser.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={MAX_COMMENT_LENGTH}
            className="min-h-[60px] pr-20 resize-none text-sm"
            disabled={isSubmitting}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={!content.trim() || isSubmitting}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {content.length > MAX_COMMENT_LENGTH * 0.8 && (
          <p className={`text-xs mt-1 ${charsRemaining < 100 ? 'text-orange-500' : 'text-gray-400'}`}>
            {charsRemaining} characters remaining
          </p>
        )}
      </div>
    </form>
  );
}
