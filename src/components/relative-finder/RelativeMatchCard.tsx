'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { PotentialRelative } from '@/lib/relatives/types';

interface RelativeMatchCardProps {
  match: PotentialRelative;
  onConnect: (match: PotentialRelative, message: string) => Promise<void>;
  isConnecting?: boolean;
}

export function RelativeMatchCard({
  match,
  onConnect,
  isConnecting = false,
}: RelativeMatchCardProps) {
  const t = useTranslations('relativeFinder');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    await onConnect(match, message);
    setMessage('');
    setShowMessage(false);
  };

  const initials = match.relative_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const ancestorYears = match.shared_ancestor_birth_year || match.shared_ancestor_death_year
    ? ` (${match.shared_ancestor_birth_year || '?'}-${match.shared_ancestor_death_year || '?'})`
    : '';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={match.relative_avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {match.relative_name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {match.relationship_description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('sharedAncestor')}: {match.shared_ancestor_name}{ancestorYears}
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="text-xs text-muted-foreground text-center mb-2">
              {match.relationship_closeness} {t('generations')}
            </div>
          </div>
        </div>

        {showMessage ? (
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder={t('messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMessage(false);
                  setMessage('');
                }}
                disabled={isConnecting}
              >
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? t('sending') : t('sendRequest')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowMessage(true)}
              disabled={isConnecting}
            >
              {t('connect')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
