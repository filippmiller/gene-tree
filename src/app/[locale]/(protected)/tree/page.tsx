/**
 * /[locale]/(protected)/tree/page.tsx
 * 
 * Миссия: Страница визуализации семейного дерева текущего пользователя
 * 
 * Используется как главная точка входа для просмотра дерева.
 * Автоматически перенаправляет на /tree/[user_id] с ID текущего пользователя.
 */

import {redirect} from 'next/navigation';
import {getSupabaseSSR} from '@/lib/supabase/server-ssr';

export default async function TreePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Redirect to tree page with user's ID
  redirect(`/${locale}/tree/${user.id}`);
}
