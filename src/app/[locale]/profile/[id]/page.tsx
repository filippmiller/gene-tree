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
    const { data: pendingProfile } = await getSupabaseAdmin()
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

  const fullName = [actualProfile.first_name, actualProfile.middle_name, actualProfile.last_name]
    .filter(Boolean)
    .join(' ');

  const isDeceased = !!actualProfile.death_date;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar placeholder */}
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {actualProfile.first_name?.[0]}{actualProfile.last_name?.[0]}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                {isDeceased && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    ✠ Deceased
                  </span>
                )}
                {isFromPending && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                    ⚠️ Pending Profile
                  </span>
                )}
              </div>
              {actualProfile.birth_date && (
                <p className="text-gray-600 mt-1">
                  Born: {new Date(actualProfile.birth_date).toLocaleDateString()}
                  {actualProfile.birth_place && ` in ${actualProfile.birth_place}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {actualProfile.bio && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{actualProfile.bio}</p>
          </div>
        )}

        {/* Pending profile notice */}
        {isFromPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">
              📝 Incomplete Profile
            </h2>
            <p className="text-yellow-800">
              This person hasn't completed their profile yet. Information shown is based on family records.
            </p>
          </div>
        )}

        {/* Voice stories recorder for relatives */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <VoiceStoryRecorder targetProfileId={actualProfile.id} />
        </div>

        {/* Action: Request to connect (placeholder) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Are you related to {actualProfile.first_name}?
          </h2>
          <p className="text-gray-600 mb-4">
            If you think you're family, you can send a connection request.
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
            Send Connection Request
          </button>
        </div>
      </div>
    </div>
  );
}
