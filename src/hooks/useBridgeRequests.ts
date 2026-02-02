'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  BridgeRequestWithProfiles,
  DiscoveryResult,
  BridgeRequestCounts,
  SendBridgeRequestPayload,
  AcceptBridgeRequestPayload,
} from '@/types/bridge-request';

/**
 * Hook to manage bridge discovery
 */
export function useBridgeDiscovery() {
  const [candidates, setCandidates] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bridges/discover');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch candidates');
      }

      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { candidates, loading, error, refetch: fetchCandidates };
}

/**
 * Hook to manage bridge requests
 */
export function useBridgeRequests(filter: 'sent' | 'received' | 'all' = 'all') {
  const [requests, setRequests] = useState<BridgeRequestWithProfiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bridges/requests?filter=${filter}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Send a new request
  const sendRequest = useCallback(async (payload: SendBridgeRequestPayload) => {
    try {
      const res = await fetch('/api/bridges/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send request');
      }

      // Add to list
      setRequests((prev) => [data.request, ...prev]);
      return data.request;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  // Accept a request
  const acceptRequest = useCallback(async (requestId: string, payload: AcceptBridgeRequestPayload) => {
    try {
      const res = await fetch(`/api/bridges/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept request');
      }

      // Update in list
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
      );

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  // Reject a request
  const rejectRequest = useCallback(async (requestId: string, message?: string) => {
    try {
      const res = await fetch(`/api/bridges/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', response_message: message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      // Update in list
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
      );

      return data.request;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  // Withdraw a request
  const withdrawRequest = useCallback(async (requestId: string) => {
    try {
      const res = await fetch(`/api/bridges/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to withdraw request');
      }

      // Update in list
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
      );

      return data.request;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  // Delete a request
  const deleteRequest = useCallback(async (requestId: string) => {
    try {
      const res = await fetch(`/api/bridges/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete request');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, []);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    withdrawRequest,
    deleteRequest,
  };
}

/**
 * Hook to get bridge request counts
 */
export function useBridgeCounts() {
  const [counts, setCounts] = useState<BridgeRequestCounts>({
    pending_received: 0,
    pending_sent: 0,
    potential_matches: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/bridges/counts');
      const data = await res.json();

      if (res.ok && data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch bridge counts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}

/**
 * Hook to block/unblock users
 */
export function useBridgeBlocking() {
  const [loading, setLoading] = useState(false);

  const blockUser = useCallback(async (userId: string, reason?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/bridges/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_user_id: userId, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to block user');
      }

      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bridges/block?blocked_user_id=${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unblock user');
      }

      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { blockUser, unblockUser, loading };
}
