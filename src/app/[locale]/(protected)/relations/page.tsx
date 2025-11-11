import {redirect} from 'next/navigation';
import {getSupabaseSSR} from '@/lib/supabase/server-ssr';
import Link from 'next/link';
import BuildInfo from '@/components/BuildInfo';
import RelationshipsListByDepth from '@/components/relationships/RelationshipsListByDepth';

export default async function RelationsPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Allow access even without profile

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Relationships</h1>
            <p className="text-gray-600">View and manage your family connections</p>
          </div>
        </div>

        {/* List of relationships with correct depth classification */}
        <RelationshipsListByDepth currentUserId={user.id} />

        {/* Family Tree Visualization - Temporarily disabled */}
        {/* <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Family Tree</h2>
          <p className="text-gray-600 mb-6">
            Визуализация вашего генеалогического дерева. Подтвердите связи, чтобы они появились на дереве.
          </p>
          <TreeVisualization />
        </div> */}
      </main>
    </div>
  );
}

