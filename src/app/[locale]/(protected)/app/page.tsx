import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import ThisDayHub from '@/components/this-day/ThisDayHub';
import ActivityFeed from '@/components/feed/ActivityFeed';
import ProfileCompletionWidget from '@/components/dashboard/ProfileCompletionWidget';
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { calculateCompletion } from '@/lib/profile/completion-calculator';
import type { DashboardPreferences } from '@/types/dashboard-preferences';
import { DEFAULT_DASHBOARD_PREFERENCES } from '@/types/dashboard-preferences';
import {
  Users,
  Layers,
  Heart,
  UserPlus,
  TreePine,
  Link2,
  ScrollText,
  Settings,
  ChevronRight,
  Sparkles,
  BookOpen,
  Search,
  Leaf,
} from 'lucide-react';

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: resolvedLocale } = await params;
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'dashboard' });
  const supabase = await getSupabaseSSR();

  // Auth is already checked in layout - just get the user
  const { data: { user } } = await supabase.auth.getUser();

  // Handle edge case where user might be null despite layout check
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect(`/${resolvedLocale}/sign-in`);
    return null as never;
  }

  // Load user profile with dashboard preferences
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, dashboard_preferences')
    .eq('id', user.id)
    .single() as any;

  const userName = profile?.first_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  // Get dashboard preferences with defaults
  const dashboardPreferences: DashboardPreferences = {
    ...DEFAULT_DASHBOARD_PREFERENCES,
    ...(profile?.dashboard_preferences || {}),
    widgets: {
      ...DEFAULT_DASHBOARD_PREFERENCES.widgets,
      ...(profile?.dashboard_preferences?.widgets || {}),
    },
  };

  // Fetch stats from pending_relatives
  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('id, relationship_type')
    .eq('invited_by', user.id) as any;

  const totalPeople = (pendingRelatives?.length || 0);
  const totalRelationships = totalPeople;

  // Calculate generations from relationship types
  const generationLevels = new Set<number>();
  generationLevels.add(0);

  (pendingRelatives || []).forEach((rel: any) => {
    const type = rel.relationship_type;
    if (type === 'parent') generationLevels.add(-1);
    else if (type === 'grandparent') generationLevels.add(-2);
    else if (type === 'child') generationLevels.add(1);
    else if (type === 'grandchild') generationLevels.add(2);
  });

  const totalGenerations = generationLevels.size;

  // Calculate profile completion
  const hasPhoto = Boolean(profile?.avatar_url);

  // Check for parent relationship
  const { data: relationships } = await supabase
    .from('relationships')
    .select('id')
    .eq('profile_id', user.id)
    .eq('relationship_type', 'parent')
    .limit(1);

  const { data: pendingParents } = await supabase
    .from('pending_relatives')
    .select('id')
    .eq('invited_by', user.id)
    .eq('relationship_type', 'parent')
    .limit(1);

  const hasParent = (relationships?.length || 0) > 0 || (pendingParents?.length || 0) > 0;

  // Check for stories
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('author_id', user.id)
    .eq('status', 'approved')
    .limit(1);

  const hasStory = (stories?.length || 0) > 0;

  const completion = calculateCompletion(
    {
      profile: profile as any,
      hasPhoto,
      hasParent,
      hasStory,
    },
    resolvedLocale
  );

  // Widget content definitions
  const notificationsWidget = (
    <div className="w-full lg:w-80 shrink-0">
      <NotificationsPanel />
    </div>
  );

  const familyStatsWidget = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <ModernStatCard
        label={t('totalPeople')}
        value={totalPeople}
        icon={<Users className="w-6 h-6" />}
        gradient="from-primary to-emerald-700"
        shadowColor="shadow-primary/25"
      />

      <ModernStatCard
        label={t('generations')}
        value={totalGenerations}
        icon={<Layers className="w-6 h-6" />}
        gradient="from-accent to-amber-600"
        shadowColor="shadow-accent/25"
      />

      <ModernStatCard
        label={t('relationships')}
        value={totalRelationships}
        icon={<Heart className="w-6 h-6" />}
        gradient="from-rose-500 to-rose-600"
        shadowColor="shadow-rose-500/25"
      />
    </div>
  );

  const thisDayWidget = <ThisDayHub />;

  const quickActionsWidget = (
    <GlassCard glass="medium" padding="lg">
      <h2 className="text-xl font-bold text-foreground mb-6">{t('quickActions')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          href={`/${resolvedLocale}/people/new`}
          icon={<UserPlus className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-primary to-emerald-700"
          iconShadow="shadow-primary/25"
          title={t('addFamilyMember')}
          description={t('addFamilyMemberDescription')}
        />

        <QuickActionCard
          href={`/${resolvedLocale}/tree`}
          icon={<TreePine className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-accent to-amber-600"
          iconShadow="shadow-accent/25"
          title={t('viewFamilyTree')}
          description={t('viewFamilyTreeDescription')}
        />
      </div>
    </GlassCard>
  );

  const activityFeedWidget = (
    <GlassCard glass="medium" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{t('recentActivity')}</h2>
      </div>
      <ActivityFeed limit={10} />
    </GlassCard>
  );

  const exploreFeaturesWidget = (
    <GlassCard glass="medium" padding="lg">
      <h2 className="text-xl font-bold text-foreground mb-6">{t('exploreFamily')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          href={`/${resolvedLocale}/relationship-finder`}
          icon={<Link2 className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-primary to-emerald-700"
          iconShadow="shadow-primary/25"
          title={t('howAreWeRelated')}
          description={t('howAreWeRelatedDescription')}
        />

        <FeatureCard
          href={`/${resolvedLocale}/elder-questions`}
          icon={<ScrollText className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-accent to-amber-600"
          iconShadow="shadow-accent/25"
          title={t('askTheElder')}
          description={t('askTheElderDescription')}
        />

        <FeatureCard
          href={`/${resolvedLocale}/family-profile/settings`}
          icon={<Settings className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-slate-500 to-gray-600"
          iconShadow="shadow-slate-500/25"
          title={t('emailPreferences')}
          description={t('emailPreferencesDescription')}
        />

        <FeatureCard
          href={`/${resolvedLocale}/find-relatives`}
          icon={<Search className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-info to-blue-600"
          iconShadow="shadow-info/25"
          title={t('findRelatives')}
          description={t('findRelativesDescription')}
        />

        <FeatureCard
          href={`/${resolvedLocale}/memory-book`}
          icon={<BookOpen className="w-6 h-6" />}
          iconBg="bg-gradient-to-br from-accent to-amber-600"
          iconShadow="shadow-accent/25"
          title="Memory Book"
          description="Create a printable PDF book"
        />
      </div>
    </GlassCard>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Welcome Section - Always visible */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Welcome Card - Heritage Hero */}
          <GlassCard
            glass="frosted"
            padding="none"
            className="flex-1 overflow-hidden"
          >
            <div className="relative">
              {/* Heritage gradient background - Sage to Forest */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-700" />
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              {/* Subtle leaf pattern */}
              <div className="absolute right-4 top-4 text-white/10">
                <Leaf className="w-24 h-24" />
              </div>

              <div className="relative p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={userName}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/30 shadow-2xl ring-4 ring-white/10 backdrop-blur-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-2xl border-4 border-white/30 ring-4 ring-white/10">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                        {t('welcomeBack', { name: userName })}
                      </h1>
                      <Badge className="hidden sm:flex shrink-0 bg-amber-500/20 text-amber-100 border-amber-400/30 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-white/80 text-sm sm:text-base">
                      {t('subtitle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Notifications in header - show if visible in preferences */}
          {dashboardPreferences.widgets.notifications?.visible && notificationsWidget}
        </div>

        {/* Profile Completion Widget - Always visible when incomplete */}
        {completion.percentage < 100 && (
          <ProfileCompletionWidget completion={completion} locale={resolvedLocale} />
        )}

        {/* Customizable Widgets */}
        <DashboardWidgets
          initialPreferences={dashboardPreferences}
          widgets={{
            family_stats: familyStatsWidget,
            this_day: thisDayWidget,
            quick_actions: quickActionsWidget,
            activity_feed: activityFeedWidget,
            explore_features: exploreFeaturesWidget,
          }}
        />
      </main>
    </div>
  );
}

/**
 * ModernStatCard - Heritage gradient stat card
 */
function ModernStatCard({
  label,
  value,
  icon,
  gradient,
  shadowColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6
      bg-gradient-to-br ${gradient} text-white
      shadow-lg ${shadowColor}
      transition-all duration-300 ease-heritage
      hover:-translate-y-1 hover:shadow-xl
    `}>
      {/* Decorative background circles */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative">
        <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
        <p className="text-4xl font-bold">{value}</p>
      </div>

      {/* Icon */}
      <div className="absolute right-4 bottom-4 text-white/20">
        {icon}
      </div>
    </div>
  );
}

/**
 * QuickActionCard - Interactive heritage card for actions
 */
function QuickActionCard({
  href,
  icon,
  iconBg,
  iconShadow,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconShadow: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} prefetch={false} className="block group">
      <GlassCard
        glass="subtle"
        padding="none"
        hover="lift"
        className="border-2 border-dashed border-border/50 hover:border-primary/30 h-full"
      >
        <div className="p-5 flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-xl ${iconBg} ${iconShadow}
            flex items-center justify-center text-white shadow-lg
            transition-transform duration-300 group-hover:scale-110
          `}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </GlassCard>
    </Link>
  );
}

/**
 * FeatureCard - Card for engagement features
 */
function FeatureCard({
  href,
  icon,
  iconBg,
  iconShadow,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconShadow: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} prefetch={false} className="block group">
      <GlassCard
        glass="subtle"
        padding="none"
        hover="lift"
        className="border-2 border-dashed border-border/50 hover:border-primary/30 h-full"
      >
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className={`
            w-14 h-14 rounded-xl ${iconBg} ${iconShadow}
            flex items-center justify-center text-white shadow-lg
            transition-transform duration-300 group-hover:scale-110
          `}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
