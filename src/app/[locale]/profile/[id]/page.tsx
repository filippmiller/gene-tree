import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await getSupabaseSSR();

  // Fetch public profile data
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, middle_name, last_name, birth_date, birth_place, bio')
    .eq('id', id)
    .single() as any;

  if (error || !profile) {
    notFound();
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar placeholder */}
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              {profile.birth_date && (
                <p className="text-gray-600 mt-1">
                  Born: {new Date(profile.birth_date).toLocaleDateString()}
                  {profile.birth_place && ` in ${profile.birth_place}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Action: Request to connect */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Are you related to {profile.first_name}?
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
