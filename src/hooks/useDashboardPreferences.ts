'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardPreferences,
  WidgetId,
  WidgetConfig,
} from '@/types/dashboard-preferences';
import { DEFAULT_DASHBOARD_PREFERENCES } from '@/types/dashboard-preferences';

interface UseDashboardPreferencesReturn {
  preferences: DashboardPreferences;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  toggleWidget: (widgetId: WidgetId) => void;
  setWidgetOrder: (widgetId: WidgetId, newOrder: number) => void;
  updateWidgets: (widgets: Record<WidgetId, WidgetConfig>) => void;
  savePreferences: () => Promise<boolean>;
  resetToDefaults: () => void;
  hasChanges: boolean;
}

export function useDashboardPreferences(): UseDashboardPreferencesReturn {
  const [preferences, setPreferences] = useState<DashboardPreferences>(
    DEFAULT_DASHBOARD_PREFERENCES
  );
  const [originalPreferences, setOriginalPreferences] =
    useState<DashboardPreferences>(DEFAULT_DASHBOARD_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if there are unsaved changes
  const hasChanges =
    JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  // Fetch preferences on mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/user/dashboard-preferences');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch preferences');
        }

        const data = await response.json();
        setPreferences(data.preferences);
        setOriginalPreferences(data.preferences);
      } catch (err) {
        console.error('[useDashboardPreferences] Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  // Toggle widget visibility (optimistic update)
  const toggleWidget = useCallback((widgetId: WidgetId) => {
    setPreferences((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetId]: {
          ...prev.widgets[widgetId],
          visible: !prev.widgets[widgetId].visible,
        },
      },
    }));
  }, []);

  // Set widget order
  const setWidgetOrder = useCallback((widgetId: WidgetId, newOrder: number) => {
    setPreferences((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetId]: {
          ...prev.widgets[widgetId],
          order: newOrder,
        },
      },
    }));
  }, []);

  // Update all widgets at once
  const updateWidgets = useCallback(
    (widgets: Record<WidgetId, WidgetConfig>) => {
      setPreferences((prev) => ({
        ...prev,
        widgets,
      }));
    },
    []
  );

  // Save preferences to server
  const savePreferences = useCallback(async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/user/dashboard-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      const data = await response.json();
      setOriginalPreferences(data.preferences);
      return true;
    } catch (err) {
      console.error('[useDashboardPreferences] Save error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_DASHBOARD_PREFERENCES);
  }, []);

  return {
    preferences,
    isLoading,
    error,
    isSaving,
    toggleWidget,
    setWidgetOrder,
    updateWidgets,
    savePreferences,
    resetToDefaults,
    hasChanges,
  };
}
