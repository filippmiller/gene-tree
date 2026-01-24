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
import { GlassCard } from '@/components/ui/glass-card';

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

  // Translations
  const t = locale === 'ru' ? {
    title: 'Мой профиль',
    description: 'Обновляйте информацию о себе, загружайте фотографии и рассказывайте о своих интересах.',
  } : {
    title: 'My Profile',
    description: 'Update your information, upload photos, and share your interests.',
  };

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

  const currentAvatar = (profile as { avatar_url: string | null } | null)?.avatar_url ?? null;

  return (
    <ProfileLayout>
      <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <GlassCard glass="frosted" padding="none" className="overflow-hidden">
            <div className="relative">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600" />
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative p-6 sm:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{t.title}</h1>
                  <p className="text-white/80 mt-2 max-w-md">
                    {t.description}
                  </p>
                </div>
                <div className="shrink-0">
                  <AvatarUpload profileId={profileId} userId={user.id} currentAvatar={currentAvatar} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Personal photos gallery */}
          <ProfilePhotosSection profileId={profileId} />

          {/* Education Section */}
          <EducationSection userId={user.id} />

          {/* Residence Section */}
          <ResidenceSection userId={user.id} />

          {/* Interests Section */}
          <ProfileInterestsSection profileId={profileId} />
        </div>
      </div>
    </ProfileLayout>
  );
}
