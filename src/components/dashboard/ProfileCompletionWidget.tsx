'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  Camera,
  Calendar,
  MapPin,
  FileText,
  Users,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { type CompletionResult } from '@/lib/profile/completion-calculator';
import { cn } from '@/lib/utils';

interface ProfileCompletionWidgetProps {
  completion: CompletionResult;
  locale: string;
}

const iconMap = {
  Camera,
  Calendar,
  MapPin,
  FileText,
  Users,
  BookOpen,
};

const translations = {
  en: {
    title: 'Complete Your Profile',
    completeTitle: 'Profile Complete!',
    subtitle: 'Build a richer family story',
    allDone: "You're all set! Your profile helps family members connect with you.",
    tapToComplete: 'Tap to complete',
  },
  ru: {
    title: 'Заполните профиль',
    completeTitle: 'Профиль заполнен!',
    subtitle: 'Создайте более богатую семейную историю',
    allDone: 'Все готово! Ваш профиль помогает родственникам связаться с вами.',
    tapToComplete: 'Нажмите для заполнения',
  },
};

export default function ProfileCompletionWidget({
  completion,
  locale: localeParam,
}: ProfileCompletionWidgetProps) {
  const params = useParams();
  const locale = (params?.locale as string) || localeParam || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  const isComplete = completion.percentage === 100;

  return (
    <GlassCard
      glass="medium"
      padding="lg"
      className={cn(
        'relative overflow-hidden transition-all duration-500',
        isComplete && 'ring-2 ring-primary/30'
      )}
    >
      {/* Decorative background for complete state */}
      {isComplete && (
        <>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-pulse delay-300" />
        </>
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-foreground font-heritage">
                {isComplete ? t.completeTitle : t.title}
              </h2>
              {isComplete && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  100%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Progress Ring */}
          <div className="ml-4">
            <ProgressRing
              value={completion.percentage}
              size="lg"
              showValue
              missingItems={completion.missingFields.map((f) => ({
                id: f.id,
                label: locale === 'ru' ? f.labelRu : f.label,
                labelRu: f.labelRu,
                weight: f.weight,
                isComplete: f.isComplete,
                description: locale === 'ru' ? f.descriptionRu : f.description,
                descriptionRu: f.descriptionRu,
              }))}
              locale={locale as 'en' | 'ru'}
            />
          </div>
        </div>

        {/* Message */}
        <div
          className={cn(
            'mb-6 p-4 rounded-xl border',
            isComplete
              ? 'bg-primary/5 border-primary/20 text-primary'
              : 'bg-muted/50 border-border/50'
          )}
        >
          <div className="flex items-start gap-3">
            {isComplete && <Sparkles className="w-5 h-5 mt-0.5 animate-pulse" />}
            <p className="text-sm font-medium">
              {locale === 'ru' ? completion.messageRu : completion.message}
            </p>
          </div>
        </div>

        {/* Completion Items */}
        {isComplete ? (
          // All done state
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {t.allDone}
            </div>
          </div>
        ) : (
          // Missing items list
          <div className="space-y-2">
            {completion.missingFields.map((field) => {
              const IconComponent = iconMap[field.icon as keyof typeof iconMap];

              return (
                <Link
                  key={field.id}
                  href={field.linkTo || `/${locale}/my-profile`}
                  className="block group"
                >
                  <div
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-xl',
                      'border border-dashed border-border/50',
                      'hover:border-primary/30 hover:bg-primary/5',
                      'transition-all duration-300'
                    )}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-[#58A6FF] flex items-center justify-center text-white shadow-lg shadow-[#58A6FF]/25 transition-transform duration-300 group-hover:scale-110">
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {locale === 'ru' ? field.labelRu : field.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {locale === 'ru' ? field.descriptionRu : field.description}
                      </p>
                    </div>

                    {/* Weight Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        +{field.weight}%
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Completed items summary (if some complete but not all) */}
        {completion.completedFields.length > 0 && !isComplete && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>
                {completion.completedFields.length} of {completion.fields.length} completed
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
