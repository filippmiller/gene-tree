import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import { getFamilyStats } from '@/lib/invitations/family-stats';
import InviteFlow from '@/components/invite/InviteFlow';
import { AlertCircle, Trees } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

// Translations for error states only (main content is in client components)
const translations = {
  en: {
    notFound: 'Invitation Not Found',
    notFoundDescription: 'This link is invalid or has expired',
    signIn: 'Sign In',
    alreadyProcessed: 'Already Processed',
    alreadyProcessedDescription: 'This invitation has already been accepted or declined',
  },
  ru: {
    notFound: 'Приглашение не найдено',
    notFoundDescription: 'Ссылка недействительна или срок действия истёк',
    signIn: 'Войти в систему',
    alreadyProcessed: 'Уже обработано',
    alreadyProcessedDescription: 'Это приглашение уже было принято или отклонено',
  },
};

export default async function InvitePage({ params }: PageProps) {
  const { locale, token } = await params;
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Use admin client because this page must work for unauthenticated users
  const supabase = getSupabaseAdmin();

  // Fetch invitation details by token (check all statuses first to give better error messages)
  const { data: invitation, error } = await supabase
    .from('pending_relatives')
    .select('*')
    .eq('invitation_token', token)
    .single();

  // Fetch inviter profile separately if invitation found
  let inviterName = 'Someone';
  if (invitation?.invited_by) {
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', invitation.invited_by)
      .single();
    if (inviterProfile) {
      inviterName = [inviterProfile.first_name, inviterProfile.last_name].filter(Boolean).join(' ') || 'Someone';
    }
  }

  // Handle invalid invitation (not found)
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.notFound}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.notFoundDescription}
          </p>
          <a
            href={`/${locale}/sign-in`}
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {t.signIn}
          </a>
        </div>
      </div>
    );
  }

  // Handle already processed invitation
  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.alreadyProcessed}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.alreadyProcessedDescription}
          </p>
          <a
            href={`/${locale}/sign-in`}
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {t.signIn}
          </a>
        </div>
      </div>
    );
  }

  // Fetch family stats for the inviter
  const familyStats = await getFamilyStats(supabase, invitation.invited_by);

  // Serialize invitation data for client component
  const serializedInvitation = {
    id: invitation.id,
    invitation_token: invitation.invitation_token,
    first_name: invitation.first_name,
    last_name: invitation.last_name,
    email: invitation.email,
    phone: invitation.phone,
    relationship_type: invitation.relationship_type,
    date_of_birth: invitation.date_of_birth,
    is_deceased: invitation.is_deceased,
    invited_by: invitation.invited_by,
    status: invitation.status,
  };

  return (
    <InviteFlow
      invitation={serializedInvitation}
      inviterName={inviterName}
      familyStats={familyStats}
      locale={locale}
    />
  );
}
