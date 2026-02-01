import Link from 'next/link';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { notFound } from 'next/navigation';
import { ProfileCompletenessRing } from '@/components/profile/ProfileCompletenessRing';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import VoiceRecorderWrapper from './VoiceRecorderWrapper';
import VoiceStoriesWrapper from './VoiceStoriesWrapper';
import HistoricalTimelineWrapper from './HistoricalTimelineWrapper';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await getSupabaseSSR();
  const supabaseAdmin = getSupabaseAdmin();

  // Translations
  const t = locale === 'ru' ? {
    deceased: '✠ Усопший',
    pendingProfile: '⚠️ Профиль не заполнен',
    born: 'Дата рождения',
    inPlace: 'в',
    about: 'О себе',
    incompleteProfile: '📝 Неполный профиль',
    incompleteDescription: 'Этот человек ещё не заполнил свой профиль. Показанная информация основана на семейных записях.',
    areYouRelated: 'Вы родственник',
    connectionPrompt: 'Если вы считаете, что являетесь родственником, вы можете отправить запрос на подключение.',
    sendRequest: 'Отправить запрос',
    alreadyConnected: 'Вы уже в родстве',
    alreadyConnectedDescription: 'Этот человек уже находится в вашем семейном древе.',
    viewTree: 'Смотреть древо',
    viewBiography: 'Биография',
  } : {
    deceased: '✠ Deceased',
    pendingProfile: '⚠️ Pending Profile',
    born: 'Born',
    inPlace: 'in',
    about: 'About',
    incompleteProfile: '📝 Incomplete Profile',
    incompleteDescription: "This person hasn't completed their profile yet. Information shown is based on family records.",
    areYouRelated: 'Are you related to',
    connectionPrompt: "If you think you're family, you can send a connection request.",
    sendRequest: 'Send Connection Request',
    alreadyConnected: 'Already Connected',
    alreadyConnectedDescription: 'This person is already in your family tree.',
    viewTree: 'View Tree',
    viewBiography: 'Biography',
  };

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Try to fetch from user_profiles first
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single() as any;

  let actualProfile = profile;
  let isFromPending = false;

  // If not found in user_profiles, try pending_relatives
  if (error || !profile) {
    const { data: pendingProfile } = await supabaseAdmin
      .from('pending_relatives')
      .select('id, first_name, last_name, date_of_birth, is_deceased, email')
      .eq('id', id)
      .single();

    if (!pendingProfile) {
      notFound();
    }

    isFromPending = true;
    actualProfile = {
      id: pendingProfile.id,
      first_name: pendingProfile.first_name,
      middle_name: null,
      last_name: pendingProfile.last_name,
      birth_date: pendingProfile.date_of_birth,
      birth_place: null,
      bio: null,
      death_date: pendingProfile.is_deceased ? 'Unknown' : null,
    };
  }

  // Check if current user is already related to this profile
  let isAlreadyRelated = false;
  if (user) {
    // Check if the profile is the current user
    if (id === user.id) {
      isAlreadyRelated = true;
    } else {
      // Check pending_relatives invited by this user
      const { data: pendingRelation } = await supabaseAdmin
        .from('pending_relatives')
        .select('id')
        .eq('invited_by', user.id)
        .eq('id', id)
        .maybeSingle();

      if (pendingRelation) {
        isAlreadyRelated = true;
      }

      // Also check relationships table
      if (!isAlreadyRelated) {
        const { data: relationship } = await supabaseAdmin
          .from('relationships')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .or(`user1_id.eq.${id},user2_id.eq.${id}`)
          .maybeSingle();

        if (relationship) {
          isAlreadyRelated = true;
        }
      }
    }
  }

  const fullName = [actualProfile.first_name, actualProfile.middle_name, actualProfile.last_name]
    .filter(Boolean)
    .join(' ') || '?';

  const isDeceased = !!actualProfile.death_date;
  const firstName = actualProfile.first_name || '?';

  // Calculate completeness data for non-pending profiles
  let hasPhoto = false;
  let hasStory = false;
  let hasRelationships = false;
  let hasResidenceHistory = false;

  if (!isFromPending && profile) {
    hasPhoto = Boolean(profile.avatar_url || profile.current_avatar_id);
    hasStory = Boolean(profile.bio && profile.bio.length > 20);
    hasResidenceHistory = Boolean(
      profile.current_city || profile.birth_city || profile.birth_place
    );

    // Check for voice stories
    if (!hasStory) {
      const { count: storyCount } = await supabaseAdmin
        .from('voice_stories')
        .select('id', { count: 'exact', head: true })
        .eq('target_profile_id', id)
        .eq('status', 'approved');
      hasStory = (storyCount || 0) > 0;
    }

    // Check for relationships
    const { count: relationshipCount } = await supabaseAdmin
      .from('relationships')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${id},user2_id.eq.${id}`);
    hasRelationships = (relationshipCount || 0) > 0;

    // Check for residence history
    if (!hasResidenceHistory) {
      const { count: residenceCount } = await supabaseAdmin
        .from('person_residence')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', id);
      hasResidenceHistory = (residenceCount || 0) > 0;
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center gap-6">
              {/* Avatar or Progress Ring */}
              {!isFromPending && profile ? (
                <ProfileCompletenessRing
                  profile={profile}
                  hasPhoto={hasPhoto}
                  hasStory={hasStory}
                  hasRelationships={hasRelationships}
                  hasResidenceHistory={hasResidenceHistory}
                  size="lg"
                  locale={locale as 'en' | 'ru'}
                />
              ) : (
                <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {actualProfile.first_name?.[0] || '?'}{actualProfile.last_name?.[0] || ''}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                  {isDeceased && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                      {t.deceased}
                    </span>
                  )}
                  {isFromPending && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
                      {t.pendingProfile}
                    </span>
                  )}
                </div>
                {actualProfile.birth_date && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t.born}: {new Date(actualProfile.birth_date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                    {actualProfile.birth_place && ` ${t.inPlace} ${actualProfile.birth_place}`}
                  </p>
                )}

                {/* Biography button */}
                {!isFromPending && (
                  <div className="mt-3">
                    <Link href={`/${locale}/profile/${id}/biography`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {t.viewBiography}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Bio */}
        {actualProfile.bio && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t.about}</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{actualProfile.bio}</p>
          </div>
        )}

        {/* Pending profile notice */}
        {isFromPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              {t.incompleteProfile}
            </h2>
            <p className="text-yellow-800">
              {t.incompleteDescription}
            </p>
          </div>
        )}

        {/* Historical Context Timeline */}
        <HistoricalTimelineWrapper
          profileId={actualProfile.id}
          firstName={actualProfile.first_name || '?'}
          birthDate={actualProfile.birth_date}
          deathDate={actualProfile.death_date}
          avatarUrl={profile?.avatar_url}
          locale={locale as 'en' | 'ru'}
        />

        {/* Voice Stories Section */}
        <VoiceStoriesWrapper
          targetProfileId={actualProfile.id}
          locale={locale as 'en' | 'ru'}
        />

        {/* Voice Recorder for relatives */}
        {user && (
          <VoiceRecorderWrapper
            targetProfileId={actualProfile.id}
            locale={locale as 'en' | 'ru'}
          />
        )}

        {/* Connection request section - only show if not already related */}
        {user && !isAlreadyRelated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {t.areYouRelated} {firstName}?
            </h2>
            <p className="text-gray-600 mb-4">
              {t.connectionPrompt}
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
              {t.sendRequest}
            </button>
          </div>
        )}

        {/* Already connected message */}
        {user && isAlreadyRelated && id !== user.id && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              ✓ {t.alreadyConnected}
            </h2>
            <p className="text-green-800 mb-4">
              {t.alreadyConnectedDescription}
            </p>
            <a
              href={`/${locale}/tree`}
              className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all"
            >
              {t.viewTree}
            </a>
          </div>
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}
