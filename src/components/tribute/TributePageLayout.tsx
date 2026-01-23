'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { TributePageData } from '@/types/tribute';
import { formatLifespan, calculateAge } from '@/types/tribute';
import TributeGuestbook from './TributeGuestbook';
import VirtualTribute from './VirtualTribute';

interface TributePageLayoutProps {
  profileId: string;
  className?: string;
}

export default function TributePageLayout({ profileId, className = '' }: TributePageLayoutProps) {
  const t = useTranslations('tribute');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TributePageData | null>(null);

  useEffect(() => {
    async function fetchTributeData() {
      try {
        const res = await fetch(`/api/tribute/${profileId}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to load tribute page');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTributeData();
  }, [profileId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <div className="h-32 w-32 mx-auto rounded-full bg-gray-200 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className={`bg-red-50 text-red-700 rounded-lg p-6 text-center ${className}`}>
        <p>{error || t('notAvailable')}</p>
      </div>
    );
  }

  const { profile, guestbook_count, recent_tributes } = data;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const lifespan = formatLifespan(profile.birth_date, profile.death_date);
  const age = profile.birth_date
    ? calculateAge(profile.birth_date, profile.death_date)
    : null;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header / Hero Section */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        <div className="relative px-6 py-12 sm:py-16 text-center">
          {/* Avatar */}
          <div className="mb-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={fullName}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto object-cover border-4 border-white/20 shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto bg-white/10 flex items-center justify-center text-white text-4xl font-light border-4 border-white/20">
                {profile.first_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
            {fullName}
          </h1>

          {/* Lifespan */}
          {lifespan && (
            <p className="text-white/70 text-lg mb-2">{lifespan}</p>
          )}

          {/* Age at passing */}
          {age !== null && profile.death_date && (
            <p className="text-white/50 text-sm">
              {t('passedAtAge', { age })}
            </p>
          )}

          {/* Tribute count */}
          <div className="mt-6 flex justify-center gap-8 text-white/60 text-sm">
            <div>
              <span className="block text-2xl font-semibold text-white">
                {guestbook_count}
              </span>
              {t('tributeCount')}
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Tribute Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('leaveTribute')}</h2>
        <VirtualTribute
          profileId={profileId}
          onSuccess={() => {
            // Refresh data after submitting tribute
            window.location.reload();
          }}
        />
      </div>

      {/* Guestbook Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('guestbook')}</h2>
        <TributeGuestbook profileId={profileId} initialEntries={recent_tributes} />
      </div>
    </div>
  );
}
