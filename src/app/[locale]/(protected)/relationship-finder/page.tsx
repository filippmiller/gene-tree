import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { redirect } from 'next/navigation';
import RelationshipPathFinder from '@/components/relationship-path/RelationshipPathFinder';

export default async function RelationshipFinderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const supabaseAdmin = getSupabaseAdmin();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Get all family members from user_profiles (registered users)
  const { data: userProfiles } = await supabaseAdmin
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .order('first_name');

  // Get all pending relatives (unregistered family members)
  const { data: pendingRelatives } = await supabaseAdmin
    .from('pending_relatives')
    .select('id, first_name, last_name')
    .order('first_name');

  // Combine and deduplicate family members
  const familyMembersMap = new Map<string, { id: string; first_name: string; last_name: string; avatar_url: string | null }>();

  // Add user profiles first
  for (const profile of userProfiles || []) {
    familyMembersMap.set(profile.id, profile);
  }

  // Add pending relatives (won't overwrite existing profiles)
  for (const rel of pendingRelatives || []) {
    if (!familyMembersMap.has(rel.id)) {
      familyMembersMap.set(rel.id, { ...rel, avatar_url: null });
    }
  }

  const familyMembers = Array.from(familyMembersMap.values())
    .sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <main className="w-full px-4 sm:px-6 lg:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          <RelationshipPathFinder
            familyMembers={familyMembers || []}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  );
}
