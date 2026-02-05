import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import TimeCapsulePageClient from './TimeCapsulePageClient';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default async function TimeCapsulePage({
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
  const { data: relationships } = await supabase
    .from('relationships')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  // Get unique profile IDs
  const relatedIds = new Set<string>();
  relatedIds.add(user.id);
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
    title: 'Капсулы времени',
    subtitle: 'Послания в будущее для ваших близких',
    createNew: 'Создать капсулу',
    tabSent: 'Отправленные',
    tabReceived: 'Полученные',
    emptyState: 'Капсул времени пока нет. Создайте первую, чтобы отправить послание в будущее.',
    emptyReceived: 'Вам ещё не доставлено ни одной капсулы времени.',
    confirmDelete: 'Вы уверены, что хотите удалить эту капсулу? Это действие необратимо.',
  } : {
    title: 'Time Capsules',
    subtitle: 'Messages for the future',
    createNew: 'Create Time Capsule',
    tabSent: 'Sent',
    tabReceived: 'Received',
    emptyState: 'No time capsules yet. Create one to send a message to the future.',
    emptyReceived: 'No time capsules have been delivered to you yet.',
    confirmDelete: 'Are you sure you want to delete this capsule? This action cannot be undone.',
  };

  return (
    <TimeCapsulePageClient
      locale={locale}
      currentUserId={user.id}
      currentProfile={currentProfile}
      familyMembers={(familyProfiles || (currentProfile ? [currentProfile] : [])) as Profile[]}
      translations={t}
    />
  );
}
