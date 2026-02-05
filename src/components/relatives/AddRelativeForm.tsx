'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getBloodRelationshipOptions, getGenderSpecificOptions } from '@/lib/relationships/generateLabel';
import KinshipSearchField from './KinshipSearchField';
import { mapRuLabelToRelationship } from '@/lib/relationships/kinshipMapping';
import InviteGuardAlert, { type InviteCheckResult } from './InviteGuardAlert';

interface ExistingRelative {
  id: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
}

interface FormData {
  isDirect: boolean;
  relatedToUserId?: string;
  relatedToRelationship?: string;
  relationshipCode: string;
  specificRelationship: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  isDeceased: boolean;
  knowsBirthDate: boolean;
  dateOfBirth?: string;
}

export default function AddRelativeForm() {
  const searchParams = useSearchParams();
  const relatedToParam = searchParams.get('relatedTo');
  const params = useParams();
  const locale = (params.locale as string) || 'ru';
  const router = useRouter();
  const t = useTranslations('addRelative');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRelatives, setExistingRelatives] = useState<ExistingRelative[]>([]);

  // Smart Invite Guard state
  const [inviteCheck, setInviteCheck] = useState<InviteCheckResult | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    isDirect: relatedToParam ? false : true,
    relatedToUserId: relatedToParam || undefined,
    relationshipCode: '',
    specificRelationship: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    smsConsent: false,
    isDeceased: false,
    knowsBirthDate: false,
    dateOfBirth: undefined,
  });

  const relationshipOptions = getBloodRelationshipOptions(locale as 'en' | 'ru');
  const specificOptions = formData.relationshipCode
    ? getGenderSpecificOptions(formData.relationshipCode, locale as 'en' | 'ru')
    : [];

  // Load existing relatives for indirect relationships
  useEffect(() => {
    const fetchRelatives = async () => {
      try {
        const response = await fetch('/api/relatives', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setExistingRelatives(data);
        }
      } catch (err) {
        console.error('Failed to fetch existing relatives:', err);
      }
    };

    if (!formData.isDirect) {
      fetchRelatives();
    }
  }, [formData.isDirect]);

  // Get prefilled relative name for UI
  const prefilledRelative = existingRelatives.find(r => r.id === relatedToParam);
  const prefilledName = prefilledRelative
    ? [prefilledRelative.first_name, prefilledRelative.last_name].filter(Boolean).join(' ')
    : '';

  // Debounced invite eligibility check
  useEffect(() => {
    // Skip check for deceased relatives (no invitation will be sent)
    if (formData.isDeceased) {
      setInviteCheck(null);
      return;
    }

    const email = formData.email?.trim() || '';
    const phone = formData.phone?.trim() || '';

    // Clear check if no contact info
    if (!email && !phone) {
      setInviteCheck(null);
      return;
    }

    // Only check if we have valid-looking email or phone
    const hasValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasValidPhone = phone && /^[\d\s()+-]{10,}$/.test(phone);

    if (!hasValidEmail && !hasValidPhone) {
      setInviteCheck(null);
      return;
    }

    const checkEligibility = async () => {
      setIsCheckingInvite(true);
      try {
        const res = await fetch('/api/invitations/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: hasValidEmail ? email : undefined,
            phone: hasValidPhone ? phone : undefined,
          }),
        });

        if (res.ok) {
          const data: InviteCheckResult = await res.json();
          setInviteCheck(data);
        } else {
          // On error, clear check and allow form to proceed
          setInviteCheck(null);
        }
      } catch {
        // On network error, clear check and allow form to proceed
        setInviteCheck(null);
      } finally {
        setIsCheckingInvite(false);
      }
    };

    // Debounce the check by 500ms
    const timeout = setTimeout(checkEligibility, 500);
    return () => clearTimeout(timeout);
  }, [formData.email, formData.phone, formData.isDeceased]);

  // Invite Guard action handlers
  const handleSendReminder = useCallback(async (inviteId: string) => {
    try {
      const res = await fetch('/api/invitations/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      if (res.ok) {
        // Clear the check after successful reminder
        setInviteCheck(null);
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || t('failedToSendReminder'));
      }
    } catch {
      setError(t('networkErrorReminder'));
    }
  }, []);

  const handleSendBridgeRequest = useCallback(async () => {
    try {
      const res = await fetch('/api/relatives/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          relationshipType: formData.relationshipCode,
        }),
      });

      if (res.ok) {
        // Redirect to people page after successful bridge request
        router.push(`/${locale}/people`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || t('failedToSendBridge'));
      }
    } catch {
      setError(t('networkErrorBridge'));
    }
  }, [formData.email, formData.phone, formData.relationshipCode, locale, router]);

  const handleDismissInviteCheck = useCallback(() => {
    setInviteCheck(null);
  }, []);

  const validateForm = () => {
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('invalidEmail'));
      return false;
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s()+-]{10,}$/.test(formData.phone)) {
      setError(t('invalidPhone'));
      return false;
    }

    // Contact required only if not deceased
    if (!formData.isDeceased && !formData.email && !formData.phone) {
      setError(t('provideContact'));
      return false;
    }

    if (!formData.isDeceased && formData.phone && !formData.email && !formData.smsConsent) {
      setError(t('smsConsentRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const selectedOption = specificOptions.find(opt => opt.value === formData.specificRelationship);

    try {
      const response = await fetch('/api/relatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          locale,
          relationshipType: formData.relationshipCode,
          gender: selectedOption?.gender,
          qualifiers: selectedOption?.qualifiers,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(t('serverError'));
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add relative');
      }

      router.push(`/${locale}/people`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailValid = !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isPhoneValid = !formData.phone || /^[\d\s()+-]{10,}$/.test(formData.phone);
  const phoneUsable = Boolean(formData.phone && isPhoneValid && (formData.smsConsent || formData.email));
  const emailUsable = Boolean(formData.email && isEmailValid);
  const hasValidContact = formData.isDeceased || emailUsable || phoneUsable;

  // Check if invite guard allows submission
  const inviteBlocked = inviteCheck !== null &&
    inviteCheck.status !== 'OK_TO_INVITE';

  const canSubmit = formData.firstName && formData.lastName &&
    hasValidContact &&
    formData.specificRelationship &&
    (formData.isDirect || (formData.relatedToUserId && formData.relatedToRelationship)) &&
    !inviteBlocked &&
    !isCheckingInvite;

  const selectedOption = specificOptions.find(opt => opt.value === formData.specificRelationship);
  const relationshipLabel = selectedOption?.label || '';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl border-0 p-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('whoAreYouAdding')}</h2>

        <div className="space-y-3">
          <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="radio"
              checked={formData.isDirect}
              onChange={() => setFormData({
                isDirect: true,
                relationshipCode: '',
                specificRelationship: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                smsConsent: false,
                isDeceased: false,
                knowsBirthDate: false,
                dateOfBirth: undefined,
              })}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium">{t('directRelative')}</div>
              <div className="text-sm text-gray-600">{t('directRelativeHint')}</div>
            </div>
          </label>

          <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="radio"
              checked={!formData.isDirect}
              onChange={() => setFormData({
                isDirect: false,
                relationshipCode: '',
                specificRelationship: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                smsConsent: false,
                isDeceased: false,
                knowsBirthDate: false,
                dateOfBirth: undefined,
              })}
              className="mt-1 mr-3"
            />
            <div>
              <div className="font-medium">{t('indirectRelative')}</div>
              <div className="text-sm text-gray-600">{t('indirectRelativeHint')}</div>
            </div>
          </label>
        </div>
      </div>

      {!formData.isDirect && (
        <div className="space-y-4 pl-11">
          {prefilledName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-sm font-medium text-blue-900">
                {t('addingRelativesFor', { name: prefilledName })}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('whoseRelative')} *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.relatedToUserId || ''}
                onChange={(e) => setFormData({ ...formData, relatedToUserId: e.target.value })}
                required={!formData.isDirect}
              >
                <option value="">{t('select')}</option>
                {existingRelatives.length === 0 ? (
                  <option disabled>{t('addDirectRelativesFirst')}</option>
                ) : (
                  existingRelatives.map((rel) => (
                    <option key={rel.id} value={rel.id}>
                      {rel.first_name} {rel.last_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('howRelated')} *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.relatedToRelationship || ''}
                onChange={(e) => setFormData({ ...formData, relatedToRelationship: e.target.value })}
                required={!formData.isDirect}
              >
                <option value="">{t('select')}</option>
                <option value="sibling">{t('indirectTypes.sibling')}</option>
                <option value="child">{t('indirectTypes.child')}</option>
                <option value="parent">{t('indirectTypes.parent')}</option>
                <option value="spouse">{t('indirectTypes.spouse')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Kinship search by Russian phrase - only shown for Russian locale */}
      {locale === 'ru' && (
        <KinshipSearchField
          userId={formData.relatedToUserId}
          onRelationshipFound={(pathExpr, canonicalLabel) => {
            const mapped = mapRuLabelToRelationship(canonicalLabel || '');
            if (mapped) {
              setFormData(prev => ({
                ...prev,
                relationshipCode: mapped.relationshipCode,
                specificRelationship: mapped.specificValue,
              }));
            } else {
              console.warn('Kinship mapping not recognized for label:', canonicalLabel, 'path:', pathExpr);
            }
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('relationshipType')} *
          </label>
          <select
            value={formData.relationshipCode}
            onChange={(e) => setFormData({
              ...formData,
              relationshipCode: e.target.value,
              specificRelationship: ''
            })}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">{t('selectType')}</option>
            {relationshipOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {formData.relationshipCode && specificOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('specificRelationship')} *
            </label>
            <select
              value={formData.specificRelationship}
              onChange={(e) => setFormData({ ...formData, specificRelationship: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">{t('select')}</option>
              {specificOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {relationshipLabel && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <span className="font-medium">{t('adding')}</span> {relationshipLabel}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('firstName')} *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder={t('firstNamePlaceholder')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('lastName')} *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder={t('lastNamePlaceholder')}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('email')}
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${formData.email && !isEmailValid ? 'border-red-500 bg-red-50' : ''
            }`}
          placeholder={t('emailPlaceholder')}
        />
        {formData.email && !isEmailValid && (
          <p className="text-xs text-red-600 mt-1">{t('invalidEmail')}</p>
        )}
        {formData.email && isEmailValid && !formData.isDeceased && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('emailInviteHint')}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('phone')}
        </label>
        <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const nextPhone = e.target.value;
              setFormData({
                ...formData,
                phone: nextPhone,
                smsConsent: nextPhone ? formData.smsConsent : false,
              });
            }}
            className={`w-full px-3 py-2 border rounded-md ${formData.phone && !isPhoneValid ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder={t('phonePlaceholder')}
        />
        {formData.phone && !isPhoneValid && (
          <p className="text-xs text-red-600 mt-1">{t('invalidPhone')}</p>
        )}
        {!formData.isDeceased && formData.phone && isPhoneValid && (
          <div className="mt-2">
            <label className="flex items-start space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.smsConsent}
                onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                className="mt-1"
              />
              <span>{t('smsConsent')}</span>
            </label>
            {!formData.email && !formData.smsConsent && (
              <p className="text-xs text-amber-700 mt-1">
                {t('smsConsentWarning')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Smart Invite Guard Alert */}
      {!formData.isDeceased && (
        <div className="relative">
          {isCheckingInvite && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-md z-10">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('checking')}
              </div>
            </div>
          )}
          <InviteGuardAlert
            result={inviteCheck}
            onSendReminder={handleSendReminder}
            onSendBridgeRequest={handleSendBridgeRequest}
            onDismiss={handleDismissInviteCheck}
          />
        </div>
      )}

      <div className="border-t pt-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isDeceased}
            onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">{t('inMemory')}</span>
        </label>
        {formData.isDeceased && (
          <p className="text-xs text-gray-500 mt-1 ml-7">
            {t('inMemoryHint')}
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.knowsBirthDate}
            onChange={(e) => setFormData({ ...formData, knowsBirthDate: e.target.checked, dateOfBirth: e.target.checked ? formData.dateOfBirth : undefined })}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">{t('knowsBirthDate')}</span>
        </label>
        {formData.knowsBirthDate && (
          <div className="mt-3 ml-7">
            <input
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('birthDateHint')}
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('socialMedia')}</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('facebookProfile')}
            </label>
            <input
              type="url"
              value={formData.facebookUrl || ''}
              onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('facebookPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('instagramProfile')}
            </label>
            <input
              type="url"
              value={formData.instagramUrl || ''}
              onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('instagramPlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        {formData.isDeceased ? t('requiredFieldsNoteDeceased') : t('requiredFieldsNote')}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex-1 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('saving') : t('inviteRelative')}
        </button>
      </div>
    </form>
  );
}
