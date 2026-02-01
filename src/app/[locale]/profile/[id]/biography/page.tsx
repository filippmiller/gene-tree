import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { generateBiography, EnrichedProfileData, Locale } from '@/lib/biography';
import { BiographyCard } from '@/components/profile/BiographyCard';
import { Button } from '@/components/ui/button';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

// Translations
const translations = {
  en: {
    backToProfile: 'Back to Profile',
    loading: 'Generating biography...',
    notFound: 'Profile not found',
    accessDenied: 'Access denied',
    biography: 'Biography',
    generatedFrom: 'Generated from family tree data',
    lastUpdated: 'Last updated',
  },
  ru: {
    backToProfile: 'Вернуться к профилю',
    loading: 'Генерация биографии...',
    notFound: 'Профиль не найден',
    accessDenied: 'Доступ запрещён',
    biography: 'Биография',
    generatedFrom: 'Сгенерировано из данных семейного древа',
    lastUpdated: 'Обновлено',
  },
};

async function BiographyContent({ profileId, locale }: { profileId: string; locale: Locale }) {
  const supabase = await getSupabaseSSR();
  const supabaseAdmin = getSupabaseAdmin();
  const t = translations[locale];

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Check access if not the owner
  if (user && user.id !== profileId) {
    const { data: hasAccess } = await supabaseAdmin.rpc('is_in_family_circle', {
      profile_id: profileId,
      user_id: user.id,
    });

    if (!hasAccess) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t.accessDenied}</p>
        </div>
      );
    }
  }

  // Fetch education
  const { data: education } = await supabaseAdmin
    .from('education')
    .select('*')
    .eq('user_id', profileId)
    .order('end_year', { ascending: false, nullsFirst: true });

  // Fetch employment
  const { data: employment } = await supabaseAdmin
    .from('employment')
    .select('*')
    .eq('user_id', profileId)
    .order('start_date', { ascending: false, nullsFirst: true });

  // Fetch residences
  const { data: residences } = await supabaseAdmin
    .from('person_residence')
    .select('*')
    .eq('person_id', profileId)
    .order('start_date', { ascending: false, nullsFirst: true });

  // Fetch relationships
  const { data: relationships } = await supabaseAdmin
    .from('relationships')
    .select('*')
    .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

  // Collect related profile IDs
  const relatedIds = new Set<string>();
  for (const rel of relationships || []) {
    if (rel.user1_id !== profileId) relatedIds.add(rel.user1_id);
    if (rel.user2_id !== profileId) relatedIds.add(rel.user2_id);
  }

  // Fetch related profiles
  const relatedProfiles = new Map<string, { first_name: string; last_name: string; gender?: string | null }>();
  if (relatedIds.size > 0) {
    const { data: relatedData } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, gender')
      .in('id', Array.from(relatedIds));

    for (const p of relatedData || []) {
      relatedProfiles.set(p.id, {
        first_name: p.first_name,
        last_name: p.last_name,
        gender: p.gender,
      });
    }
  }

  // Count voice stories
  const { count: voiceStoriesCount } = await supabaseAdmin
    .from('voice_stories')
    .select('id', { count: 'exact', head: true })
    .eq('target_profile_id', profileId)
    .eq('status', 'approved');

  // Count photos
  const { count: photosCount } = await supabaseAdmin
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('target_profile_id', profileId)
    .eq('status', 'approved');

  // Build enriched data
  const enrichedData: EnrichedProfileData = {
    profile,
    education: education || [],
    employment: employment || [],
    residences: residences || [],
    relationships: relationships || [],
    relatedProfiles,
    voiceStoriesCount: voiceStoriesCount || 0,
    photosCount: photosCount || 0,
  };

  // Generate biography
  const biography = generateBiography(enrichedData, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Header with profile info */}
      <div className="flex items-center gap-4 mb-6">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {profile.first_name?.[0] || '?'}
            {profile.last_name?.[0] || ''}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {t.generatedFrom}
          </p>
        </div>
      </div>

      {/* Biography Card */}
      <BiographyCard
        biography={biography}
        locale={locale}
        showMissingPrompts={user?.id === profileId}
        compact={false}
      />

      {/* Footer info */}
      <div className="text-center text-xs text-muted-foreground">
        {t.lastUpdated}: {new Date(biography.generatedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
      </div>
    </div>
  );
}

function LoadingFallback({ locale }: { locale: Locale }) {
  const t = translations[locale];
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
      <span className="text-muted-foreground">{t.loading}</span>
    </div>
  );
}

export default async function BiographyPage({ params }: Props) {
  const { locale, id } = await params;
  const validLocale: Locale = locale === 'ru' ? 'ru' : 'en';
  const t = translations[validLocale];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link href={`/${locale}/profile/${id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToProfile}
          </Button>
        </Link>

        {/* Main content */}
        <Suspense fallback={<LoadingFallback locale={validLocale} />}>
          <BiographyContent profileId={id} locale={validLocale} />
        </Suspense>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', id)
    .single();

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : 'Profile';

  const title = locale === 'ru' ? `Биография - ${fullName}` : `Biography - ${fullName}`;
  const description =
    locale === 'ru'
      ? `Биография ${fullName}, сгенерированная из данных семейного древа`
      : `Biography of ${fullName}, generated from family tree data`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
  };
}
