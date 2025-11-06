import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';

export default async function AppPage({params:{locale}}:{params: Promise<{locale:string}>}) {
  const {locale: resolvedLocale} = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${resolvedLocale}/sign-in`);

  return <div>Dashboard</div>;
}
