'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import WidgetSettings from './WidgetSettings';
import type { DashboardPreferences, WidgetId } from '@/types/dashboard-preferences';
import { DEFAULT_DASHBOARD_PREFERENCES } from '@/types/dashboard-preferences';

interface DashboardWidgetsProps {
  /**
   * Initial preferences from server
   */
  initialPreferences?: DashboardPreferences | null;
  /**
   * Children render functions keyed by widget ID
   */
  widgets: {
    notifications?: React.ReactNode;
    family_stats?: React.ReactNode;
    this_day?: React.ReactNode;
    quick_actions?: React.ReactNode;
    activity_feed?: React.ReactNode;
    explore_features?: React.ReactNode;
    memory_prompts?: React.ReactNode;
    time_capsules?: React.ReactNode;
  };
}

export default function DashboardWidgets({
  initialPreferences,
  widgets,
}: DashboardWidgetsProps) {
  const t = useTranslations();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(
    initialPreferences || DEFAULT_DASHBOARD_PREFERENCES
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh preferences when settings dialog closes
  const refreshPreferences = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/user/dashboard-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('[DashboardWidgets] Failed to refresh preferences:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!settingsOpen) {
      refreshPreferences();
    }
  }, [settingsOpen, refreshPreferences]);

  // Get visible widgets sorted by order
  const visibleWidgetIds = Object.entries(preferences.widgets)
    .filter(([, config]) => config.visible)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id]) => id as WidgetId);

  // Map widget IDs to their rendered content
  const getWidgetContent = (widgetId: WidgetId): React.ReactNode => {
    switch (widgetId) {
      case 'notifications':
        return widgets.notifications;
      case 'family_stats':
        return widgets.family_stats;
      case 'this_day':
        return widgets.this_day;
      case 'quick_actions':
        return widgets.quick_actions;
      case 'activity_feed':
        return widgets.activity_feed;
      case 'explore_features':
        return widgets.explore_features;
      case 'memory_prompts':
        return widgets.memory_prompts;
      case 'time_capsules':
        return widgets.time_capsules;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Customize button */}
      <div className="flex justify-end mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                {t('widgetSettings.customize')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('widgetSettings.customizeTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Render visible widgets in order */}
      <div className="space-y-8">
        {visibleWidgetIds.map((widgetId) => {
          const content = getWidgetContent(widgetId);
          if (!content) return null;

          return (
            <div
              key={widgetId}
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Widget Settings Dialog */}
      <WidgetSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
