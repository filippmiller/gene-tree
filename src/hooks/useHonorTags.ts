import { useState, useEffect, useCallback } from "react";
import type { ProfileHonorTagWithDetails } from "@/types/honor-tags";

interface UseHonorTagsOptions {
  profileId: string;
  autoFetch?: boolean;
}

interface UseHonorTagsReturn {
  tags: ProfileHonorTagWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTag: (honorTagId: string, notes?: string) => Promise<boolean>;
  removeTag: (tagId: string) => Promise<boolean>;
  verifyTag: (tagId: string, verified: boolean, comment?: string) => Promise<boolean>;
}

/**
 * Hook for managing honor tags on a profile
 */
export function useHonorTags({
  profileId,
  autoFetch = true,
}: UseHonorTagsOptions): UseHonorTagsReturn {
  const [tags, setTags] = useState<ProfileHonorTagWithDetails[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profiles/${profileId}/honor-tags`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch honor tags");
      }

      setTags(data.tags || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching honor tags:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (autoFetch && profileId) {
      fetchTags();
    }
  }, [autoFetch, profileId, fetchTags]);

  const addTag = useCallback(
    async (honorTagId: string, notes?: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/profiles/${profileId}/honor-tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ honor_tag_id: honorTagId, notes }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add honor tag");
        }

        // Add the new tag to the list
        setTags((prev) => [...prev, data.tag]);
        return true;
      } catch (err) {
        console.error("Error adding honor tag:", err);
        return false;
      }
    },
    [profileId]
  );

  const removeTag = useCallback(
    async (tagId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/profiles/${profileId}/honor-tags/${tagId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to remove honor tag");
        }

        // Remove from local state
        setTags((prev) => prev.filter((t) => t.id !== tagId));
        return true;
      } catch (err) {
        console.error("Error removing honor tag:", err);
        return false;
      }
    },
    [profileId]
  );

  const verifyTag = useCallback(
    async (tagId: string, verified: boolean, comment?: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/profiles/${profileId}/honor-tags/${tagId}/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verified, comment }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify honor tag");
        }

        // Update the tag's verification level if changed
        if (data.verification_level) {
          setTags((prev) =>
            prev.map((t) =>
              t.id === tagId
                ? { ...t, verification_level: data.verification_level }
                : t
            )
          );
        }

        return true;
      } catch (err) {
        console.error("Error verifying honor tag:", err);
        return false;
      }
    },
    [profileId]
  );

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    addTag,
    removeTag,
    verifyTag,
  };
}

/**
 * Hook for managing personal credo on a profile
 */
interface PersonalCredo {
  life_motto?: string | null;
  life_motto_privacy?: string;
  personal_statement?: string | null;
  personal_statement_privacy?: string;
  memorial_quote?: string | null;
  is_deceased?: boolean;
}

interface UseCredoReturn {
  credo: PersonalCredo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCredo: (updates: Partial<PersonalCredo>) => Promise<boolean>;
}

export function useCredo(profileId: string): UseCredoReturn {
  const [credo, setCredo] = useState<PersonalCredo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredo = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profiles/${profileId}/credo`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch credo");
      }

      setCredo(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching credo:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      fetchCredo();
    }
  }, [profileId, fetchCredo]);

  const updateCredo = useCallback(
    async (updates: Partial<PersonalCredo>): Promise<boolean> => {
      try {
        const response = await fetch(`/api/profiles/${profileId}/credo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update credo");
        }

        setCredo((prev) => ({ ...prev, ...data }));
        return true;
      } catch (err) {
        console.error("Error updating credo:", err);
        return false;
      }
    },
    [profileId]
  );

  return {
    credo,
    loading,
    error,
    refetch: fetchCredo,
    updateCredo,
  };
}
