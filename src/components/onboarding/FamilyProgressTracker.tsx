'use client';

import { CheckCircle2, Circle, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  goal: number;
  locale: string;
}

const translations = {
  en: {
    progress: 'Family members added',
    of: 'of',
    goal: 'goal',
    keepGoing: 'Keep going!',
    almostThere: 'Almost there!',
    goalReached: 'Goal reached!',
    excellent: 'Excellent start!',
  },
  ru: {
    progress: 'Родственников добавлено',
    of: 'из',
    goal: 'цель',
    keepGoing: 'Продолжайте!',
    almostThere: 'Почти готово!',
    goalReached: 'Цель достигнута!',
    excellent: 'Отличное начало!',
  },
};

export function FamilyProgressTracker({ count, goal, locale }: Props) {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const percentage = Math.min((count / goal) * 100, 100);
  const goalReached = count >= goal;

  const getMessage = () => {
    if (goalReached) return t.goalReached;
    if (count >= goal - 1) return t.almostThere;
    if (count > 0) return t.keepGoing;
    return '';
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-4 transition-all duration-500',
        goalReached
          ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 border-2 border-emerald-500/30'
          : 'bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20'
      )}
    >
      {/* Celebration animation when goal reached */}
      {goalReached && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1 left-1/4 animate-bounce delay-100">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="absolute -top-1 right-1/4 animate-bounce delay-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="absolute top-2 left-1/2 animate-bounce delay-200">
            <Sparkles className="w-3 h-3 text-emerald-300" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className={cn('w-5 h-5', goalReached ? 'text-emerald-500' : 'text-primary')} />
          <span className="text-sm font-medium text-foreground">{t.progress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-2xl font-bold',
              goalReached ? 'text-emerald-500' : 'text-primary'
            )}
          >
            {count}
          </span>
          <span className="text-muted-foreground">
            {t.of} {goal}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: goal }, (_, i) => (
          <div key={i} className="flex-1">
            {i < count ? (
              <CheckCircle2
                className={cn(
                  'w-6 h-6 mx-auto transition-all duration-300',
                  goalReached ? 'text-emerald-500' : 'text-primary',
                  i === count - 1 && 'animate-pulse'
                )}
              />
            ) : (
              <Circle className="w-6 h-6 mx-auto text-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            goalReached
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-primary to-primary/70'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Message */}
      {getMessage() && (
        <p
          className={cn(
            'text-xs text-center mt-2 font-medium',
            goalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          )}
        >
          {goalReached && '🎉 '}
          {getMessage()}
        </p>
      )}
    </div>
  );
}
