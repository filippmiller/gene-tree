'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBridgeRequests, useBridgeBlocking } from '@/hooks/useBridgeRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BridgeRequestCard } from './BridgeRequestCard';
import { Inbox, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { BridgeRequestStatus } from '@/types/bridge-request';

const translations = {
  en: {
    tabs: {
      received: 'Received',
      sent: 'Sent',
    },
    filters: {
      all: 'All',
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
    },
    noRequests: 'No requests',
    noReceivedRequests: 'No bridge requests received yet',
    noSentRequests: 'You haven\'t sent any bridge requests yet',
    noReceivedHint: 'When someone wants to connect with you, it will appear here',
    noSentHint: 'Discover potential relatives and send them a connection request',
    loading: 'Loading requests...',
    acceptSuccess: 'Connection accepted! You are now family.',
    rejectSuccess: 'Request rejected',
    withdrawSuccess: 'Request withdrawn',
    blockSuccess: 'User blocked',
    error: 'Something went wrong',
  },
  ru: {
    tabs: {
      received: 'Полученные',
      sent: 'Отправленные',
    },
    filters: {
      all: 'Все',
      pending: 'Ожидающие',
      accepted: 'Принятые',
      rejected: 'Отклонённые',
    },
    noRequests: 'Нет запросов',
    noReceivedRequests: 'Пока нет полученных запросов',
    noSentRequests: 'Вы ещё не отправляли запросов на связь',
    noReceivedHint: 'Когда кто-то захочет связаться с вами, это появится здесь',
    noSentHint: 'Найдите потенциальных родственников и отправьте им запрос на связь',
    loading: 'Загрузка запросов...',
    acceptSuccess: 'Связь принята! Теперь вы семья.',
    rejectSuccess: 'Запрос отклонён',
    withdrawSuccess: 'Запрос отозван',
    blockSuccess: 'Пользователь заблокирован',
    error: 'Что-то пошло не так',
  },
};

interface BridgeRequestsListProps {
  userId: string;
}

export function BridgeRequestsList({ userId }: BridgeRequestsListProps) {
  const { locale } = useParams<{ locale: string }>();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<BridgeRequestStatus | 'all'>('all');

  const {
    requests,
    loading,
    error,
    refetch,
    acceptRequest,
    rejectRequest,
    withdrawRequest,
  } = useBridgeRequests(tab);

  const { blockUser } = useBridgeBlocking();

  // Filter by status
  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const handleAccept = async (requestId: string, relationshipType: string, message?: string) => {
    try {
      await acceptRequest(requestId, { relationship_type: relationshipType, response_message: message });
      toast.success(t.acceptSuccess);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error);
    }
  };

  const handleReject = async (requestId: string, message?: string) => {
    try {
      await rejectRequest(requestId, message);
      toast.success(t.rejectSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error);
    }
  };

  const handleWithdraw = async (requestId: string) => {
    try {
      await withdrawRequest(requestId);
      toast.success(t.withdrawSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error);
    }
  };

  const handleBlock = async (blockedUserId: string) => {
    try {
      await blockUser(blockedUserId);
      toast.success(t.blockSuccess);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t.error}</p>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'received' | 'sent')}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            {t.tabs.received}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t.tabs.sent}
          </TabsTrigger>
        </TabsList>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            {t.filters.all}
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
              statusFilter === 'pending'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            <Clock className="h-3 w-3" />
            {t.filters.pending}
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
              statusFilter === 'accepted'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            <CheckCircle className="h-3 w-3" />
            {t.filters.accepted}
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
              statusFilter === 'rejected'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            <XCircle className="h-3 w-3" />
            {t.filters.rejected}
          </button>
        </div>
      </div>

      <TabsContent value="received" className="mt-0">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t.noReceivedRequests}</p>
            <p className="text-sm mt-1">{t.noReceivedHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <BridgeRequestCard
                key={request.id}
                request={request}
                currentUserId={userId}
                onAccept={handleAccept}
                onReject={handleReject}
                onWithdraw={handleWithdraw}
                onBlock={handleBlock}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sent" className="mt-0">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t.noSentRequests}</p>
            <p className="text-sm mt-1">{t.noSentHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <BridgeRequestCard
                key={request.id}
                request={request}
                currentUserId={userId}
                onAccept={handleAccept}
                onReject={handleReject}
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
