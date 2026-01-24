import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { notFound } from 'next/navigation';
import VoiceStoryRecorder from '@/components/profile/VoiceStoryRecorder';

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
  };

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Try to fetch from user_profiles first
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, middle_name, last_name, birth_date, birth_place, bio, death_date')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar placeholder */}
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {actualProfile.first_name?.[0] || '?'}{actualProfile.last_name?.[0] || ''}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                {isDeceased && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {t.deceased}
                  </span>
                )}
                {isFromPending && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    {t.pendingProfile}
                  </span>
                )}
              </div>
              {actualProfile.birth_date && (
                <p className="text-gray-600 mt-1">
                  {t.born}: {new Date(actualProfile.birth_date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                  {actualProfile.birth_place && ` ${t.inPlace} ${actualProfile.birth_place}`}
                </p>
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

        {/* Voice stories recorder for relatives */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <VoiceStoryRecorder targetProfileId={actualProfile.id} />
        </div>

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
  );
}
