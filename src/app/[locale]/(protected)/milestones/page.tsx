import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import MilestonesPageClient from './MilestonesPageClient';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  // Fetch current user's profile
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Fetch family members (related profiles)
  // First get all relationships
  const { data: relationships } = await supabase
    .from('relationships')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  // Get unique profile IDs
  const relatedIds = new Set<string>();
  relatedIds.add(user.id); // Include self
  (relationships as Array<{ user1_id: string; user2_id: string }> | null)?.forEach(rel => {
    if (rel.user1_id !== user.id) relatedIds.add(rel.user1_id);
    if (rel.user2_id !== user.id) relatedIds.add(rel.user2_id);
  });

  // Fetch profiles
  const { data: familyProfiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', Array.from(relatedIds));

  // Translations
  const t = locale === 'ru' ? {
    title: 'Семейные события',
    subtitle: 'Отмечайте важные моменты жизни ваших близких',
    addMilestone: 'Добавить событие',
  } : {
    title: 'Family Milestones',
    subtitle: 'Celebrate the important moments in your family\'s life',
    addMilestone: 'Add Milestone',
  };

  return (
    <MilestonesPageClient
      locale={locale}
      currentUserId={user.id}
      currentProfile={currentProfile}
      familyMembers={(familyProfiles || (currentProfile ? [currentProfile] : [])) as Profile[]}
      translations={t}
    />
  );
}
