import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import Link from 'next/link';
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
} from 'lucide-react';

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  // Translations
  const t = locale === 'ru' ? {
    title: 'Члены семьи',
    subtitle: 'Управляйте семейным деревом и приглашайте родственников',
    addRelative: 'Добавить родственника',
    pendingInvitations: 'Ожидающие приглашения',
    familyMembersWaiting: 'родственников ожидают',
    addRelatives: 'Добавить родственников',
    pending: 'Ожидает',
    inMemory: 'В память',
    noPendingInvitations: 'Ожидающих приглашений пока нет',
    addFirstRelative: 'Добавьте первого родственника',
    confirmedRelatives: 'Подтверждённые родственники',
    confirmedSubtitle: 'Родственники, которые приняли ваше приглашение',
    noConfirmedRelatives: 'Подтверждённых родственников пока нет. Пригласите кого-нибудь!',
    relationshipTypes: {
      parent: 'родитель',
      grandparent: 'бабушка/дедушка',
      child: 'ребёнок',
      grandchild: 'внук/внучка',
      sibling: 'брат/сестра',
      spouse: 'супруг(а)',
      'aunt-uncle': 'дядя/тётя',
      'niece-nephew': 'племянник/племянница',
      cousin: 'двоюродный(ая)',
    } as Record<string, string>,
  } : {
    title: 'Family Members',
    subtitle: 'Manage your family tree and invite relatives',
    addRelative: 'Add Relative',
    pendingInvitations: 'Pending Invitations',
    familyMembersWaiting: 'family members waiting',
    addRelatives: 'Add relatives',
    pending: 'Pending',
    inMemory: 'In Memory',
    noPendingInvitations: 'No pending invitations yet',
    addFirstRelative: 'Add your first relative',
    confirmedRelatives: 'Confirmed Relatives',
    confirmedSubtitle: 'Family members who accepted your invitation',
    noConfirmedRelatives: 'No confirmed relatives yet. Invite someone and ask them to accept!',
    relationshipTypes: {
      parent: 'parent',
      grandparent: 'grandparent',
      child: 'child',
      grandchild: 'grandchild',
      sibling: 'sibling',
      spouse: 'spouse',
      'aunt-uncle': 'aunt/uncle',
      'niece-nephew': 'niece/nephew',
      cousin: 'cousin',
    } as Record<string, string>,
  };

  // Fetch pending relatives (status = 'pending' only)
  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('*')
    .eq('invited_by', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch confirmed relatives (status = 'accepted')
  const { data: confirmedRelatives } = await supabase
    .from('pending_relatives')
    .select('*')
    .eq('invited_by', user.id)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      parent: 'bg-[#58A6FF]/20 text-[#58A6FF]',
      grandparent: 'bg-[#D29922]/20 text-[#D29922]',
      child: 'bg-[#3FB9A0]/20 text-[#3FB9A0]',
      grandchild: 'bg-[#F85149]/20 text-[#F85149]',
      sibling: 'bg-[#3FB950]/20 text-[#3FB950]',
      spouse: 'bg-[#F85149]/20 text-[#F85149]',
    };
    return colors[type] || 'bg-[#58A6FF]/20 text-[#58A6FF]';
  };

  const getRelationshipLabel = (type: string) => {
    return t.relationshipTypes[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          <Button asChild size="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={`/${locale}/people/new`}>
              <UserPlus className="w-4 h-4 mr-2" />
              {t.addRelative}
            </Link>
          </Button>
        </div>

        <div className="grid gap-3">
          {/* Pending Invitations */}
          <div className="bg-card/80 backdrop-blur-md border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#D29922]/10 flex items-center justify-center text-[#D29922]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t.pendingInvitations}</h2>
                <p className="text-xs text-muted-foreground">
                  {pendingRelatives?.length || 0} {t.familyMembersWaiting}
                </p>
              </div>
            </div>

            {pendingRelatives && pendingRelatives.length > 0 ? (
              <div className="space-y-2">
                {pendingRelatives.map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/profile/${rel.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#161B22] border border-[#30363D] hover:border-primary/30 hover:bg-[#1C2128] transition-all duration-200">
                      {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${getRelationshipColor(rel.relationship_type)} font-semibold text-sm`}>
                          {getInitials(rel.first_name, rel.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                            {rel.first_name} {rel.last_name}
                          </span>
                          {rel.is_deceased && (
                            <span className="px-1.5 py-0.5 bg-[#8B949E]/10 text-[#8B949E] text-[10px] rounded">
                              {t.inMemory}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{getRelationshipLabel(rel.relationship_type)}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          {rel.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />
                              {rel.email}
                            </span>
                          )}
                          {rel.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(rel.date_of_birth).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${locale}/people/new?relatedTo=${rel.id}`}
                          className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          {t.addRelatives}
                        </Link>
                        <span className="px-2 py-0.5 bg-[#D29922]/10 text-[#D29922] text-[10px] font-medium rounded">
                          {t.pending}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center text-muted-foreground mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.noPendingInvitations}
                </p>
                <Button asChild variant="outline" size="sm" className="border-[#30363D]">
                  <Link href={`/${locale}/people/new`}>
                    <UserPlus className="w-3.5 h-3.5 mr-2" />
                    {t.addFirstRelative}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Confirmed Relatives */}
          <div className="bg-card/80 backdrop-blur-md border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#3FB950]/10 flex items-center justify-center text-[#3FB950]">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t.confirmedRelatives}</h2>
                <p className="text-xs text-muted-foreground">
                  {t.confirmedSubtitle}
                </p>
              </div>
            </div>

            {confirmedRelatives && confirmedRelatives.length > 0 ? (
              <div className="space-y-2">
                {confirmedRelatives.map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={`/${locale}/profile/${rel.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#161B22] border border-[#30363D] hover:border-[#3FB950]/30 hover:bg-[#1C2128] transition-all duration-200">
                      {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${getRelationshipColor(rel.relationship_type)} font-semibold text-sm`}>
                          {getInitials(rel.first_name, rel.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground group-hover:text-[#3FB950] transition-colors">
                            {rel.first_name} {rel.last_name}
                          </span>
                          {rel.is_deceased && (
                            <span className="px-1.5 py-0.5 bg-[#8B949E]/10 text-[#8B949E] text-[10px] rounded">
                              {t.inMemory}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{getRelationshipLabel(rel.relationship_type)}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          {rel.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />
                              {rel.email}
                            </span>
                          )}
                          {rel.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(rel.date_of_birth).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#3FB950]/10 text-[#3FB950] text-[10px] font-medium rounded flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {locale === 'ru' ? 'Подтверждено' : 'Confirmed'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center text-muted-foreground mx-auto mb-3 opacity-50">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.noConfirmedRelatives}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
