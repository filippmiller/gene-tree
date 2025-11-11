import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileCompleteForm from './ProfileCompleteForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfileCompletePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Try to load existing profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile already exists with name, redirect to dashboard
  if (profile && profile.first_name && profile.last_name) {
    redirect(`/${locale}/app`);
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 mb-8">
          Let's get to know you better! This information will help build your family tree.
        </p>

        <ProfileCompleteForm initialData={profile} />
      </div>
    </div>
  );
}
