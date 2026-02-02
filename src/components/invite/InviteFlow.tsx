'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import WelcomeScreen from './WelcomeScreen';
import ClaimVerificationForm from './ClaimVerificationForm';
import type { FamilyStats } from '@/lib/invitations/family-stats';

interface PendingRelative {
  id: string;
  invitation_token: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  relationship_type: string;
  date_of_birth?: string | null;
  is_deceased?: boolean;
  invited_by: string;
  status: string;
}

interface InviteFlowProps {
  invitation: PendingRelative;
  inviterName: string;
  familyStats: FamilyStats;
  locale: string;
}

type FlowStep = 'welcome' | 'verify' | 'dispute';

export default function InviteFlow({
  invitation,
  inviterName,
  familyStats,
  locale,
}: InviteFlowProps) {
  const [step, setStep] = useState<FlowStep>('welcome');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const inviteeName = [invitation.first_name, invitation.last_name]
    .filter(Boolean)
    .join(' ') || 'Guest';

  const handleAccept = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep('verify');
      setIsTransitioning(false);
    }, 300);
  };

  const handleNotMe = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep('dispute');
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep('welcome');
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative">
      {/* Welcome Screen */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          step === 'welcome' && !isTransitioning
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-12 pointer-events-none absolute inset-0"
        )}
      >
        {step === 'welcome' && (
          <WelcomeScreen
            inviterName={inviterName}
            inviteeName={inviteeName}
            relationshipType={invitation.relationship_type}
            familyStats={familyStats}
            locale={locale}
            onAccept={handleAccept}
            onNotMe={handleNotMe}
          />
        )}
      </div>

      {/* Verification/Dispute Screen */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          (step === 'verify' || step === 'dispute') && !isTransitioning
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-12 pointer-events-none absolute inset-0"
        )}
      >
        {(step === 'verify' || step === 'dispute') && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 py-12 px-4">
            <div className="max-w-xl mx-auto">
              {/* Back button */}
              <button
                onClick={handleBack}
                className="mb-6 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {locale === 'ru' ? 'Назад' : 'Back'}
              </button>

              {/* Claim Verification Form */}
              <ClaimVerificationForm
                invitation={invitation}
                inviterName={inviterName}
                locale={locale}
                initialMode={step === 'dispute' ? 'dispute' : 'view'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
