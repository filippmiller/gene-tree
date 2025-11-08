'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBloodRelationshipOptions, getGenderSpecificOptions, type Gender, type RelationshipQualifiers } from '@/lib/relationships/generateLabel';

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
  facebookUrl?: string;
  instagramUrl?: string;
}

export default function AddRelativeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRelatives, setExistingRelatives] = useState<ExistingRelative[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    isDirect: true,
    relationshipCode: '',
    specificRelationship: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  const relationshipOptions = getBloodRelationshipOptions('ru');
  const specificOptions = formData.relationshipCode 
    ? getGenderSpecificOptions(formData.relationshipCode, 'ru')
    : [];

  // Load existing relatives for indirect relationships
  useEffect(() => {
    const fetchRelatives = async () => {
      try {
        const response = await fetch('/api/relatives');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const selectedOption = specificOptions.find(opt => opt.value === formData.specificRelationship);
    
    try {
      const response = await fetch('/api/relatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          relationshipType: formData.relationshipCode,
          gender: selectedOption?.gender,
          qualifiers: selectedOption?.qualifiers,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add relative');
      }
      
      router.push('/people');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.firstName && formData.lastName && 
                    (formData.email || formData.phone) && 
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
        <div className="grid grid-cols-2 gap-4 pl-11">
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
              {existingRelatives.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.first_name} {rel.last_name} ({rel.relationship_type})
                </option>
              ))}
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
      )}

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
          className="w-full px-3 py-2 border rounded-md"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="+7 (999) 123-45-67"
        />
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
        * Необходимо указать имя, фамилию, тип связи и хотя бы один контакт (email или телефон)
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
