'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type {
  VoiceMemoryWithProfile,
  CreateVoiceMemoryRequest,
  UpdateVoiceMemoryRequest,
  VoiceMemory,
} from '@/types/voice-memory';

interface UseVoiceMemoriesOptions {
  profileId?: string;
  limit?: number;
  autoLoad?: boolean;
}

const DEFAULT_LIMIT = 20;

/**
 * Custom hook for managing voice memories
 */
export function useVoiceMemories(options: UseVoiceMemoriesOptions = {}) {
  const { profileId, limit = DEFAULT_LIMIT, autoLoad = true } = options;
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [memories, setMemories] = useState<VoiceMemoryWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  /**
   * Load voice memories
   */
  const loadMemories = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    const currentOffset = reset ? 0 : offset;

    try {
      // Using any type here since voice_memories table is new and not yet in generated types
      let query = (supabase as any)
        .from('voice_memories')
        .select(`
          *,
          profile:user_profiles!profile_id(id, first_name, last_name, avatar_url),
          creator:user_profiles!user_id(id, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useVoiceMemories] Load error:', fetchError);
        setError('Failed to load voice memories');
        return;
      }

      const newMemories = (data || []) as VoiceMemoryWithProfile[];

      if (reset) {
        setMemories(newMemories);
        setOffset(limit);
      } else {
        setMemories(prev => [...prev, ...newMemories]);
        setOffset(prev => prev + limit);
      }

      setHasMore(newMemories.length === limit);
    } catch (err) {
      console.error('[useVoiceMemories] Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profileId, limit, offset]);

  /**
   * Load more memories (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    await loadMemories(false);
  }, [isLoading, hasMore, loadMemories]);

  /**
   * Refresh memories
   */
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await loadMemories(true);
  }, [loadMemories]);

  /**
   * Upload audio and create memory record
   */
  const createMemory = useCallback(async (
    audioBlob: Blob,
    data: Omit<CreateVoiceMemoryRequest, 'storage_path'>
  ): Promise<VoiceMemory | null> => {
    setError(null);

    try {
      // 1. Get signed upload URL from API
      const response = await fetch('/api/voice-memories/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: data.profile_id,
          title: data.title,
          description: data.description,
          duration_seconds: data.duration_seconds,
          file_size_bytes: audioBlob.size,
          content_type: audioBlob.type,
          privacy_level: data.privacy_level || 'family',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to get upload URL');
      }

      const { upload_url, token, storage_path, memory_id } = await response.json();

      // 2. Upload to storage using signed URL
      const fileExt = audioBlob.type.includes('webm') ? 'webm' :
                      audioBlob.type.includes('mp4') ? 'mp4' :
                      audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([audioBlob], `memory.${fileExt}`, { type: audioBlob.type });

      const { error: uploadError } = await supabase.storage
        .from('voice-memories')
        .uploadToSignedUrl(storage_path, token, file);

      if (uploadError) {
        throw uploadError;
      }

      // 3. Confirm the upload
      const confirmResponse = await fetch(`/api/voice-memories/${memory_id}/confirm`, {
        method: 'POST',
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const { memory } = await confirmResponse.json();

      // 4. Add to local state
      await refresh();

      return memory;
    } catch (err) {
      console.error('[useVoiceMemories] Create error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create voice memory');
      return null;
    }
  }, [supabase, refresh]);

  /**
   * Update memory metadata
   */
  const updateMemory = useCallback(async (
    id: string,
    data: UpdateVoiceMemoryRequest
  ): Promise<VoiceMemory | null> => {
    setError(null);

    try {
      const response = await fetch(`/api/voice-memories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update memory');
      }

      const { memory } = await response.json();

      // Update local state
      setMemories(prev =>
        prev.map(m => m.id === id ? { ...m, ...memory } : m)
      );

      return memory;
    } catch (err) {
      console.error('[useVoiceMemories] Update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update memory');
      return null;
    }
  }, []);

  /**
   * Delete a memory
   */
  const deleteMemory = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/voice-memories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete memory');
      }

      // Remove from local state
      setMemories(prev => prev.filter(m => m.id !== id));

      return true;
    } catch (err) {
      console.error('[useVoiceMemories] Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
      return false;
    }
  }, []);

  /**
   * Get signed playback URL for a memory
   */
  const getPlaybackUrl = useCallback(async (memoryId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/voice-memories/${memoryId}`);

      if (!response.ok) {
        return null;
      }

      const { playback_url } = await response.json();
      return playback_url;
    } catch (err) {
      console.error('[useVoiceMemories] Get playback URL error:', err);
      return null;
    }
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadMemories(true);
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    memories,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    createMemory,
    updateMemory,
    deleteMemory,
    getPlaybackUrl,
  };
}

export default useVoiceMemories;
