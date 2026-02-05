import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
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
  Sparkles,
  BookOpen,
  Search,
  ArrowUpRight,
  Timer,
} from 'lucide-react';

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: resolvedLocale } = await params;
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'dashboard' });
  const supabase = await getSupabaseSSR();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect(`/${resolvedLocale}/sign-in`);
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
      <ArchiveStatCard
        label={t('totalPeople')}
        value={totalPeople}
        icon={<Users className="w-6 h-6" />}
        accentColor="primary"
      />

      <ArchiveStatCard
        label={t('generations')}
        value={totalGenerations}
        icon={<Layers className="w-6 h-6" />}
        accentColor="accent"
      />

      <ArchiveStatCard
        label={t('relationships')}
        value={totalRelationships}
        icon={<Heart className="w-6 h-6" />}
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
    <Card elevation="raised" className="overflow-hidden">
      <CardContent className="p-6">
        <h2 className="font-display text-xl font-medium text-foreground mb-6">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ArchiveActionCard
            href={`/${resolvedLocale}/people/new`}
            icon={<UserPlus className="w-5 h-5" />}
            title={t('addFamilyMember')}
            description={t('addFamilyMemberDescription')}
          />

          <ArchiveActionCard
            href={`/${resolvedLocale}/tree`}
            icon={<TreePine className="w-5 h-5" />}
            title={t('viewFamilyTree')}
            description={t('viewFamilyTreeDescription')}
          />
        </div>
      </CardContent>
    </Card>
  );

  const activityFeedWidget = (
    <Card elevation="raised" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-medium text-foreground">{t('recentActivity')}</h2>
        </div>
        <ActivityFeed limit={10} />
      </CardContent>
    </Card>
  );

  const exploreFeaturesWidget = (
    <Card elevation="raised" className="overflow-hidden">
      <CardContent className="p-6">
        <h2 className="font-display text-xl font-medium text-foreground mb-6">{t('exploreFamily')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ArchiveFeatureCard
            href={`/${resolvedLocale}/relationship-finder`}
            icon={<Link2 className="w-5 h-5" />}
            title={t('howAreWeRelated')}
            description={t('howAreWeRelatedDescription')}
          />

          <ArchiveFeatureCard
            href={`/${resolvedLocale}/elder-questions`}
            icon={<ScrollText className="w-5 h-5" />}
            title={t('askTheElder')}
            description={t('askTheElderDescription')}
          />

          <ArchiveFeatureCard
            href={`/${resolvedLocale}/family-profile/settings`}
            icon={<Settings className="w-5 h-5" />}
            title={t('emailPreferences')}
            description={t('emailPreferencesDescription')}
          />

          <ArchiveFeatureCard
            href={`/${resolvedLocale}/find-relatives`}
            icon={<Search className="w-5 h-5" />}
            title={t('findRelatives')}
            description={t('findRelativesDescription')}
          />

          <ArchiveFeatureCard
            href={`/${resolvedLocale}/memory-book`}
            icon={<BookOpen className="w-5 h-5" />}
            title={t('memoryBook')}
            description={t('memoryBookDescription')}
          />

          <ArchiveFeatureCard
            href={`/${resolvedLocale}/time-capsules`}
            icon={<Timer className="w-5 h-5" />}
            title={t('timeCapsules')}
            description={t('timeCapsulesDescription')}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 max-w-7xl">
        {/* Hero Welcome Section */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Welcome Card - Cinematic Hero */}
          <div className="flex-1 relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />

            {/* Decorative elements */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute right-8 top-8 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>

            {/* Content */}
            <div className="relative p-8 sm:p-10">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <div className="relative">
                    <img
                      src={profile.avatar_url}
                      alt={userName}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
                    />
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl shadow-glow-lg opacity-50" />
                  </div>
                ) : (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl ring-4 ring-white/20">
                    <span className="text-white text-2xl sm:text-3xl font-display font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Welcome text */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium text-white truncate">
                      {t('welcomeBack', { name: userName })}
                    </h1>
                    <Badge className="shrink-0 bg-white/10 text-white/90 border-white/20 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Active
                    </Badge>
                  </div>
                  <p className="text-white/70 text-base sm:text-lg max-w-xl">
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
          <ProfileCompletionWidget completion={completion} locale={resolvedLocale} />
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
 * ArchiveStatCard - Cinematic stat card with golden accents
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
      gradient: 'from-primary to-primary/80',
      glow: 'shadow-glow-primary',
      text: 'text-primary',
      bg: 'bg-primary/10',
    },
    accent: {
      gradient: 'from-accent to-accent/80',
      glow: 'shadow-glow-accent',
      text: 'text-accent',
      bg: 'bg-accent/10',
    },
    rose: {
      gradient: 'from-rose-500 to-rose-500/80',
      glow: 'shadow-[0_0_24px_-6px_rgb(244_63_94/0.4)]',
      text: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <Card
      elevation="raised"
      interactive
      glow
      className="group overflow-hidden"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {label}
            </p>
            <p className="text-4xl font-display font-medium tracking-tight">
              {value}
            </p>
          </div>

          {/* Icon with gradient background */}
          <div className={`
            relative rounded-xl p-3
            ${colors.bg} ${colors.text}
            transition-all duration-300
            group-hover:scale-110
          `}>
            {icon}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={`
          absolute bottom-0 left-0 right-0 h-1
          bg-gradient-to-r ${colors.gradient}
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        `} />
      </CardContent>
    </Card>
  );
}

/**
 * ArchiveActionCard - Interactive action card with golden hover
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
        relative overflow-hidden rounded-2xl p-5
        border-2 border-dashed border-border/50
        bg-muted/30
        transition-all duration-300
        hover:border-primary/30 hover:bg-primary/5
        hover:-translate-y-0.5 hover:shadow-elevation-3
      ">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="
            w-12 h-12 rounded-xl
            bg-gradient-to-br from-primary to-accent
            flex items-center justify-center text-primary-foreground
            shadow-glow
            transition-all duration-300
            group-hover:scale-110 group-hover:shadow-glow-lg
          ">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
              {title}
            </p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

/**
 * ArchiveFeatureCard - Feature exploration card
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
        relative overflow-hidden rounded-2xl p-5
        border-2 border-dashed border-border/50
        bg-muted/30
        transition-all duration-300
        hover:border-primary/30 hover:bg-primary/5
        hover:-translate-y-0.5 hover:shadow-elevation-3
        h-full
      ">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="
            w-14 h-14 rounded-xl
            bg-gradient-to-br from-primary to-accent
            flex items-center justify-center text-primary-foreground
            shadow-glow
            transition-all duration-300
            group-hover:scale-110 group-hover:shadow-glow-lg
          ">
            {icon}
          </div>

          {/* Content */}
          <div>
            <p className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="
          absolute top-3 right-3
          opacity-0 -translate-x-1 translate-y-1
          group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0
          transition-all duration-300
        ">
          <ArrowUpRight className="w-4 h-4 text-primary" />
        </div>
      </div>
    </Link>
  );
}
