import {redirect} from 'next/navigation';
import {createServerSupabase} from '@/lib/supabase/server';

export default async function ProfileCompletePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 mb-8">
          Let's get to know you better! This information will help build your family tree.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> {user.email}
            </p>
          </div>

          <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="font-medium text-yellow-900 mb-2">Profile Setup Coming Soon</p>
            <p className="text-sm text-yellow-800">
              The profile completion form is being built. For now, let's create a basic profile for you.
            </p>
          </div>

          <form action={`/api/profile/quick-setup`} method="POST" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Continue to Dashboard
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can add more details later from your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
