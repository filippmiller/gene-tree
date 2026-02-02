'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Settings,
  Bell,
  Activity,
  Calendar,
  Zap,
  BarChart3,
  Compass,
  Loader2,
  GripVertical,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import type { WidgetId, WidgetConfig } from '@/types/dashboard-preferences';
import { WIDGET_INFO } from '@/types/dashboard-preferences';
import { cn } from '@/lib/utils';

interface WidgetSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell,
  Activity,
  Calendar,
  Zap,
  BarChart3,
  Compass,
};

export default function WidgetSettings({
  open,
  onOpenChange,
}: WidgetSettingsProps) {
  const t = useTranslations();
  const {
    preferences,
    isLoading,
    isSaving,
    toggleWidget,
    savePreferences,
    resetToDefaults,
    hasChanges,
  } = useDashboardPreferences();

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset success message when dialog closes
  useEffect(() => {
    if (!open) {
      setSaveSuccess(false);
    }
  }, [open]);

  const handleSave = async () => {
    const success = await savePreferences();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    }
  };

  // Sort widgets by order
  const sortedWidgets = [...WIDGET_INFO].sort((a, b) => {
    const orderA = preferences.widgets[a.id]?.order ?? 99;
    const orderB = preferences.widgets[b.id]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/25">
              <Settings className="w-4 h-4 text-white" />
            </div>
            {t('widgetSettings.title')}
          </DialogTitle>
          <DialogDescription>
            {t('widgetSettings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {sortedWidgets.map((widget) => {
                const Icon = iconMap[widget.icon] || Activity;
                const config = preferences.widgets[widget.id];
                const isVisible = config?.visible ?? true;

                return (
                  <GlassCard
                    key={widget.id}
                    glass="subtle"
                    padding="none"
                    className={cn(
                      'transition-all duration-200',
                      !isVisible && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Drag handle (visual only for now) */}
                      <div className="text-muted-foreground/40 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Widget icon */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200',
                          isVisible
                            ? 'bg-gradient-to-br from-primary to-emerald-700 shadow-primary/25'
                            : 'bg-muted'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            isVisible ? 'text-white' : 'text-muted-foreground'
                          )}
                        />
                      </div>

                      {/* Widget info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium text-sm',
                            isVisible
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {t(widget.labelKey)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {t(widget.descriptionKey)}
                        </p>
                      </div>

                      {/* Toggle switch */}
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => toggleWidget(widget.id)}
                        aria-label={`Toggle ${t(widget.labelKey)}`}
                      />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={isLoading || isSaving}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('widgetSettings.reset')}
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || !hasChanges}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-emerald-700 hover:from-primary/90 hover:to-emerald-700/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('widgetSettings.saving')}
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('widgetSettings.saved')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
