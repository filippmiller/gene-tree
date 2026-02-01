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
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { redirect } from 'next/navigation';
import ProfileLayout from '@/components/profile/ProfileLayout';
import EducationSection from '@/components/profile/EducationSection';
import ResidenceSection from '@/components/profile/ResidenceSection';
import AvatarUpload from '@/components/profile/AvatarUpload';
import ProfilePhotosSection from '@/components/profile/ProfilePhotosSection';
import ProfileInterestsSection from '@/components/profile/ProfileInterestsSection';
import { GlassCard } from '@/components/ui/glass-card';
import { ProfileCompletenessRing } from '@/components/profile/ProfileCompletenessRing';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Database } from '@/lib/types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

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

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch current profile data including fields needed for completeness
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();

  // Cast to expected type for TypeScript
  const profile = profileData as UserProfile | null;

  if (profileError) {
    // For now, log on server side; UI will simply render without existing avatar
    console.error('Failed to load profile for MyProfilePage:', profileError);
  }

  const currentAvatar = profile?.avatar_url ?? null;

  // Fetch completeness data
  const hasPhoto = Boolean(profile?.avatar_url || profile?.current_avatar_id);

  // Check for stories (bio or voice stories)
  let hasStory = Boolean(profile?.bio && profile.bio.length > 20);
  if (!hasStory) {
    const { count: storyCount } = await supabaseAdmin
      .from('voice_stories')
      .select('id', { count: 'exact', head: true })
      .eq('target_profile_id', profileId)
      .eq('status', 'approved');
    hasStory = (storyCount || 0) > 0;
  }

  // Check for relationships
  const { count: relationshipCount } = await supabaseAdmin
    .from('relationships')
    .select('id', { count: 'exact', head: true })
    .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);
  const hasRelationships = (relationshipCount || 0) > 0;

  // Check for residence history
  let hasResidenceHistory = Boolean(
    profile?.current_city || profile?.birth_city || profile?.birth_place
  );
  if (!hasResidenceHistory) {
    const { count: residenceCount } = await supabaseAdmin
      .from('person_residence')
      .select('id', { count: 'exact', head: true })
      .eq('person_id', profileId);
    hasResidenceHistory = (residenceCount || 0) > 0;
  }

  return (
    <ProfileLayout>
      <TooltipProvider>
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
                  <div className="flex items-start gap-6">
                    {/* Profile Completeness Ring */}
                    {profile && (
                      <div className="hidden sm:block">
                        <ProfileCompletenessRing
                          profile={profile}
                          hasPhoto={hasPhoto}
                          hasStory={hasStory}
                          hasRelationships={hasRelationships}
                          hasResidenceHistory={hasResidenceHistory}
                          size="lg"
                          showTier
                          locale={locale as 'en' | 'ru'}
                          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                        />
                      </div>
                    )}
                    <div className="text-white">
                      <h1 className="text-3xl font-bold">{t.title}</h1>
                      <p className="text-white/80 mt-2 max-w-md">
                        {t.description}
                      </p>
                      {/* Mobile-only compact ring */}
                      {profile && (
                        <div className="sm:hidden mt-4">
                          <ProfileCompletenessRing
                            profile={profile}
                            hasPhoto={hasPhoto}
                            hasStory={hasStory}
                            hasRelationships={hasRelationships}
                            hasResidenceHistory={hasResidenceHistory}
                            compact
                            locale={locale as 'en' | 'ru'}
                            className="bg-white/20"
                          />
                        </div>
                      )}
                    </div>
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
      </TooltipProvider>
    </ProfileLayout>
  );
}
