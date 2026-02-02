'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, User, Calendar, Mail, Phone, Users, Loader2 } from 'lucide-react';

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

interface ClaimVerificationFormProps {
  invitation: PendingRelative;
  inviterName: string;
  locale: string;
}

// Translations for EN/RU
const translations = {
  en: {
    title: 'Verify Your Information',
    subtitle: 'Please confirm these details are correct before joining the family tree',
    yourDetails: 'Your Details',
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    email: 'Email',
    phone: 'Phone',
    relationship: 'Relationship',
    optional: '(optional)',
    confirmAccept: 'Confirm & Accept',
    editInfo: 'Edit Information',
    notMe: 'This Isn\'t Me',
    notMeDescription: 'If this information doesn\'t describe you, let the inviter know',
    processing: 'Processing...',
    saving: 'Saving...',
    cancel: 'Cancel',
    saveChanges: 'Save & Continue',
    reasonPlaceholder: 'Please explain why this isn\'t you (optional but helpful)',
    reasonLabel: 'Reason',
    notifying: 'Notifying...',
    confirmNotMe: 'Send Notification',
    invitedAs: 'You were invited as',
    invitedBy: 'Invited by',
    errorGeneric: 'Something went wrong. Please try again.',
    successNotified: 'The inviter has been notified. Thank you!',
    infoNote: 'After confirming, you\'ll receive a magic link to sign in instantly - no password needed!',
    relationshipTypes: {
      parent: 'Parent',
      child: 'Child',
      spouse: 'Spouse',
      sibling: 'Sibling',
      grandparent: 'Grandparent',
      grandchild: 'Grandchild',
      aunt_uncle: 'Aunt/Uncle',
      niece_nephew: 'Niece/Nephew',
      cousin: 'Cousin',
    },
  },
  ru: {
    title: 'Подтвердите ваши данные',
    subtitle: 'Пожалуйста, проверьте правильность информации перед присоединением к семейному древу',
    yourDetails: 'Ваши данные',
    firstName: 'Имя',
    lastName: 'Фамилия',
    dateOfBirth: 'Дата рождения',
    email: 'Email',
    phone: 'Телефон',
    relationship: 'Родство',
    optional: '(необязательно)',
    confirmAccept: 'Подтвердить и принять',
    editInfo: 'Исправить данные',
    notMe: 'Это не я',
    notMeDescription: 'Если эта информация не о вас, сообщите пригласившему',
    processing: 'Обработка...',
    saving: 'Сохранение...',
    cancel: 'Отмена',
    saveChanges: 'Сохранить и продолжить',
    reasonPlaceholder: 'Пожалуйста, объясните почему это не вы (необязательно, но полезно)',
    reasonLabel: 'Причина',
    notifying: 'Уведомление...',
    confirmNotMe: 'Отправить уведомление',
    invitedAs: 'Вас пригласили как',
    invitedBy: 'Пригласил(а)',
    errorGeneric: 'Что-то пошло не так. Попробуйте ещё раз.',
    successNotified: 'Пригласивший уведомлён. Спасибо!',
    infoNote: 'После подтверждения вы получите магическую ссылку для мгновенного входа - без пароля!',
    relationshipTypes: {
      parent: 'Родитель',
      child: 'Ребёнок',
      spouse: 'Супруг(а)',
      sibling: 'Брат/Сестра',
      grandparent: 'Дедушка/Бабушка',
      grandchild: 'Внук/Внучка',
      aunt_uncle: 'Дядя/Тётя',
      niece_nephew: 'Племянник/Племянница',
      cousin: 'Кузен/Кузина',
    },
  },
};

type ViewMode = 'view' | 'edit' | 'dispute';

export default function ClaimVerificationForm({
  invitation,
  inviterName,
  locale,
}: ClaimVerificationFormProps) {
  const router = useRouter();
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [mode, setMode] = useState<ViewMode>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState(invitation.first_name || '');
  const [lastName, setLastName] = useState(invitation.last_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(invitation.date_of_birth || '');

  // Dispute reason
  const [disputeReason, setDisputeReason] = useState('');

  const getRelationshipLabel = (type: string): string => {
    const types = t.relationshipTypes as Record<string, string>;
    return types[type] || type;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Handle verification and acceptance
   */
  const handleVerifyAndAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/verify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.invitation_token,
          action: 'accept',
          corrections: mode === 'edit' ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: dateOfBirth || null,
          } : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorGeneric);
      }

      // Redirect to magic link page for zero-friction auth
      const redirectUrl = invitation.email
        ? `/${locale}/magic-link?email=${encodeURIComponent(invitation.email)}&redirect=${encodeURIComponent(`/${locale}/app`)}`
        : `/${locale}/magic-link?redirect=${encodeURIComponent(`/${locale}/app`)}`;

      router.push(redirectUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.errorGeneric;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "This isn't me" notification
   */
  const handleNotMe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/verify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.invitation_token,
          action: 'dispute',
          reason: disputeReason.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorGeneric);
      }

      setSuccess(t.successNotified);

      // Redirect to home after a delay
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.errorGeneric;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <p className="font-medium">{success}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Context */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span>{t.invitedBy}: <strong>{inviterName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{t.invitedAs}: <strong>{getRelationshipLabel(invitation.relationship_type)}</strong></span>
            </div>
          </div>

          {/* VIEW MODE */}
          {mode === 'view' && (
            <>
              {/* Display Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">{t.yourDetails}</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm">{t.firstName}</Label>
                    <p className="font-medium">{invitation.first_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm">{t.lastName}</Label>
                    <p className="font-medium">{invitation.last_name || '-'}</p>
                  </div>
                </div>

                {invitation.date_of_birth && (
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t.dateOfBirth}
                    </Label>
                    <p className="font-medium">{formatDate(invitation.date_of_birth)}</p>
                  </div>
                )}

                {invitation.email && (
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t.email}
                    </Label>
                    <p className="font-medium">{invitation.email}</p>
                  </div>
                )}

                {invitation.phone && (
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {t.phone}
                    </Label>
                    <p className="font-medium">{invitation.phone}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleVerifyAndAccept}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t.confirmAccept}
                    </>
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setMode('edit')}
                    disabled={loading}
                    className="flex-1"
                  >
                    {t.editInfo}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setMode('dispute')}
                    disabled={loading}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {t.notMe}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* EDIT MODE */}
          {mode === 'edit' && (
            <>
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">{t.yourDetails}</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t.firstName} *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t.lastName} *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    {t.dateOfBirth} {t.optional}
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleVerifyAndAccept}
                  disabled={loading || !firstName.trim() || !lastName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    t.saveChanges
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFirstName(invitation.first_name || '');
                    setLastName(invitation.last_name || '');
                    setDateOfBirth(invitation.date_of_birth || '');
                    setMode('view');
                  }}
                  disabled={loading}
                >
                  {t.cancel}
                </Button>
              </div>
            </>
          )}

          {/* DISPUTE MODE */}
          {mode === 'dispute' && (
            <>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{t.notMeDescription}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disputeReason">{t.reasonLabel}</Label>
                  <Textarea
                    id="disputeReason"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder={t.reasonPlaceholder}
                    disabled={loading}
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleNotMe}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.notifying}
                    </>
                  ) : (
                    t.confirmNotMe
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDisputeReason('');
                    setMode('view');
                  }}
                  disabled={loading}
                >
                  {t.cancel}
                </Button>
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      {mode !== 'dispute' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{t.infoNote}</p>
        </div>
      )}
    </div>
  );
}
