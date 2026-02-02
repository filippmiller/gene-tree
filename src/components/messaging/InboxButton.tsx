'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, MessageCircleMore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/useMessages';
import InboxDrawer from './InboxDrawer';

export default function InboxButton() {
  const t = useTranslations('messaging');
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, threads, isLoading, refreshThreads } = useMessages();

  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();
  const hasUnread = unreadCount > 0;
  const Icon = hasUnread ? MessageCircleMore : MessageCircle;

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Refresh threads when opening
      refreshThreads();
    }
  }, [refreshThreads]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => handleOpenChange(true)}
        aria-label={t('inbox')}
      >
        <Icon
          className={cn(
            'h-5 w-5 transition-colors',
            hasUnread && 'text-primary'
          )}
        />
        {hasUnread && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center',
              'rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
              'ring-2 ring-background',
              'animate-in zoom-in-50 duration-200'
            )}
          >
            {displayCount}
          </span>
        )}
      </Button>

      <InboxDrawer
        open={isOpen}
        onOpenChange={handleOpenChange}
        threads={threads}
        isLoading={isLoading}
      />
    </>
  );
}
