'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  X,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Loader2,
} from 'lucide-react';
import { BridgeAcceptModal } from './BridgeAcceptModal';
import type { BridgeRequestWithProfiles } from '@/types/bridge-request';

const translations = {
  en: {
    status: {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
      withdrawn: 'Withdrawn',
    },
    sent: 'Sent',
    received: 'Received',
    claimedRelationship: 'Claims:',
    commonAncestor: 'Common ancestor hint:',
    supportingInfo: 'Additional info:',
    responseMessage: 'Response:',
    establishedAs: 'Connected as:',
    accept: 'Accept',
    reject: 'Reject',
    withdraw: 'Withdraw',
    block: 'Block User',
    viewProfile: 'View Profile',
    expiresIn: 'Expires in {days} days',
    expired: 'Expired',
    accepting: 'Accepting...',
    rejecting: 'Rejecting...',
    withdrawing: 'Withdrawing...',
    timeAgo: {
      justNow: 'just now',
      minutes: '{count}m ago',
      hours: '{count}h ago',
      days: '{count}d ago',
    },
  },
  ru: {
    status: {
      pending: 'Ожидает',
      accepted: 'Принято',
      rejected: 'Отклонено',
      expired: 'Истёк',
      withdrawn: 'Отозвано',
    },
    sent: 'Отправлено',
    received: 'Получено',
    claimedRelationship: 'Утверждение:',
    commonAncestor: 'Общий предок:',
    supportingInfo: 'Дополнительно:',
    responseMessage: 'Ответ:',
    establishedAs: 'Связаны как:',
    accept: 'Принять',
    reject: 'Отклонить',
    withdraw: 'Отозвать',
    block: 'Заблокировать',
    viewProfile: 'Смотреть профиль',
    expiresIn: 'Истекает через {days} дней',
    expired: 'Истёк',
    accepting: 'Принятие...',
    rejecting: 'Отклонение...',
    withdrawing: 'Отзыв...',
    timeAgo: {
      justNow: 'только что',
      minutes: '{count}м назад',
      hours: '{count}ч назад',
      days: '{count}д назад',
    },
  },
};

interface BridgeRequestCardProps {
  request: BridgeRequestWithProfiles;
  currentUserId: string;
  onAccept: (requestId: string, relationshipType: string, message?: string) => Promise<void>;
  onReject: (requestId: string, message?: string) => Promise<void>;
  onWithdraw: (requestId: string) => Promise<void>;
  onBlock?: (userId: string) => void;
}

export function BridgeRequestCard({
  request,
  currentUserId,
  onAccept,
  onReject,
  onWithdraw,
  onBlock,
}: BridgeRequestCardProps) {
  const { locale } = useParams<{ locale: string }>();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState<'accept' | 'reject' | 'withdraw' | null>(null);

  const isSent = request.requester_id === currentUserId;
  const otherPerson = isSent ? request.target : request.requester;
  const isPending = request.status === 'pending';

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <Ban className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
      case 'withdrawn':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return '';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.timeAgo.justNow;
    if (diffMins < 60) return t.timeAgo.minutes.replace('{count}', diffMins.toString());
    if (diffHours < 24) return t.timeAgo.hours.replace('{count}', diffHours.toString());
    return t.timeAgo.days.replace('{count}', diffDays.toString());
  };

  const getDaysUntilExpiry = () => {
    if (!request.expires_at) return null;
    const now = new Date();
    const expires = new Date(request.expires_at);
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
    return diffDays > 0 ? diffDays : 0;
  };

  const handleAccept = async (relationshipType: string, message?: string) => {
    setIsProcessing('accept');
    try {
      await onAccept(request.id, relationshipType, message);
      setShowAcceptModal(false);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async () => {
    setIsProcessing('reject');
    try {
      await onReject(request.id);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWithdraw = async () => {
    setIsProcessing('withdraw');
    try {
      await onWithdraw(request.id);
    } finally {
      setIsProcessing(null);
    }
  };

  const fullName =
    [otherPerson?.first_name, otherPerson?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Link href={`/${locale}/profile/${otherPerson?.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary">
                <AvatarImage src={otherPerson?.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(otherPerson?.first_name, otherPerson?.last_name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/profile/${otherPerson?.id}`}
                    className="font-medium hover:underline"
                  >
                    {fullName}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {isSent ? t.sent : t.received}
                  </Badge>
                </div>
                <Badge className={`${getStatusColor()} flex items-center gap-1`}>
                  {getStatusIcon()}
                  {t.status[request.status as keyof typeof t.status]}
                </Badge>
              </div>

              {/* Claimed relationship */}
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">{t.claimedRelationship}</span>{' '}
                {request.claimed_relationship}
              </div>

              {/* Common ancestor hint */}
              {request.common_ancestor_hint && (
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">{t.commonAncestor}</span>{' '}
                  {request.common_ancestor_hint}
                </div>
              )}

              {/* Supporting info */}
              {request.supporting_info && (
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">{t.supportingInfo}</span>{' '}
                  {request.supporting_info}
                </div>
              )}

              {/* Response message (if any) */}
              {request.response_message && (
                <div className="text-sm text-muted-foreground mb-2 p-2 bg-muted rounded">
                  <span className="font-medium">{t.responseMessage}</span>{' '}
                  {request.response_message}
                </div>
              )}

              {/* Established relationship (if accepted) */}
              {request.status === 'accepted' && request.established_relationship_type && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {t.establishedAs} {request.established_relationship_type}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{getTimeAgo(request.created_at)}</span>
                {isPending && daysUntilExpiry !== null && (
                  <span>
                    {daysUntilExpiry > 0
                      ? t.expiresIn.replace('{days}', daysUntilExpiry.toString())
                      : t.expired}
                  </span>
                )}
              </div>

              {/* Actions */}
              {isPending && (
                <div className="flex items-center gap-2 mt-3">
                  {!isSent ? (
                    // Received request - can accept or reject
                    <>
                      <Button
                        size="sm"
                        onClick={() => setShowAcceptModal(true)}
                        disabled={isProcessing !== null}
                      >
                        {isProcessing === 'accept' ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            {t.accepting}
                          </>
                        ) : (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            {t.accept}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReject}
                        disabled={isProcessing !== null}
                      >
                        {isProcessing === 'reject' ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            {t.rejecting}
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-4 w-4" />
                            {t.reject}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    // Sent request - can withdraw
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleWithdraw}
                      disabled={isProcessing !== null}
                    >
                      {isProcessing === 'withdraw' ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          {t.withdrawing}
                        </>
                      ) : (
                        t.withdraw
                      )}
                    </Button>
                  )}

                  {/* More options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/profile/${otherPerson?.id}`}>
                          {t.viewProfile}
                        </Link>
                      </DropdownMenuItem>
                      {onBlock && !isSent && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onBlock(request.requester_id)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {t.block}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Modal */}
      {showAcceptModal && (
        <BridgeAcceptModal
          open={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          request={request}
          onAccept={handleAccept}
          isProcessing={isProcessing === 'accept'}
        />
      )}
    </>
  );
}
