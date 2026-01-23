import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Clock,
  CheckCircle,
  ChevronRight,
  Users,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Fetch pending relatives
  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('*')
    .eq('invited_by', user.id)
    .order('created_at', { ascending: false });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      parent: 'from-violet-500 to-purple-600',
      grandparent: 'from-amber-500 to-orange-600',
      child: 'from-sky-500 to-blue-600',
      grandchild: 'from-pink-500 to-rose-600',
      sibling: 'from-emerald-500 to-teal-600',
      spouse: 'from-rose-500 to-red-600',
    };
    return colors[type] || 'from-violet-500 to-purple-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Family Members
            </h1>
            <p className="text-muted-foreground">
              Manage your family tree and invite relatives
            </p>
          </div>

          <Button asChild variant="gradient" size="lg" className="shadow-lg shadow-violet-500/25">
            <Link href={`/${locale}/people/new`}>
              <UserPlus className="w-5 h-5 mr-2" />
              Add Relative
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Pending Invitations */}
          <GlassCard glass="medium" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Pending Invitations</h2>
                <p className="text-sm text-muted-foreground">
                  {pendingRelatives?.length || 0} family members waiting
                </p>
              </div>
            </div>

            {pendingRelatives && pendingRelatives.length > 0 ? (
              <div className="space-y-3">
                {pendingRelatives.map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/profile/${rel.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-violet-500/20 hover:-translate-y-0.5 hover:shadow-glass transition-all duration-300">
                      {/* Avatar */}
                      <Avatar className={`w-12 h-12 ring-2 ring-offset-2 ring-offset-background shadow-md`}>
                        <AvatarFallback className={`bg-gradient-to-br ${getRelationshipColor(rel.relationship_type)} text-white font-semibold`}>
                          {getInitials(rel.first_name, rel.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {rel.first_name} {rel.last_name}
                          </span>
                          {rel.is_deceased && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                              In Memory
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{rel.relationship_type}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {rel.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {rel.email}
                            </span>
                          )}
                          {rel.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(rel.date_of_birth).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${locale}/people/new?relatedTo=${rel.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add relatives
                        </Link>
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                          Pending
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No pending invitations yet
                </p>
                <Button asChild variant="outline">
                  <Link href={`/${locale}/people/new`}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add your first relative
                  </Link>
                </Button>
              </div>
            )}
          </GlassCard>

          {/* Confirmed Relatives */}
          <GlassCard glass="medium" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Confirmed Relatives</h2>
                <p className="text-sm text-muted-foreground">
                  Family members who accepted your invitation
                </p>
              </div>
            </div>

            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mx-auto mb-4 opacity-50">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-muted-foreground">
                No confirmed relatives yet. Invite someone and ask them to accept!
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
