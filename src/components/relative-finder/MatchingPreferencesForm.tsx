'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { MatchingPreferences } from '@/lib/relatives/types';

interface MatchingPreferencesFormProps {
  preferences: MatchingPreferences;
  onSave: (preferences: Partial<MatchingPreferences>) => Promise<void>;
  isSaving?: boolean;
}

export function MatchingPreferencesForm({
  preferences,
  onSave,
  isSaving = false,
}: MatchingPreferencesFormProps) {
  const t = useTranslations('relativeFinder.preferences');
  const [allowMatching, setAllowMatching] = useState(preferences.allow_matching);
  const [notifyOnMatch, setNotifyOnMatch] = useState(preferences.notify_on_match);
  const [minDepth, setMinDepth] = useState(preferences.min_ancestor_depth);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: boolean | number) => {
    switch (field) {
      case 'allowMatching':
        setAllowMatching(value as boolean);
        break;
      case 'notifyOnMatch':
        setNotifyOnMatch(value as boolean);
        break;
      case 'minDepth':
        setMinDepth(value as number);
        break;
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({
      allow_matching: allowMatching,
      notify_on_match: notifyOnMatch,
      min_ancestor_depth: minDepth,
    });
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allow Matching Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-matching" className="text-base">
              {t('allowMatching.label')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('allowMatching.description')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="allow-matching"
              className="sr-only peer"
              checked={allowMatching}
              onChange={(e) => handleChange('allowMatching', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Notify on Match Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notify-match" className="text-base">
              {t('notifyOnMatch.label')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('notifyOnMatch.description')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="notify-match"
              className="sr-only peer"
              checked={notifyOnMatch}
              onChange={(e) => handleChange('notifyOnMatch', e.target.checked)}
              disabled={!allowMatching}
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary ${!allowMatching ? 'opacity-50' : ''}`}></div>
          </label>
        </div>

        {/* Min Ancestor Depth */}
        <div className="space-y-2">
          <Label htmlFor="min-depth" className="text-base">
            {t('minDepth.label')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t('minDepth.description')}
          </p>
          <select
            id="min-depth"
            value={minDepth}
            onChange={(e) => handleChange('minDepth', parseInt(e.target.value, 10))}
            disabled={!allowMatching}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <option value={2}>{t('minDepth.options.2')}</option>
            <option value={3}>{t('minDepth.options.3')}</option>
            <option value={4}>{t('minDepth.options.4')}</option>
            <option value={5}>{t('minDepth.options.5')}</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
