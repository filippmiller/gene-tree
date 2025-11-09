import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';
import Link from 'next/link';
import RelationshipsList from '@/components/relationships/RelationshipsList';
// TreeVisualization temporarily disabled
// import TreeVisualization from '@/components/tree/TreeVisualization';

export default async function RelationsPage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect(`/${locale}/profile/complete`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Family Tree
                </span>
              </div>
              <div className="hidden md:flex space-x-4">
                <Link href={`/${locale}/app`} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link href={`/${locale}/people`} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  People
                </Link>
                <Link href={`/${locale}/relations`} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                  Relationships
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Relationships</h1>
            <p className="text-gray-600">View and manage your family connections</p>
          </div>
        </div>

        {/* List of confirmed relationships */}
        <RelationshipsList currentUserId={user.id} />

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

