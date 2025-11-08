'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBloodRelationshipOptions, getGenderSpecificOptions, type Gender, type RelationshipQualifiers } from '@/lib/relationships/generateLabel';

type Step = 'type' | 'details' | 'social';

interface FormData {
  // Step 1: Type
  isDirect: boolean;
  relatedToUserId?: string;
  relatedToRelationship?: string;
  relationshipCode: string; // parent, child, sibling, aunt_uncle, etc.
  
  // Step 2: Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specificRelationship: string; // mother, father, brother, sister, etc.
  gender?: Gender;
  qualifiers?: RelationshipQualifiers; // halfness, lineage, cousin_degree, etc.
  
  // Step 3: Social (optional)
  facebookUrl?: string;
  instagramUrl?: string;
}

export default function AddRelativeForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    isDirect: true,
    relationshipCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specificRelationship: '',
  });
  
  const relationshipOptions = getBloodRelationshipOptions('ru');
  const specificOptions = formData.relationshipCode 
    ? getGenderSpecificOptions(formData.relationshipCode, 'ru')
    : [];
  
  const handleNext = () => {
    if (currentStep === 'type') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('social');
  };
  
  const handleBack = () => {
    if (currentStep === 'social') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('type');
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    // Find selected specific option to get gender and qualifiers
    const selectedOption = specificOptions.find(opt => opt.value === formData.specificRelationship);
    
    try {
      const response = await fetch('/api/relatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          relationshipType: formData.relationshipCode,
          gender: selectedOption?.gender || formData.gender,
          qualifiers: selectedOption?.qualifiers,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add relative');
      }
      
      router.push('/people');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const canProceedFromType = formData.isDirect || (formData.relatedToUserId && formData.relatedToRelationship);
  const canProceedFromDetails = formData.firstName && formData.lastName && (formData.email || formData.phone) && formData.specificRelationship;
  
  return (
    <div className="bg-white rounded-lg shadow-xl border-0 p-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep === 'type' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'type' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Тип связи</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep !== 'type' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
          <div className={`flex items-center ${currentStep === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Контакты</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full ${currentStep === 'social' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
          <div className={`flex items-center ${currentStep === 'social' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'social' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Соцсети</span>
          </div>
        </div>
      </div>
      
      {/* Step 1: Relationship Type */}
      {currentStep === 'type' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Кого вы добавляете?</h2>
            
            <div className="space-y-3">
              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="relationType"
                  checked={formData.isDirect}
                  onChange={() => setFormData({ ...formData, isDirect: true, relatedToUserId: undefined, relatedToRelationship: undefined })}
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
                  name="relationType"
                  checked={!formData.isDirect}
                  onChange={() => setFormData({ ...formData, isDirect: false })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Чей родственник?
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.relatedToUserId || ''}
                  onChange={(e) => setFormData({ ...formData, relatedToUserId: e.target.value })}
                >
                  <option value="">Выберите...</option>
                  <option value="mock-mother-id">Мама (пока моки)</option>
                  <option value="mock-father-id">Папа (пока моки)</option>
                  {/* TODO: Load from API - list of already added relatives */}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Кем приходится?
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.relatedToRelationship || ''}
                  onChange={(e) => setFormData({ ...formData, relatedToRelationship: e.target.value })}
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
          
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!canProceedFromType}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          </div>
        </div>
      )}
      
      {/* Step 2: Contact Details */}
      {currentStep === 'details' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Контактная информация</h2>
          
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип родства *
            </label>
            <select
              value={formData.relationshipCode}
              onChange={(e) => setFormData({ ...formData, relationshipCode: e.target.value, specificRelationship: '' })}
              className="w-full px-3 py-2 border rounded-md"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Конкретная связь *
              </label>
              <select
                value={formData.specificRelationship}
                onChange={(e) => setFormData({ ...formData, specificRelationship: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
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
          <div className="text-sm text-gray-600">
            * Необходимо указать имя, фамилию, тип связи и хотя бы один контакт (email или телефон)
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceedFromDetails}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Social Media */}
      {currentStep === 'social' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Социальные сети (опционально)</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Назад
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохранение...' : 'Пригласить родственника'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
