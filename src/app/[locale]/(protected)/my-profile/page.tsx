/**
 * My Profile Page
 * 
 * User's own profile with editable sections:
 * - Education history
 * - Residence history
 * - Timeline view
 * 
 * This is different from /profile/[id] which shows public profiles.
 */

import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { redirect } from 'next/navigation';
import ProfileLayout from '@/components/profile/ProfileLayout';
import EducationSection from '@/components/profile/EducationSection';
import ResidenceSection from '@/components/profile/ResidenceSection';
import AvatarUpload from '@/components/profile/AvatarUpload';
import ProfilePhotosSection from '@/components/profile/ProfilePhotosSection';
import ProfileInterestsSection from '@/components/profile/ProfileInterestsSection';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function MyProfilePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const profileId = user.id; // user_profiles.id совпадает с auth.users.id

  // Fetch current profile data to get avatar_url for AvatarUpload
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('avatar_url')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError) {
    // For now, log on server side; UI will simply render without existing avatar
    console.error('Failed to load profile for MyProfilePage:', profileError);
  }

  const currentAvatar = profile?.avatar_url ?? null;

  return (
    <ProfileLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
            <p className="text-gray-600 mt-2">
              Обновляйте информацию о себе, загружайте фотографии и рассказывайте о своих интересах.
            </p>
          </div>
          <div>
            <AvatarUpload profileId={profileId} userId={user.id} currentAvatar={currentAvatar} />
          </div>
        </div>

        {/* Personal photos gallery */}
        <ProfilePhotosSection profileId={profileId} />

        {/* Education Section */}
        <EducationSection userId={user.id} />

        {/* Residence Section */}
        <ResidenceSection userId={user.id} />

        {/* Interests Section */}
        <ProfileInterestsSection profileId={profileId} />
      </div>
    </ProfileLayout>
  );
}
