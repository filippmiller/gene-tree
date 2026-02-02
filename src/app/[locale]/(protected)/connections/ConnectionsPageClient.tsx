'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBridgeDiscovery } from '@/hooks/useBridgeRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BridgeRequestsList, SendBridgeRequestModal, BridgeCelebration } from '@/components/bridges';
import { Search, Users, Inbox, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import type { DiscoveryResult } from '@/types/bridge-request';

const translations = {
  en: {
    pageTitle: 'Family Connections',
    pageDescription: 'Discover and connect with potential relatives',
    tabs: {
      discover: 'Discover',
      requests: 'Requests',
    },
    discover: {
      title: 'Potential Relatives',
      description: 'People who might be related to you based on shared information',
      noResults: 'No potential matches found',
      noResultsHint: 'As more families join Gene-Tree, you may discover relatives here',
      refresh: 'Refresh',
      refreshing: 'Searching...',
      matchScore: '{score}% match',
      connect: 'Connect',
    },
    matchReasons: {
      same_last_name: 'Same last name',
      same_maiden_name: 'Same maiden name',
      same_birth_place: 'Same birth place',
      shared_ancestor: 'Shared ancestor',
      same_location: 'Same location',
      email_domain: 'Same organization',
    },
  },
  ru: {
    pageTitle: 'Семейные связи',
    pageDescription: 'Найдите и свяжитесь с потенциальными родственниками',
    tabs: {
      discover: 'Поиск',
      requests: 'Запросы',
    },
    discover: {
      title: 'Возможные родственники',
      description: 'Люди, которые могут быть вашими родственниками на основе общей информации',
      noResults: 'Совпадений не найдено',
      noResultsHint: 'По мере присоединения семей к Gene-Tree вы можете найти родственников здесь',
      refresh: 'Обновить',
      refreshing: 'Поиск...',
      matchScore: '{score}% совпадение',
      connect: 'Связаться',
    },
    matchReasons: {
      same_last_name: 'Одинаковая фамилия',
      same_maiden_name: 'Одинаковая девичья фамилия',
      same_birth_place: 'Одно место рождения',
      shared_ancestor: 'Общий предок',
      same_location: 'Одна локация',
      email_domain: 'Одна организация',
    },
  },
};

interface ConnectionsPageClientProps {
  userId: string;
}

export function ConnectionsPageClient({ userId }: ConnectionsPageClientProps) {
  const { locale } = useParams<{ locale: string }>();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const { candidates, loading, refetch } = useBridgeDiscovery();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveryResult | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    person: DiscoveryResult['profile'];
    relationshipType: string;
  } | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleConnect = (candidate: DiscoveryResult) => {
    setSelectedCandidate(candidate);
    setShowRequestModal(true);
  };

  const handleRequestSuccess = () => {
    setShowRequestModal(false);
    setSelectedCandidate(null);
    refetch();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getMatchReasonLabel = (type: string) => {
    return t.matchReasons[type as keyof typeof t.matchReasons] || type;
  };

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          {t.pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2">{t.pageDescription}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t.tabs.discover}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            {t.tabs.requests}
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    {t.discover.title}
                  </CardTitle>
                  <CardDescription>{t.discover.description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? t.discover.refreshing : t.discover.refresh}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-medium text-lg">{t.discover.noResults}</p>
                  <p className="text-muted-foreground mt-2">{t.discover.noResultsHint}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.candidate_id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Avatar className="h-14 w-14 border-2 border-amber-200">
                        <AvatarImage src={candidate.profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-100 text-amber-800 text-lg">
                          {getInitials(candidate.profile.first_name, candidate.profile.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {[candidate.profile.first_name, candidate.profile.last_name]
                              .filter(Boolean)
                              .join(' ') || 'Unknown'}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          >
                            {t.discover.matchScore.replace(
                              '{score}',
                              Math.round(candidate.match_score).toString()
                            )}
                          </Badge>
                        </div>
                        {candidate.profile.birth_place && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />
                            {candidate.profile.birth_place}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {candidate.match_reasons.map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {getMatchReasonLabel(reason.type)}
                              {reason.value && `: ${reason.value}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button onClick={() => handleConnect(candidate)}>
                        {t.discover.connect}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-0">
          <BridgeRequestsList userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showRequestModal && selectedCandidate && (
        <SendBridgeRequestModal
          open={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          onSuccess={handleRequestSuccess}
        />
      )}

      {showCelebration && celebrationData && (
        <BridgeCelebration
          open={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            setCelebrationData(null);
          }}
          connectedPerson={celebrationData.person}
          relationshipType={celebrationData.relationshipType}
        />
      )}
    </div>
  );
}
