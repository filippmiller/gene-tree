'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ThreadWithDetails } from '@/types/messaging';

interface ThreadListProps {
  threads: ThreadWithDetails[];
  onSelectThread: (threadId: string) => void;
}

function formatRelativeTime(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const isRu = locale === 'ru';

    if (diffMins < 1) {
      return isRu ? 'сейчас' : 'now';
    }
    if (diffMins < 60) {
      return isRu ? `${diffMins} мин` : `${diffMins}m`;
    }
    if (diffHours < 24) {
      return isRu ? `${diffHours} ч` : `${diffHours}h`;
    }
    if (diffDays < 7) {
      return isRu ? `${diffDays} д` : `${diffDays}d`;
    }
    return d.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

export default function ThreadList({ threads, onSelectThread }: ThreadListProps) {
  const t = useTranslations('messaging');
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  return (
    <div className="overflow-y-auto h-full">
      <ul className="divide-y divide-border/50">
        {threads.map((thread) => {
          const { other_participant, last_message, unread_count } = thread;
          const hasUnread = unread_count > 0;
          const name = `${other_participant.first_name || ''} ${other_participant.last_name || ''}`.trim() || t('unknownUser');

          return (
            <li key={thread.id}>
              <button
                className={cn(
                  'w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-200',
                  'hover:bg-white/80 dark:hover:bg-gray-800/50',
                  hasUnread && 'bg-primary/5 dark:bg-primary/10'
                )}
                onClick={() => onSelectThread(thread.id)}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={other_participant.avatar_url || undefined} alt={name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary font-medium">
                      {getInitials(other_participant.first_name, other_participant.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                      {unread_count > 9 ? '9+' : unread_count}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'font-medium truncate',
                        hasUnread ? 'text-foreground' : 'text-foreground/90'
                      )}
                    >
                      {name}
                    </span>
                    {last_message && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatRelativeTime(last_message.created_at, locale)}
                      </span>
                    )}
                  </div>
                  {last_message ? (
                    <p
                      className={cn(
                        'text-sm truncate mt-0.5',
                        hasUnread
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {last_message.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 mt-0.5 italic">
                      {t('noMessages')}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
