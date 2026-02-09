import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import ThisDayHub from '@/components/this-day/ThisDayHub';
import ActivityFeed from '@/components/feed/ActivityFeed';
import ProfileCompletionWidget from '@/components/dashboard/ProfileCompletionWidget';
import DashboardWidgets from '@/components/dashboard/DashboardWidgets';
import { MemoryPromptsWidget } from '@/components/prompts';
import TimeCapsuleWidget from '@/components/dashboard/TimeCapsuleWidget';
import { Card, CardContent } from '@/components/ui/card';
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
  BookOpen,
  Search,
  ArrowUpRight,
  Timer,
} from 'lucide-react';

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Enable static rendering and set request locale
  setRequestLocale(locale);

  const t = await getTranslations('dashboard');
  const supabase = await getSupabaseSSR();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect(`/${locale}/sign-in`);
    return null as never;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, dashboard_preferences')
    .eq('id', user.id)
    .single() as any;

  const userName = profile?.first_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  const dashboardPreferences: DashboardPreferences = {
    ...DEFAULT_DASHBOARD_PREFERENCES,
    ...(profile?.dashboard_preferences || {}),
    widgets: {
      ...DEFAULT_DASHBOARD_PREFERENCES.widgets,
      ...(profile?.dashboard_preferences?.widgets || {}),
    },
  };

  const { data: pendingRelatives } = await supabase
    .from('pending_relatives')
    .select('id, relationship_type')
    .eq('invited_by', user.id) as any;

  const totalPeople = (pendingRelatives?.length || 0);
  const totalRelationships = totalPeople;

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

  const hasPhoto = Boolean(profile?.avatar_url);

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
    locale
  );

  // Widget content definitions
  const notificationsWidget = (
    <div className="w-full lg:w-80 shrink-0">
      <NotificationsPanel />
    </div>
  );

  const familyStatsWidget = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <ArchiveStatCard
        label={t('totalPeople')}
        value={totalPeople}
        icon={<Users className="w-5 h-5" />}
        accentColor="primary"
      />

      <ArchiveStatCard
        label={t('generations')}
        value={totalGenerations}
        icon={<Layers className="w-5 h-5" />}
        accentColor="accent"
      />

      <ArchiveStatCard
        label={t('relationships')}
        value={totalRelationships}
        icon={<Heart className="w-5 h-5" />}
        accentColor="rose"
      />
    </div>
  );

  const thisDayWidget = <ThisDayHub />;

  const memoryPromptsWidget = <MemoryPromptsWidget />;

  const timeCapsuleWidget = (
    <div className="w-full lg:w-80 shrink-0">
      <TimeCapsuleWidget />
    </div>
  );

  const quickActionsWidget = (
    <Card className="overflow-hidden bg-card/80 backdrop-blur-md border border-white/[0.08]">
      <CardContent className="p-4">
        <h2 className="font-display text-lg font-medium text-foreground mb-3">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ArchiveActionCard
            href={`/people/new`}
            icon={<UserPlus className="w-4 h-4" />}
            title={t('addFamilyMember')}
            description={t('addFamilyMemberDescription')}
          />

          <ArchiveActionCard
            href={`/tree`}
            icon={<TreePine className="w-4 h-4" />}
            title={t('viewFamilyTree')}
            description={t('viewFamilyTreeDescription')}
          />
        </div>
      </CardContent>
    </Card>
  );

  const activityFeedWidget = (
    <Card className="overflow-hidden bg-card/80 backdrop-blur-md border border-white/[0.08]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-medium text-foreground">{t('recentActivity')}</h2>
        </div>
        <ActivityFeed limit={10} />
      </CardContent>
    </Card>
  );

  const exploreFeaturesWidget = (
    <Card className="overflow-hidden bg-card/80 backdrop-blur-md border border-white/[0.08]">
      <CardContent className="p-4">
        <h2 className="font-display text-lg font-medium text-foreground mb-3">{t('exploreFamily')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <ArchiveFeatureCard
            href={`/relationship-finder`}
            icon={<Link2 className="w-4 h-4" />}
            title={t('howAreWeRelated')}
            description={t('howAreWeRelatedDescription')}
          />

          <ArchiveFeatureCard
            href={`/elder-questions`}
            icon={<ScrollText className="w-4 h-4" />}
            title={t('askTheElder')}
            description={t('askTheElderDescription')}
          />

          <ArchiveFeatureCard
            href={`/family-profile/settings`}
            icon={<Settings className="w-4 h-4" />}
            title={t('emailPreferences')}
            description={t('emailPreferencesDescription')}
          />

          <ArchiveFeatureCard
            href={`/find-relatives`}
            icon={<Search className="w-4 h-4" />}
            title={t('findRelatives')}
            description={t('findRelativesDescription')}
          />

          <ArchiveFeatureCard
            href={`/memory-book`}
            icon={<BookOpen className="w-4 h-4" />}
            title={t('memoryBook')}
            description={t('memoryBookDescription')}
          />

          <ArchiveFeatureCard
            href={`/time-capsules`}
            icon={<Timer className="w-4 h-4" />}
            title={t('timeCapsules')}
            description={t('timeCapsulesDescription')}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <main className="w-full px-3 sm:px-4 py-3 space-y-3 max-w-7xl">
        {/* Hero Welcome Section */}
        <div className="flex flex-col lg:flex-row gap-3 items-start">
          {/* Welcome Card - Glass Hero */}
          <div className="flex-1 relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-md border border-white/[0.08]">
            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={userName}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center">
                    <span className="text-foreground text-xl font-display font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Welcome text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-xl font-display font-medium text-foreground truncate">
                      {t('welcomeBack', { name: userName })}
                    </h1>
                    <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-xs">
                      Active
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm max-w-xl">
                    {t('subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {dashboardPreferences.widgets.notifications?.visible && notificationsWidget}
        </div>

        {/* Profile Completion */}
        {completion.percentage < 100 && (
          <ProfileCompletionWidget completion={completion} locale={locale} />
        )}

        {/* Customizable Widgets */}
        <DashboardWidgets
          initialPreferences={dashboardPreferences}
          widgets={{
            family_stats: familyStatsWidget,
            this_day: thisDayWidget,
            memory_prompts: memoryPromptsWidget,
            time_capsules: timeCapsuleWidget,
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
 * ArchiveStatCard - Compact glass stat card
 */
function ArchiveStatCard({
  label,
  value,
  icon,
  accentColor = 'primary',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor?: 'primary' | 'accent' | 'rose';
}) {
  const colorClasses = {
    primary: {
      text: 'text-[#58A6FF]',
      bg: 'bg-[#58A6FF]/10',
    },
    accent: {
      text: 'text-[#3FB9A0]',
      bg: 'bg-[#3FB9A0]/10',
    },
    rose: {
      text: 'text-[#F85149]',
      bg: 'bg-[#F85149]/10',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <Card className="group overflow-hidden bg-card/80 backdrop-blur-md border border-white/[0.08]">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              {label}
            </p>
            <p className="text-3xl font-display font-medium tracking-tight">
              {value}
            </p>
          </div>

          {/* Icon */}
          <div className={`rounded-lg p-2 ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ArchiveActionCard - Compact action card
 */
function ArchiveActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} prefetch={false} className="block group">
      <div className="
        relative overflow-hidden rounded-lg p-3
        border border-[#30363D]
        bg-[#161B22]
        transition-all duration-200
        hover:border-primary/30 hover:bg-[#1C2128]
      ">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="
            w-9 h-9 rounded-lg
            bg-primary/10 text-primary
            flex items-center justify-center
            transition-colors duration-200
            group-hover:bg-primary/20
          ">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-4 h-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

/**
 * ArchiveFeatureCard - Compact feature card
 */
function ArchiveFeatureCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} prefetch={false} className="block group">
      <div className="
        relative overflow-hidden rounded-lg p-3
        border border-[#30363D]
        bg-[#161B22]
        transition-all duration-200
        hover:border-primary/30 hover:bg-[#1C2128]
        h-full
      ">
        <div className="flex flex-col items-center text-center gap-2">
          {/* Icon */}
          <div className="
            w-10 h-10 rounded-lg
            bg-primary/10 text-primary
            flex items-center justify-center
            transition-colors duration-200
            group-hover:bg-primary/20
          ">
            {icon}
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors mb-0.5">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="
          absolute top-2 right-2
          opacity-0
          group-hover:opacity-100
          transition-opacity duration-200
        ">
          <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
    </Link>
  );
}
