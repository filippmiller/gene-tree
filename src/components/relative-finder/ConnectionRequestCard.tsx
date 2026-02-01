'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConnectionRequestWithProfiles } from '@/lib/relatives/types';

interface ConnectionRequestCardProps {
  request: ConnectionRequestWithProfiles;
  currentUserId: string;
  onAccept?: (requestId: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ConnectionRequestCard({
  request,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  isLoading = false,
}: ConnectionRequestCardProps) {
  const t = useTranslations('relativeFinder');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isSender = request.from_user_id === currentUserId;
  const otherUser = isSender ? request.to_user : request.from_user;

  const handleAction = async (action: 'accept' | 'decline' | 'cancel') => {
    setActionLoading(action);
    try {
      if (action === 'accept' && onAccept) {
        await onAccept(request.id);
      } else if (action === 'decline' && onDecline) {
        await onDecline(request.id);
      } else if (action === 'cancel' && onCancel) {
        await onCancel(request.id);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const initials = `${otherUser.first_name[0]}${otherUser.last_name[0]}`.toUpperCase();

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {otherUser.first_name} {otherUser.last_name}
              </h3>
              <Badge className={statusColors[request.status]}>
                {t(`status.${request.status}`)}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {isSender ? t('sentTo') : t('receivedFrom')} - {formatDate(request.created_at)}
            </p>

            {request.relationship_description && (
              <p className="text-sm text-muted-foreground mt-1">
                {request.relationship_description}
              </p>
            )}

            {request.message && (
              <p className="text-sm mt-2 p-2 bg-muted rounded-md">
                &ldquo;{request.message}&rdquo;
              </p>
            )}

            {request.shared_ancestor && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('sharedAncestor')}: {request.shared_ancestor.first_name} {request.shared_ancestor.last_name}
                {request.shared_ancestor.birth_date && (
                  <span> ({new Date(request.shared_ancestor.birth_date).getFullYear()}
                    {request.shared_ancestor.death_date &&
                      `-${new Date(request.shared_ancestor.death_date).getFullYear()}`})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="mt-4 flex gap-2 justify-end">
            {isSender ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('cancel')}
                disabled={isLoading || actionLoading !== null}
              >
                {actionLoading === 'cancel' ? t('cancelling') : t('cancelRequest')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('decline')}
                  disabled={isLoading || actionLoading !== null}
                >
                  {actionLoading === 'decline' ? t('declining') : t('decline')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction('accept')}
                  disabled={isLoading || actionLoading !== null}
                >
                  {actionLoading === 'accept' ? t('accepting') : t('accept')}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
