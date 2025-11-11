import {redirect} from 'next/navigation';
import {supabaseSSR} from '@/lib/supabase/server-ssr';
import Link from 'next/link';

export default async function PeoplePage({params}:{params:Promise<{locale:string}>}) {
  const {locale} = await params;
  const supabase = await supabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);
  
  // Fetch pending relatives
  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('*')
    .eq('invited_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Family Members
          </h1>
          <p className="text-gray-600">
            Manage your family tree and invite relatives
          </p>
        </div>
        
        <Link
          href={`/${locale}/people/new`}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Relative
        </Link>
      </div>
      
      <div className="grid gap-6">
        {/* Pending Invitations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending Invitations
          </h2>
          
          {pendingRelatives && pendingRelatives.length > 0 ? (
            <div className="space-y-3">
              {pendingRelatives.map((rel: any) => (
                <div key={rel.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{rel.first_name} {rel.last_name}</div>
                        {rel.is_deceased && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            † В память
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{rel.relationship_type}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rel.email && <span>{rel.email}</span>}
                        {rel.email && rel.phone && <span className="mx-2">•</span>}
                        {rel.phone && <span>{rel.phone}</span>}
                        {rel.date_of_birth && (
                          <>
                            {(rel.email || rel.phone) && <span className="mx-2">•</span>}
                            <span>ДР: {new Date(rel.date_of_birth).toLocaleDateString('ru-RU')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${locale}/people/new?relatedTo=${rel.id}`}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        title="Добавить родственников этого человека"
                      >
                        + Его/Её родственники
                      </Link>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No pending invitations. Click "Add Relative" to invite someone!
            </p>
          )}
        </div>
        
        {/* Confirmed Relatives */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmed Relatives
          </h2>
          
          <p className="text-gray-500 text-center py-8">
            No confirmed relatives yet. Invite someone and ask them to accept!
          </p>
        </div>
      </div>
    </div>
  );
}

