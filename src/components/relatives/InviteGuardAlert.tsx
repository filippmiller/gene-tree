'use client';

import * as React from 'react';
import Link from 'next/link';
import { UserCheck, Clock, Users, XCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

/**
 * Smart Invite Guard Alert Component
 *
 * Displays contextual alerts based on invite eligibility check results.
 * Handles 5 statuses: EXISTING_MEMBER, PENDING_INVITE, POTENTIAL_BRIDGE, SELF_INVITE, OK_TO_INVITE
 *
 * @see docs/specs/SPRINT1_SMART_INVITE_GUARD.md
 */

// Type definitions from the spec
interface ExistingMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  addedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  addedAt: string;
  relationshipPath?: string;
}

interface PendingInvite {
  id: string;
  firstName: string;
  lastName: string;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  invitedAt: string;
  status: 'pending' | 'expired';
}

interface BridgeCandidate {
  exists: boolean;
}

export interface InviteCheckResult {
  status: 'OK_TO_INVITE' | 'EXISTING_MEMBER' | 'PENDING_INVITE' | 'POTENTIAL_BRIDGE' | 'SELF_INVITE';
  existingMember?: ExistingMember;
  pendingInvite?: PendingInvite;
  bridgeCandidate?: BridgeCandidate;
}

interface InviteGuardAlertProps {
  result: InviteCheckResult | null;
  onSendReminder?: (inviteId: string) => Promise<void>;
  onSendBridgeRequest?: () => Promise<void>;
  onDismiss?: () => void;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'сегодня';
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return `${diffDays} дней назад`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'неделю' : 'недель'} назад`;
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

/**
 * Get initials from first and last name for avatar fallback
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function InviteGuardAlert({
  result,
  onSendReminder,
  onSendBridgeRequest,
  onDismiss,
}: InviteGuardAlertProps) {
  const [isLoadingReminder, setIsLoadingReminder] = React.useState(false);
  const [isLoadingBridge, setIsLoadingBridge] = React.useState(false);

  // Return null for OK_TO_INVITE or no result
  if (!result || result.status === 'OK_TO_INVITE') {
    return null;
  }

  // Handle reminder send
  const handleSendReminder = async () => {
    if (!onSendReminder || !result.pendingInvite) return;

    setIsLoadingReminder(true);
    try {
      await onSendReminder(result.pendingInvite.id);
    } finally {
      setIsLoadingReminder(false);
    }
  };

  // Handle bridge request
  const handleSendBridgeRequest = async () => {
    if (!onSendBridgeRequest) return;

    setIsLoadingBridge(true);
    try {
      await onSendBridgeRequest();
    } finally {
      setIsLoadingBridge(false);
    }
  };

  // EXISTING_MEMBER: User already in family tree
  if (result.status === 'EXISTING_MEMBER' && result.existingMember) {
    const member = result.existingMember;

    return (
      <Alert variant="info" className="mt-4">
        <UserCheck className="h-4 w-4" />
        <AlertTitle>Хорошие новости!</AlertTitle>
        <AlertDescription>
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-12 w-12">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
              ) : null}
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {getInitials(member.firstName, member.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-base">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Добавлен пользователем {member.addedBy.firstName} {formatDate(member.addedAt)}
              </p>
              {member.relationshipPath && (
                <p className="text-sm text-blue-700 mt-1">
                  {member.relationshipPath}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/profile/${member.id}`}>
                Посмотреть профиль
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/profile/${member.id}?tab=relationship`}>
                Как вы связаны
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // PENDING_INVITE: Invite already sent
  if (result.status === 'PENDING_INVITE' && result.pendingInvite) {
    const invite = result.pendingInvite;

    return (
      <Alert variant="warning" className="mt-4">
        <Clock className="h-4 w-4" />
        <AlertTitle>Приглашение уже отправлено</AlertTitle>
        <AlertDescription>
          <p className="mt-1">
            <span className="font-medium">{invite.firstName} {invite.lastName}</span> уже был(а) приглашен(а)
            пользователем <span className="font-medium">{invite.invitedBy.firstName} {invite.invitedBy.lastName}</span>
            {' '}{formatDate(invite.invitedAt)}.
          </p>
          {invite.status === 'expired' && (
            <p className="text-sm text-amber-700 mt-2">
              Приглашение истекло. Вы можете отправить напоминание.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            {onSendReminder && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminder}
                loading={isLoadingReminder}
              >
                Отправить напоминание
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Отмена
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // POTENTIAL_BRIDGE: User exists but not connected
  if (result.status === 'POTENTIAL_BRIDGE') {
    return (
      <Alert variant="info" className="mt-4">
        <Users className="h-4 w-4" />
        <AlertTitle>Пользователь с таким email существует</AlertTitle>
        <AlertDescription>
          <p className="mt-1">
            Пользователь Gene-Tree с таким адресом электронной почты существует, но еще не связан с вашим семейным деревом.
            Хотите отправить запрос на подключение?
          </p>
          <div className="flex gap-2 mt-3">
            {onSendBridgeRequest && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSendBridgeRequest}
                loading={isLoadingBridge}
              >
                Отправить запрос на подключение
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Отмена
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // SELF_INVITE: Cannot invite yourself
  if (result.status === 'SELF_INVITE') {
    return (
      <Alert variant="error" className="mt-4">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Невозможно пригласить себя</AlertTitle>
        <AlertDescription>
          <p className="mt-1">
            Это ваш собственный адрес электронной почты. Ищете кого-то с похожим email?
          </p>
          <Button
            variant="link"
            className="p-0 h-auto mt-2 text-sm"
            asChild
          >
            <Link href="/support">
              Связаться с поддержкой
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Fallback - should never happen
  return null;
}
