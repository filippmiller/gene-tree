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

  return (
    <ProfileLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your education history and places of residence
          </p>
        </div>

        {/* Education Section */}
        <EducationSection userId={user.id} />

        {/* Residence Section */}
        <ResidenceSection userId={user.id} />
      </div>
    </ProfileLayout>
  );
}
