import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import {
  Users,
  FileText,
  Image,
  GitBranch,
  Activity,
  Database,
} from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function StatCard({ title, value, description, icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-500 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          {icon}
        </div>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();

  // Fetch quick stats
  const [
    { count: userCount },
    { count: storyCount },
    { count: photoCount },
    { count: relationshipCount },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('photos').select('*', { count: 'exact', head: true }),
    supabase.from('relationships').select('*', { count: 'exact', head: true }),
  ]);

  const basePath = `/${locale}/admin`;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome to the Gene Tree admin panel. Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={userCount || 0}
          description="Registered profiles"
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          href={`${basePath}/users`}
        />
        <StatCard
          title="Stories"
          value={storyCount || 0}
          description="Family stories shared"
          icon={<FileText className="w-6 h-6 text-indigo-600" />}
          href={`${basePath}/stories`}
        />
        <StatCard
          title="Photos"
          value={photoCount || 0}
          description="Photos uploaded"
          icon={<Image className="w-6 h-6 text-indigo-600" />}
          href={`${basePath}/photos`}
        />
        <StatCard
          title="Relationships"
          value={relationshipCount || 0}
          description="Family connections"
          icon={<GitBranch className="w-6 h-6 text-indigo-600" />}
          href={`${basePath}/relationships`}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`${basePath}/db-explorer`}
            className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Database Explorer</p>
              <p className="text-sm text-slate-500">Browse and manage data</p>
            </div>
          </Link>
          <Link
            href={`${basePath}/activity`}
            className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Activity Log</p>
              <p className="text-sm text-slate-500">View recent actions</p>
            </div>
          </Link>
          <Link
            href={`${basePath}/librarian`}
            className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Knowledge Base</p>
              <p className="text-sm text-slate-500">Manage documentation</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
