import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';

export default async function RelationsPage({params:{locale}}:{params:{locale:string}}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return <div>Relations</div>;
}

