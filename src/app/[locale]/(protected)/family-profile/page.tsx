import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import ProfileForm from '@/components/profile/ProfileForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as any;

  // Allow viewing profile even if not complete

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Мой профиль
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <ProfileForm initialData={profile} userId={user.id} profileId={user.id} />
      </div>
    </div>
  );
}
