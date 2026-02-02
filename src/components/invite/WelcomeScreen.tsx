'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Trees, Users, BookOpen, Layers, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FamilyStats } from '@/lib/invitations/family-stats';

interface WelcomeScreenProps {
  inviterName: string;
  inviteeName: string;
  relationshipType: string;
  familyStats: FamilyStats;
  locale: string;
  onAccept: () => void;
  onNotMe: () => void;
}

const translations = {
  en: {
    invitedYou: '{inviter} invited you to join their family tree',
    asRelationship: 'as their {relationship}',
    joinFamily: 'Join a family of {count} members',
    acrossGenerations: 'across {count} generations',
    storiesShared: '{count} stories shared',
    acceptInvitation: 'Accept Invitation',
    notMe: 'Not {name}? Let us know',
    yourFamilyAwaits: 'Your family story awaits',
    preserveMemories: 'Preserve memories, connect across generations, and build your legacy together.',
    recentActivity: 'Recently added {item}',
    members: 'Members',
    generations: 'Generations',
    stories: 'Stories',
    relationshipTypes: {
      parent: 'Child',
      child: 'Parent',
      spouse: 'Spouse',
      sibling: 'Sibling',
      grandparent: 'Grandchild',
      grandchild: 'Grandparent',
      aunt_uncle: 'Niece/Nephew',
      niece_nephew: 'Aunt/Uncle',
      cousin: 'Cousin',
    },
  },
  ru: {
    invitedYou: '{inviter} пригласил(а) вас в семейное древо',
    asRelationship: 'как {relationship}',
    joinFamily: 'Присоединяйтесь к семье из {count} человек',
    acrossGenerations: '{count} поколений',
    storiesShared: '{count} историй',
    acceptInvitation: 'Принять приглашение',
    notMe: 'Не {name}? Сообщите нам',
    yourFamilyAwaits: 'Ваша семейная история ждет',
    preserveMemories: 'Сохраняйте воспоминания, объединяйтесь поколениями и создавайте наследие вместе.',
    recentActivity: 'Недавно добавлено: {item}',
    members: 'Членов',
    generations: 'Поколений',
    stories: 'Историй',
    relationshipTypes: {
      parent: 'Ребёнок',
      child: 'Родитель',
      spouse: 'Супруг(а)',
      sibling: 'Брат/Сестра',
      grandparent: 'Внук/Внучка',
      grandchild: 'Дедушка/Бабушка',
      aunt_uncle: 'Племянник/Племянница',
      niece_nephew: 'Дядя/Тётя',
      cousin: 'Кузен/Кузина',
    },
  },
};

/**
 * Animated family tree illustration using CSS animations
 */
function TreeIllustration({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Animated glow behind tree */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-full blur-2xl",
          "animate-pulse transition-opacity duration-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Main tree circle */}
      <div
        className={cn(
          "relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30",
          "transition-all duration-700 ease-out",
          isVisible ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-180 opacity-0"
        )}
      >
        <Trees className="w-20 h-20 text-white drop-shadow-lg" />
      </div>

      {/* Decorative nodes - representing family members */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const radius = 80;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <div
            key={angle}
            className={cn(
              "absolute w-4 h-4 bg-white/80 rounded-full shadow-lg",
              "transition-all duration-500 ease-out",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )}
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -8,
              marginTop: -8,
              transform: isVisible
                ? `translate(${x}px, ${y}px)`
                : 'translate(0, 0)',
              transitionDelay: `${400 + i * 80}ms`,
            }}
          />
        );
      })}

      {/* Connection lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 192 192"
        style={{ overflow: 'visible' }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const radius = 80;
          const cx = 96;
          const cy = 96;
          const x = cx + Math.cos((angle * Math.PI) / 180) * radius;
          const y = cy + Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <line
              key={`line-${angle}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100" : "opacity-0"
              )}
              style={{
                strokeDasharray: radius,
                strokeDashoffset: isVisible ? 0 : radius,
                transitionDelay: `${200 + i * 50}ms`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Stat card for displaying family metrics
 */
function StatCard({
  icon: Icon,
  value,
  label,
  delay = 0,
  isVisible,
}: {
  icon: typeof Users;
  value: number | string;
  label: string;
  delay?: number;
  isVisible: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-3",
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      <span className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
        {label}
      </span>
    </div>
  );
}

export default function WelcomeScreen({
  inviterName,
  inviteeName,
  relationshipType,
  familyStats,
  locale,
  onAccept,
  onNotMe,
}: WelcomeScreenProps) {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get the relationship label from invitee's perspective
  // (inverted because if inviter added you as their "parent", you are their "child")
  const relationshipLabel =
    (t.relationshipTypes as Record<string, string>)[relationshipType] || relationshipType;

  const handleAccept = () => {
    setIsAccepting(true);
    // Small delay for visual feedback
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div
          className={cn(
            "w-full max-w-lg transition-all duration-600 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          <GlassCard glass="frosted" padding="lg" className="text-center space-y-8">
            {/* Tree Illustration */}
            <TreeIllustration isVisible={isVisible} />

            {/* Invitation Message */}
            <div className="space-y-2">
              <h1
                className={cn(
                  "text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white",
                  "transition-all duration-500 delay-300",
                  isVisible ? "opacity-100" : "opacity-0"
                )}
              >
                {t.invitedYou.replace('{inviter}', inviterName)}
              </h1>

              <p
                className={cn(
                  "text-lg text-emerald-600 dark:text-emerald-400 font-medium",
                  "transition-all duration-500 delay-400",
                  isVisible ? "opacity-100" : "opacity-0"
                )}
              >
                {t.asRelationship.replace('{relationship}', relationshipLabel)}
              </p>
            </div>

            {/* Family Stats */}
            <div
              className={cn(
                "bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4",
                "transition-all duration-500 delay-500",
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            >
              <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                <StatCard
                  icon={Users}
                  value={familyStats.memberCount}
                  label={t.members}
                  delay={600}
                  isVisible={isVisible}
                />
                <StatCard
                  icon={Layers}
                  value={familyStats.generationCount}
                  label={t.generations}
                  delay={700}
                  isVisible={isVisible}
                />
                <StatCard
                  icon={BookOpen}
                  value={familyStats.storyCount}
                  label={t.stories}
                  delay={800}
                  isVisible={isVisible}
                />
              </div>
            </div>

            {/* Tagline */}
            <div
              className={cn(
                "space-y-2 transition-all duration-500 delay-[900ms]",
                isVisible ? "opacity-100" : "opacity-0"
              )}
            >
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {t.yourFamilyAwaits}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.preserveMemories}
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className={cn(
                "space-y-3 pt-2 transition-all duration-500 delay-[1000ms]",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                loading={isAccepting}
                variant="gradient"
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 shadow-emerald-500/25 hover:shadow-emerald-500/30"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {t.acceptInvitation}
              </Button>

              <button
                onClick={onNotMe}
                className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                {t.notMe.replace('{name}', inviteeName)}
              </button>
            </div>
          </GlassCard>

          {/* Gene-Tree branding */}
          <div
            className={cn(
              "mt-6 text-center transition-all duration-500 delay-[1200ms]",
              isVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <Trees className="w-4 h-4" />
              <span className="text-sm font-medium">Gene-Tree</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {locale === 'ru'
                ? 'Ваша семейная история остается в вашей семье'
                : 'Your family story stays in your family'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
