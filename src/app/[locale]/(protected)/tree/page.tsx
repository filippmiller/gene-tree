/**
 * /[locale]/(protected)/tree/page.tsx
 * 
 * Миссия: Страница визуализации семейного дерева текущего пользователя
 * 
 * Используется как главная точка входа для просмотра дерева.
 * Автоматически перенаправляет на /tree/[user_id] с ID текущего пользователя.
 */

import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';

export default async function TreePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Ensure profile exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect(`/${locale}/profile/complete`);

  // Redirect to tree page with user's ID
  redirect(`/${locale}/tree/${user.id}`);
}
