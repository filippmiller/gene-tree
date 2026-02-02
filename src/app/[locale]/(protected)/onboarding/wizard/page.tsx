import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Welcome to Gene-Tree',
  description: 'Set up your family tree in just a few minutes',
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingWizardPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Get user profile to check onboarding status and pre-fill data
  // Note: Type assertion needed as database types may not be regenerated
  type ProfileData = {
    first_name?: string | null;
    last_name?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    avatar_url?: string | null;
    onboarding_completed?: boolean;
  };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: ProfileData | null };

  // If onboarding already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect(`/${locale}/app`);
  }

  return (
    <OnboardingWizard
      userId={user.id}
      locale={locale}
      existingProfile={
        profile
          ? {
              first_name: profile.first_name || undefined,
              last_name: profile.last_name || undefined,
              birth_date: profile.birth_date || undefined,
              gender: profile.gender || undefined,
              avatar_url: profile.avatar_url || undefined,
            }
          : undefined
      }
    />
  );
}
