'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save } from 'lucide-react';

interface Props {
  initialData: any;
  userId: string;
}

export default function BasicInfoSection({ initialData, userId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    middle_name: initialData?.middle_name || '',
    maiden_name: initialData?.maiden_name || '',
    gender: initialData?.gender || '',
    birth_date: initialData?.birth_date || '',
  });

  const supabase = createClient();

  // Sync formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        middle_name: initialData.middle_name || '',
        maiden_name: initialData.maiden_name || '',
        gender: initialData.gender || '',
        birth_date: initialData.birth_date || '',
      });
    }
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(formData)
        .eq('id', userId);

      if (error) throw error;
      setIsEditing(false);
      alert('Сохранено!');
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // View mode
  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Имя:</span>
            <span className="ml-2 font-medium">{formData.first_name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Фамилия:</span>
            <span className="ml-2 font-medium">{formData.last_name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Отчество:</span>
            <span className="ml-2 font-medium">{formData.middle_name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Девичья фамилия:</span>
            <span className="ml-2 font-medium">{formData.maiden_name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Пол:</span>
            <span className="ml-2 font-medium">
              {formData.gender === 'male' ? 'Мужской' : formData.gender === 'female' ? 'Женский' : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Дата рождения:</span>
            <span className="ml-2 font-medium">{formData.birth_date || '-'}</span>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Редактировать
        </button>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-4">
      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иван"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иванов"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Отчество
          </label>
          <input
            type="text"
            value={formData.middle_name}
            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Иванович"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Девичья фамилия
          </label>
          <input
            type="text"
            value={formData.maiden_name}
            onChange={(e) => setFormData({ ...formData, maiden_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Петрова"
          />
        </div>
      </div>

      {/* Gender and Birth date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Пол
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Не указан</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата рождения
          </label>
          <input
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Если точная дата неизвестна, укажите приблизительно
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
