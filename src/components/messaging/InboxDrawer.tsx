'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { ThreadWithDetails } from '@/types/messaging';
import ThreadList from './ThreadList';
import MessageThread from './MessageThread';

interface InboxDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: ThreadWithDetails[];
  isLoading: boolean;
}

export default function InboxDrawer({
  open,
  onOpenChange,
  threads,
  isLoading,
}: InboxDrawerProps) {
  const t = useTranslations('messaging');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const handleBack = () => {
    setSelectedThreadId(null);
  };

  const handleClose = () => {
    setSelectedThreadId(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10">
          <div className="flex items-center gap-3">
            {selectedThreadId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left">
                {selectedThread
                  ? `${selectedThread.other_participant.first_name || ''} ${selectedThread.other_participant.last_name || ''}`.trim() || t('unknownUser')
                  : t('inbox')}
              </SheetTitle>
              {!selectedThreadId && (
                <SheetDescription className="text-left text-xs mt-0.5">
                  {t('inboxDescription')}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedThreadId ? (
            <MessageThread
              threadId={selectedThreadId}
              otherParticipant={selectedThread?.other_participant || null}
            />
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 dark:from-primary/20 dark:to-emerald-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {t('noConversations')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('noConversationsHint')}
              </p>
            </div>
          ) : (
            <ThreadList
              threads={threads}
              onSelectThread={setSelectedThreadId}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
