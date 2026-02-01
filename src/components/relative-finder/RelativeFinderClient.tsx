'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RelativeMatchCard } from './RelativeMatchCard';
import { ConnectionRequestCard } from './ConnectionRequestCard';
import { MatchingPreferencesForm } from './MatchingPreferencesForm';
import type {
  PotentialRelative,
  ConnectionRequestWithProfiles,
  MatchingPreferences,
} from '@/lib/relatives/types';

interface RelativeFinderClientProps {
  userId: string;
  locale: 'en' | 'ru';
}

export function RelativeFinderClient({ userId, locale }: RelativeFinderClientProps) {
  const t = useTranslations('relativeFinder');

  // State
  const [matches, setMatches] = useState<PotentialRelative[]>([]);
  const [requests, setRequests] = useState<ConnectionRequestWithProfiles[]>([]);
  const [preferences, setPreferences] = useState<MatchingPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('matches');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [matchesRes, requestsRes, prefsRes] = await Promise.all([
        fetch(`/api/relatives/matches?locale=${locale}`),
        fetch('/api/relatives/connect'),
        fetch('/api/relatives/preferences'),
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.requests || []);
      }

      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setPreferences(prefsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle connect
  const handleConnect = async (match: PotentialRelative, message: string) => {
    setIsConnecting(match.relative_user_id);
    setError(null);

    try {
      const res = await fetch('/api/relatives/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: match.relative_user_id,
          sharedAncestorId: match.shared_ancestor_id,
          message: message || undefined,
          relationshipDescription: match.relationship_description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.connectFailed'));
      }

      // Remove from matches and refresh requests
      setMatches((prev) => prev.filter((m) => m.relative_user_id !== match.relative_user_id));
      setSuccessMessage(t('requestSent'));

      // Refresh requests
      const requestsRes = await fetch('/api/relatives/connect');
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.requests || []);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError(err instanceof Error ? err.message : t('errors.connectFailed'));
    } finally {
      setIsConnecting(null);
    }
  };

  // Handle request actions
  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch(`/api/relatives/connect/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (!res.ok) {
        throw new Error(t('errors.actionFailed'));
      }

      setSuccessMessage(t('requestAccepted'));
      await fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(t('errors.actionFailed'));
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const res = await fetch(`/api/relatives/connect/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      });

      if (!res.ok) {
        throw new Error(t('errors.actionFailed'));
      }

      await fetchData();
    } catch (err) {
      console.error('Error declining request:', err);
      setError(t('errors.actionFailed'));
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const res = await fetch(`/api/relatives/connect/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!res.ok) {
        throw new Error(t('errors.actionFailed'));
      }

      await fetchData();
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError(t('errors.actionFailed'));
    }
  };

  // Handle save preferences
  const handleSavePreferences = async (prefs: Partial<MatchingPreferences>) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/relatives/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        throw new Error(t('errors.saveFailed'));
      }

      const data = await res.json();
      setPreferences(data);
      setSuccessMessage(t('preferencesSaved'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  // Separate requests by type
  const pendingReceived = requests.filter(
    (r) => r.to_user_id === userId && r.status === 'pending'
  );
  const pendingSent = requests.filter(
    (r) => r.from_user_id === userId && r.status === 'pending'
  );
  const completedRequests = requests.filter(
    (r) => r.status !== 'pending'
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">
            {t('tabs.matches')}
            {matches.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {matches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            {t('tabs.requests')}
            {pendingReceived.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full text-xs">
                {pendingReceived.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('matches.title')}</CardTitle>
              <CardDescription>{t('matches.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('matches.noMatches')}</p>
                  <p className="text-sm mt-2">{t('matches.noMatchesHint')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <RelativeMatchCard
                      key={match.relative_user_id}
                      match={match}
                      onConnect={handleConnect}
                      isConnecting={isConnecting === match.relative_user_id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-6 space-y-6">
          {/* Pending Received */}
          {pendingReceived.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.pending')}</CardTitle>
                <CardDescription>{t('requests.pendingDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingReceived.map((request) => (
                  <ConnectionRequestCard
                    key={request.id}
                    request={request}
                    currentUserId={userId}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pending Sent */}
          {pendingSent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.sent')}</CardTitle>
                <CardDescription>{t('requests.sentDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingSent.map((request) => (
                  <ConnectionRequestCard
                    key={request.id}
                    request={request}
                    currentUserId={userId}
                    onCancel={handleCancel}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed */}
          {completedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('requests.history')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedRequests.slice(0, 10).map((request) => (
                  <ConnectionRequestCard
                    key={request.id}
                    request={request}
                    currentUserId={userId}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {requests.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>{t('requests.noRequests')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          {preferences && (
            <MatchingPreferencesForm
              preferences={preferences}
              onSave={handleSavePreferences}
              isSaving={isSaving}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
