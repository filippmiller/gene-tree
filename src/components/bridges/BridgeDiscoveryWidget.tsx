'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBridgeDiscovery, useBridgeCounts } from '@/hooks/useBridgeRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, ArrowRight, Sparkles } from 'lucide-react';
import { SendBridgeRequestModal } from './SendBridgeRequestModal';
import type { DiscoveryResult } from '@/types/bridge-request';

const translations = {
  en: {
    title: 'Family Connections',
    description: 'We found people who might be related to you',
    foundPotential: 'Found {count} potential connections',
    noCandidates: 'No potential connections found yet',
    noCandidatesHint: 'As more families join, we may find relatives for you',
    viewAll: 'View All',
    connect: 'Connect',
    pendingRequests: '{count} pending request',
    pendingRequestsPlural: '{count} pending requests',
    matchReasons: {
      same_last_name: 'Same last name',
      same_maiden_name: 'Same maiden name',
      same_birth_place: 'Same birth place',
      shared_ancestor: 'Shared ancestor',
      same_location: 'Same location',
      email_domain: 'Same organization',
    },
    matchScore: '{score}% match',
    loading: 'Searching for connections...',
  },
  ru: {
    title: 'Семейные связи',
    description: 'Мы нашли людей, которые могут быть вашими родственниками',
    foundPotential: 'Найдено {count} потенциальных связей',
    noCandidates: 'Пока не найдено потенциальных связей',
    noCandidatesHint: 'По мере присоединения семей мы можем найти ваших родственников',
    viewAll: 'Смотреть все',
    connect: 'Связаться',
    pendingRequests: '{count} ожидающий запрос',
    pendingRequestsPlural: '{count} ожидающих запросов',
    matchReasons: {
      same_last_name: 'Одинаковая фамилия',
      same_maiden_name: 'Одинаковая девичья фамилия',
      same_birth_place: 'Одно место рождения',
      shared_ancestor: 'Общий предок',
      same_location: 'Одна локация',
      email_domain: 'Одна организация',
    },
    matchScore: '{score}% совпадение',
    loading: 'Поиск связей...',
  },
};

export function BridgeDiscoveryWidget() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const { candidates, loading, error } = useBridgeDiscovery();
  const { counts } = useBridgeCounts();

  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveryResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = (candidate: DiscoveryResult) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedCandidate(null);
  };

  const handleViewAll = () => {
    router.push(`/${locale}/connections`);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getMatchReasonLabel = (type: string) => {
    return t.matchReasons[type as keyof typeof t.matchReasons] || type;
  };

  if (loading) {
    return (
      <Card className="border-white/[0.08] bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.loading}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail for widget
  }

  return (
    <>
      <Card className="border-white/[0.08] bg-card/80 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>
                {candidates.length > 0
                  ? t.foundPotential.replace('{count}', candidates.length.toString())
                  : t.description}
              </CardDescription>
            </div>
            {counts.pending_received > 0 && (
              <Badge variant="secondary" className="bg-[#D29922]/10 text-[#D29922]">
                {(counts.pending_received === 1 ? t.pendingRequests : t.pendingRequestsPlural).replace(
                  '{count}',
                  counts.pending_received.toString()
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">{t.noCandidates}</p>
              <p className="text-sm mt-1">{t.noCandidatesHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.slice(0, 3).map((candidate) => (
                <div
                  key={candidate.candidate_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/[0.08]">
                    <AvatarImage src={candidate.profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#D29922]/10 text-[#D29922]">
                      {getInitials(candidate.profile.first_name, candidate.profile.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {[candidate.profile.first_name, candidate.profile.last_name]
                        .filter(Boolean)
                        .join(' ') || 'Unknown'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.match_reasons.slice(0, 2).map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">
                          {getMatchReasonLabel(reason.type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleConnect(candidate)}
                  >
                    {t.connect}
                  </Button>
                </div>
              ))}

              {candidates.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full text-[#D29922] hover:text-[#D29922]/80 hover:bg-[#D29922]/5"
                  onClick={handleViewAll}
                >
                  {t.viewAll}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && selectedCandidate && (
        <SendBridgeRequestModal
          open={showModal}
          onClose={handleModalClose}
          candidate={selectedCandidate}
        />
      )}
    </>
  );
}
