import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';

export default async function PeoplePage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return <div>People</div>;
}

