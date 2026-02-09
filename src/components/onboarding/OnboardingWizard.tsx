'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import Step1AboutYou from './steps/Step1AboutYou';
import Step2Parents from './steps/Step2Parents';
import Step3Grandparents from './steps/Step3Grandparents';
import Step3Siblings from './steps/Step3Siblings';
import Step4Invite from './steps/Step4Invite';
import { FamilyProgressTracker } from './FamilyProgressTracker';
import {
  loadWizardState,
  saveWizardState,
  clearWizardState,
  type WizardState,
  type AboutYouData,
  type ParentsData,
  type GrandparentsData,
  type SiblingsData,
  type InviteData,
} from '@/lib/onboarding/wizard-state';
import { cn } from '@/lib/utils';

const FAMILY_GOAL = 5; // "First Five Minutes" goal
const TOTAL_STEPS = 5;

interface Props {
  locale: string;
  existingProfile?: {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    gender?: string;
    avatar_url?: string;
  };
}

export default function OnboardingWizard({ locale, existingProfile }: Props) {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [state, setState] = useState<WizardState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Load state on mount
  useEffect(() => {
    const loaded = loadWizardState();

    // Pre-fill with existing profile data if available
    if (existingProfile) {
      loaded.aboutYou = {
        ...loaded.aboutYou,
        firstName: loaded.aboutYou.firstName || existingProfile.first_name || '',
        lastName: loaded.aboutYou.lastName || existingProfile.last_name || '',
        birthDate: loaded.aboutYou.birthDate || existingProfile.birth_date || undefined,
        gender: loaded.aboutYou.gender || (existingProfile.gender as any) || undefined,
        avatarPreview: loaded.aboutYou.avatarPreview || existingProfile.avatar_url || undefined,
      };
    }

    setState(loaded);
  }, [existingProfile]);

  // Save state whenever it changes
  useEffect(() => {
    if (state) {
      saveWizardState(state);
    }
  }, [state]);

  const updateAboutYou = useCallback((data: AboutYouData) => {
    setState((prev) => (prev ? { ...prev, aboutYou: data } : prev));
  }, []);

  const updateParents = useCallback((data: ParentsData) => {
    setState((prev) => (prev ? { ...prev, parents: data } : prev));
  }, []);

  const updateGrandparents = useCallback((data: GrandparentsData) => {
    setState((prev) => (prev ? { ...prev, grandparents: data } : prev));
  }, []);

  const updateSiblings = useCallback((data: SiblingsData) => {
    setState((prev) => (prev ? { ...prev, siblings: data } : prev));
  }, []);

  const updateInvite = useCallback((data: InviteData) => {
    setState((prev) => (prev ? { ...prev, invite: data } : prev));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (!state) return;
      setDirection(step > state.currentStep ? 'forward' : 'backward');
      setAnimating(true);
      setTimeout(() => {
        setState((prev) => (prev ? { ...prev, currentStep: step } : prev));
        setAnimating(false);
      }, 150);
    },
    [state]
  );

  const handleNext = useCallback(async () => {
    if (!state) return;

    // Validate current step
    if (state.currentStep === 1) {
      if (!state.aboutYou.firstName.trim() || !state.aboutYou.lastName.trim()) {
        setError(t('nameRequired'));
        return;
      }
    }

    setError(null);
    setSaving(true);

    try {
      // Save About You data (Step 1)
      if (state.currentStep === 1) {
        const formData = new FormData();
        formData.append('firstName', state.aboutYou.firstName.trim());
        formData.append('lastName', state.aboutYou.lastName.trim());
        if (state.aboutYou.birthDate) {
          formData.append('birthDate', state.aboutYou.birthDate);
        }
        if (state.aboutYou.gender) {
          formData.append('gender', state.aboutYou.gender);
        }
        if (state.aboutYou.avatarFile) {
          formData.append('avatar', state.aboutYou.avatarFile);
        }

        const response = await fetch('/api/onboarding/step1', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save profile');
        }
      }

      // Save Parents data (Step 2)
      if (state.currentStep === 2) {
        const response = await fetch('/api/onboarding/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...state.parents,
            previousIds: state.step2CreatedIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save parents');
        }

        const data = await response.json();
        if (data.createdIds) {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  step2CreatedIds: data.createdIds,
                }
              : prev
          );
        }
      }

      // Save Grandparents data (Step 3)
      if (state.currentStep === 3) {
        const response = await fetch('/api/onboarding/step3-grandparents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...state.grandparents,
            previousIds: state.step3CreatedIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save grandparents');
        }

        const data = await response.json();
        if (data.createdIds) {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  step3CreatedIds: data.createdIds,
                }
              : prev
          );
        }
      }

      // Save Siblings data (Step 4)
      if (state.currentStep === 4) {
        const response = await fetch('/api/onboarding/step3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...state.siblings,
            previousIds: state.step4CreatedIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save siblings');
        }

        const data = await response.json();
        if (data.createdIds) {
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  step4CreatedIds: data.createdIds,
                }
              : prev
          );
        }
      }

      // Move to next step
      goToStep(state.currentStep + 1);
    } catch (err) {
      console.error('Error saving step:', err);
      setError(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  }, [state, goToStep, t]);

  const handleBack = useCallback(() => {
    if (!state || state.currentStep <= 1) return;
    goToStep(state.currentStep - 1);
  }, [state, goToStep]);

  const handleFinish = useCallback(async () => {
    if (!state) return;

    setSaving(true);
    setError(null);

    try {
      // Send invite if configured
      if (state.invite.relativeId && state.invite.email) {
        await fetch('/api/onboarding/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.invite),
        });
      }

      // Mark onboarding as complete
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Clear wizard state
      clearWizardState();

      // Redirect to tree view (not dashboard)
      router.push(`/${locale}/tree`);
      router.refresh();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  }, [state, locale, router, t]);

  const handleSkip = useCallback(() => {
    if (!state) return;
    if (state.currentStep === TOTAL_STEPS) {
      handleFinish();
    } else {
      goToStep(state.currentStep + 1);
    }
  }, [state, goToStep, handleFinish]);

  // Calculate family members count for progress tracker
  const familyMembersCount = useMemo(() => {
    if (!state) return 0;

    // Count from in-form data (what user has entered but may not have saved yet)
    const parentsCount =
      (state.parents.mother.firstName && !state.parents.mother.skip ? 1 : 0) +
      (state.parents.father.firstName && !state.parents.father.skip ? 1 : 0);

    const grandparentsCount =
      (state.grandparents.maternalGrandmother.firstName && !state.grandparents.maternalGrandmother.skip ? 1 : 0) +
      (state.grandparents.maternalGrandfather.firstName && !state.grandparents.maternalGrandfather.skip ? 1 : 0) +
      (state.grandparents.paternalGrandmother.firstName && !state.grandparents.paternalGrandmother.skip ? 1 : 0) +
      (state.grandparents.paternalGrandfather.firstName && !state.grandparents.paternalGrandfather.skip ? 1 : 0);

    const siblingsCount =
      state.siblings.siblings.filter((s) => s.firstName).length +
      (state.siblings.spouse?.firstName ? 1 : 0);

    const inFormCount = parentsCount + grandparentsCount + siblingsCount;

    // Use MAX of in-form count vs. saved count to avoid double-counting during save transitions
    const savedCount = state.step2CreatedIds.length + state.step3CreatedIds.length + state.step4CreatedIds.length;
    return Math.max(inFormCount, savedCount);
  }, [state]);

  // Combined created IDs for the invite step
  const allCreatedRelativeIds = useMemo(() => {
    if (!state) return [];
    return [...state.step2CreatedIds, ...state.step3CreatedIds, ...state.step4CreatedIds];
  }, [state]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepTitles = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')];
  const progress = (state.currentStep / TOTAL_STEPS) * 100;

  const canGoNext =
    state.currentStep === 1
      ? state.aboutYou.firstName.trim() && state.aboutYou.lastName.trim()
      : true;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t('stepOf', { current: state.currentStep, total: TOTAL_STEPS })}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('welcomeTitle')}</h1>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>

        {/* Family Progress Tracker - shows after step 1 */}
        {state.currentStep > 1 && (
          <div className="mb-6">
            <FamilyProgressTracker
              count={familyMembersCount}
              goal={FAMILY_GOAL}
              locale={locale}
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepTitles.map((title, index) => (
              <button
                key={index}
                onClick={() => index + 1 <= state.currentStep && goToStep(index + 1)}
                disabled={index + 1 > state.currentStep}
                aria-label={t('stepOf', { current: index + 1, total: TOTAL_STEPS }) + ': ' + title}
                aria-current={index + 1 === state.currentStep ? 'step' : undefined}
                className={cn(
                  'text-xs font-medium transition-colors',
                  index + 1 === state.currentStep
                    ? 'text-primary'
                    : index + 1 < state.currentStep
                      ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                {title}
              </button>
            ))}
          </div>
          <Progress value={progress} variant="gradient" size="md" />
        </div>

        {/* Step Content */}
        <GlassCard glass="medium" padding="lg" className="mb-6">
          <div
            className={cn(
              'transition-all duration-150',
              animating && direction === 'forward' && 'opacity-0 translate-x-4',
              animating && direction === 'backward' && 'opacity-0 -translate-x-4'
            )}
          >
            {state.currentStep === 1 && (
              <Step1AboutYou data={state.aboutYou} onChange={updateAboutYou} locale={locale} />
            )}
            {state.currentStep === 2 && (
              <Step2Parents data={state.parents} onChange={updateParents} locale={locale} />
            )}
            {state.currentStep === 3 && (
              <Step3Grandparents
                data={state.grandparents}
                onChange={updateGrandparents}
                locale={locale}
                motherSkipped={state.parents.mother.skip || false}
                fatherSkipped={state.parents.father.skip || false}
                t={{
                  title: t('grandparents.title'),
                  subtitle: t('grandparents.subtitle'),
                  maternalTitle: t('grandparents.maternalTitle'),
                  paternalTitle: t('grandparents.paternalTitle'),
                  grandmother: t('grandparents.grandmother'),
                  grandfather: t('grandparents.grandfather'),
                  grandmotherMaternal: t('grandparents.grandmotherMaternal'),
                  grandfatherMaternal: t('grandparents.grandfatherMaternal'),
                  grandmotherPaternal: t('grandparents.grandmotherPaternal'),
                  grandfatherPaternal: t('grandparents.grandfatherPaternal'),
                  firstName: t('grandparents.firstName'),
                  lastName: t('grandparents.lastName'),
                  birthYear: t('grandparents.birthYear'),
                  birthYearOptional: t('grandparents.birthYearOptional'),
                  deceased: t('grandparents.deceased'),
                  skip: t('grandparents.skip'),
                  skipAll: t('grandparents.skipAll'),
                  skipHint: t('grandparents.skipHint'),
                }}
              />
            )}
            {state.currentStep === 4 && (
              <Step3Siblings data={state.siblings} onChange={updateSiblings} locale={locale} />
            )}
            {state.currentStep === 5 && (
              <Step4Invite
                data={state.invite}
                onChange={updateInvite}
                createdRelativeIds={allCreatedRelativeIds}
                locale={locale}
              />
            )}
          </div>
        </GlassCard>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={state.currentStep === 1 || saving}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {t('back')}
          </Button>

          <div className="flex items-center gap-3">
            {state.currentStep > 1 && state.currentStep < TOTAL_STEPS && (
              <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                {t('skip')}
              </Button>
            )}

            {state.currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canGoNext || saving}
                loading={saving}
                rightIcon={!saving && <ChevronRight className="w-4 h-4" />}
              >
                {saving ? t('saving') : t('next')}
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} loading={saving}>
                {saving ? t('saving') : t('finish')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
