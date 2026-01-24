'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { getBloodRelationshipOptions, getGenderSpecificOptions } from '@/lib/relationships/generateLabel';
import KinshipSearchField from './KinshipSearchField';
import { mapRuLabelToRelationship } from '@/lib/relationships/kinshipMapping';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRelatives, setExistingRelatives] = useState<ExistingRelative[]>([]);

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

  const relationshipOptions = getBloodRelationshipOptions('ru');
  const specificOptions = formData.relationshipCode
    ? getGenderSpecificOptions(formData.relationshipCode)
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

  const validateForm = () => {
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Неправильный формат email');
      return false;
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s()+-]{10,}$/.test(formData.phone)) {
      setError('Неправильный формат телефона');
      return false;
    }

    // Contact required only if not deceased
    if (!formData.isDeceased && !formData.email && !formData.phone) {
      setError('Укажите хотя бы один контакт (email или телефон)');
      return false;
    }

    if (!formData.isDeceased && formData.phone && !formData.email && !formData.smsConsent) {
      setError('Для SMS-приглашения нужно подтвердить согласие');
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
        throw new Error('Ошибка сервера. Попробуйте позже.');
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

  const canSubmit = formData.firstName && formData.lastName &&
    hasValidContact &&
    formData.specificRelationship &&
    (formData.isDirect || (formData.relatedToUserId && formData.relatedToRelationship));

  const selectedOption = specificOptions.find(opt => opt.value === formData.specificRelationship);
  const relationshipLabel = selectedOption?.label || '';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl border-0 p-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Кого вы добавляете?</h2>

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
              <div className="font-medium">Прямого родственника</div>
              <div className="text-sm text-gray-600">Мама, папа, брат, сестра, супруг(а) и т.д.</div>
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
              <div className="font-medium">Родственника моего родственника</div>
              <div className="text-sm text-gray-600">Например, брат мамы, дочь сестры и т.д.</div>
            </div>
          </label>
        </div>
      </div>

      {!formData.isDirect && (
        <div className="space-y-4 pl-11">
          {prefilledName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-sm font-medium text-blue-900">
                Добавляем родственников для: {prefilledName}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Чей родственник? *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.relatedToUserId || ''}
                onChange={(e) => setFormData({ ...formData, relatedToUserId: e.target.value })}
                required={!formData.isDirect}
              >
                <option value="">Выберите...</option>
                {existingRelatives.length === 0 ? (
                  <option disabled>Сначала добавьте прямых родственников</option>
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
                Кем приходится? *
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.relatedToRelationship || ''}
                onChange={(e) => setFormData({ ...formData, relatedToRelationship: e.target.value })}
                required={!formData.isDirect}
              >
                <option value="">Выберите...</option>
                <option value="sibling">Брат/Сестра</option>
                <option value="child">Сын/Дочь</option>
                <option value="parent">Родитель</option>
                <option value="spouse">Супруг(а)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Kinship search by Russian phrase */}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип родства *
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
            <option value="">Выберите тип...</option>
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
              Конкретная связь *
            </label>
            <select
              value={formData.specificRelationship}
              onChange={(e) => setFormData({ ...formData, specificRelationship: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Выберите...</option>
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
          <span className="font-medium">Добавляем:</span> {relationshipLabel}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Иван"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Иванов"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${formData.email && !isEmailValid ? 'border-red-500 bg-red-50' : ''
            }`}
          placeholder="email@example.com"
        />
        {formData.email && !isEmailValid && (
          <p className="text-xs text-red-600 mt-1">Неправильный формат email</p>
        )}
        {formData.email && isEmailValid && !formData.isDeceased && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            На этот адрес будет отправлено приглашение присоединиться к дереву
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон
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
            placeholder="+7 (999) 123-45-67"
        />
        {formData.phone && !isPhoneValid && (
          <p className="text-xs text-red-600 mt-1">Неправильный формат телефона</p>
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
              <span>Я подтверждаю, что имею разрешение отправить SMS на этот номер</span>
            </label>
            {!formData.email && !formData.smsConsent && (
              <p className="text-xs text-amber-700 mt-1">
                Без согласия SMS приглашение не будет отправлено
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isDeceased}
            onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">В память об ушедшем</span>
        </label>
        {formData.isDeceased && (
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Профиль будет создан для сохранения памяти. Email и телефон необязательны.
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
          <span className="text-sm font-medium text-gray-700">Вы знаете дату рождения?</span>
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
              Пользователь сможет подтвердить или исправить дату при получении приглашения
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Социальные сети (опционально)</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Facebook профиль
            </label>
            <input
              type="url"
              value={formData.facebookUrl || ''}
              onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Instagram профиль
            </label>
            <input
              type="url"
              value={formData.instagramUrl || ''}
              onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        * Необходимо указать имя, фамилию, тип связи{!formData.isDeceased && ' и хотя бы один контакт (email или телефон)'}
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
          Отмена
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="flex-1 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Сохранение...' : 'Пригласить родственника'}
        </button>
      </div>
    </form>
  );
}
