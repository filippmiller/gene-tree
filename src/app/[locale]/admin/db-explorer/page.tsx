import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import DatabaseExplorer from './DatabaseExplorer';

export default async function DbExplorerPage() {
  // Get admin name for audit logging
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  let adminName = 'Admin';
  if (user?.id) {
    const { data } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    if (data) {
      const profile = data as { first_name: string | null; last_name: string | null };
      adminName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-600 dark:text-slate-400">
          View and manage database tables. All actions are logged.
        </p>
      </div>
      <DatabaseExplorer adminName={adminName} />
    </div>
  );
}
