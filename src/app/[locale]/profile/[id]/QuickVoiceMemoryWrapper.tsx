'use client';

import { useState, useCallback } from 'react';
import { QuickVoiceButton, VoiceMemoriesList } from '@/components/voice-memory';

interface Props {
  profileId: string;
  profileName?: string;
  locale: 'en' | 'ru';
  currentUserId?: string;
}

/**
 * Wrapper component for voice memories on profile pages
 * Includes the floating button and the memories list
 */
export default function QuickVoiceMemoryWrapper({
  profileId,
  profileName,
  locale,
  currentUserId,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMemoryCreated = useCallback(() => {
    // Force refresh the list by changing the key
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      {/* Voice Memories List */}
      <div className="mb-6">
        <VoiceMemoriesList
          key={refreshKey}
          profileId={profileId}
          locale={locale}
          currentUserId={currentUserId}
        />
      </div>

      {/* Floating Action Button */}
      {currentUserId && (
        <QuickVoiceButton
          profileId={profileId}
          profileName={profileName}
          locale={locale}
          onMemoryCreated={handleMemoryCreated}
        />
      )}
    </>
  );
}
