import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';
import Link from 'next/link';
import BuildInfo from '@/components/BuildInfo';

export default async function AppPage({params}:{params: Promise<{locale:string}>}) {
  const {locale: resolvedLocale} = await params;
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log('[DASHBOARD] Auth check:', { hasUser: !!user, authError: authError?.message });

  if (!user) {
    console.log('[DASHBOARD] No user, redirecting to sign-in');
    redirect(`/${resolvedLocale}/sign-in`);
  }

  // Check if user has a profile, if not redirect to complete profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect(`/${resolvedLocale}/profile/complete`);
  }

  const userName = profile.first_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  // Fetch stats from pending_relatives
  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('id, relationship_type')
    .eq('invited_by', user.id);
  
  const totalPeople = (pendingRelatives?.length || 0);
  const totalRelationships = totalPeople; // Same as people count
  
  // Calculate generations from relationship types
  const generationLevels = new Set<number>();
  generationLevels.add(0); // User is generation 0
  
  (pendingRelatives || []).forEach(rel => {
    const type = rel.relationship_type;
    if (type === 'parent') generationLevels.add(-1);
    else if (type === 'grandparent') generationLevels.add(-2);
    else if (type === 'child') generationLevels.add(1);
    else if (type === 'grandchild') generationLevels.add(2);
  });
  
  const totalGenerations = generationLevels.size;

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
                <Link href={`/${resolvedLocale}/app`} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                  Dashboard
                </Link>
                <Link href={`/${resolvedLocale}/people`} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  People
                </Link>
                <Link href={`/${resolvedLocale}/tree`} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Tree View
                </Link>
                <Link href={`/${resolvedLocale}/profile/settings`} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <BuildInfo />
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your family tree and discover your heritage
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total People</p>
                <p className="text-3xl font-bold text-gray-900">{totalPeople}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Generations</p>
                <p className="text-3xl font-bold text-gray-900">{totalGenerations}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Relationships</p>
                <p className="text-3xl font-bold text-gray-900">{totalRelationships}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${resolvedLocale}/people/new`}
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Family Member</p>
                <p className="text-sm text-gray-600">Add someone to your family tree</p>
              </div>
            </Link>

            <Link
              href={`/${resolvedLocale}/tree`}
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Family Tree</p>
                <p className="text-sm text-gray-600">Explore your family connections</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity (placeholder) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p>No activity yet. Start by adding family members!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
