import {redirect} from 'next/navigation';
import {supabaseSSR} from '@/lib/supabase/server-ssr';
import SettingsForm from './Form';
import type { UserProfile } from './types';

export default async function ProfileSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await supabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single() as any;

  // Allow access even without profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold">Profile Settings</div>
          <a href={`/${locale}/app`} className="text-sm text-blue-600 hover:underline">Back to Dashboard</a>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsForm initial={profile as any} />
      </main>
    </div>
  );
}
