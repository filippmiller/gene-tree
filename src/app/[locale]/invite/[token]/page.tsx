import { getSupabaseAdmin } from '@/lib/supabase/server-admin';
import ClaimVerificationForm from '@/components/invite/ClaimVerificationForm';
import { AlertCircle, Trees } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

// Translations for the page header and error states
const translations = {
  en: {
    title: 'Family Tree Invitation',
    invitedYou: 'has invited you to join their family tree',
    notFound: 'Invitation Not Found',
    notFoundDescription: 'This link is invalid or has expired',
    signIn: 'Sign In',
    alreadyProcessed: 'Already Processed',
    alreadyProcessedDescription: 'This invitation has already been accepted or declined',
  },
  ru: {
    title: 'Приглашение в семейное дерево',
    invitedYou: 'пригласил(а) вас присоединиться к семье',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.notFound}
          </h1>
          <p className="text-slate-600 mb-6">
            {t.notFoundDescription}
          </p>
          <a
            href={`/${locale}/sign-in`}
            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.alreadyProcessed}
          </h1>
          <p className="text-slate-600 mb-6">
            {t.alreadyProcessedDescription}
          </p>
          <a
            href={`/${locale}/sign-in`}
            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t.signIn}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <Trees className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.title}
          </h1>
          <p className="text-slate-600">
            <span className="font-semibold">{inviterName}</span> {t.invitedYou}
          </p>
        </div>

        {/* Claim Verification Form */}
        <ClaimVerificationForm
          invitation={invitation}
          inviterName={inviterName}
          locale={locale}
        />
      </div>
    </div>
  );
}
