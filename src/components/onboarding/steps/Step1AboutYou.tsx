'use client';

import { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AboutYouData } from '@/lib/onboarding/wizard-state';
import type { Gender } from '@/types/database';

interface Props {
  data: AboutYouData;
  onChange: (data: AboutYouData) => void;
  locale: string;
}

const translations = {
  en: {
    title: 'Tell us about yourself',
    subtitle: 'This helps personalize your family tree experience',
    firstName: 'First Name',
    lastName: 'Last Name',
    birthDate: 'Birth Date',
    birthDateOptional: 'Optional',
    gender: 'Gender',
    genderOptional: 'Optional',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    genderUnknown: 'Prefer not to say',
    uploadPhoto: 'Upload Photo',
    changePhoto: 'Change',
    photoHint: 'Add a profile photo to help family members recognize you',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
  },
  ru: {
    title: 'Расскажите о себе',
    subtitle: 'Это поможет персонализировать ваше семейное древо',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthDate: 'Дата рождения',
    birthDateOptional: 'Необязательно',
    gender: 'Пол',
    genderOptional: 'Необязательно',
    genderMale: 'Мужской',
    genderFemale: 'Женский',
    genderOther: 'Другой',
    genderUnknown: 'Не указывать',
    uploadPhoto: 'Загрузить фото',
    changePhoto: 'Изменить',
    photoHint: 'Добавьте фото профиля, чтобы родственники могли вас узнать',
    firstNameRequired: 'Имя обязательно',
    lastNameRequired: 'Фамилия обязательна',
  },
};

export default function Step1AboutYou({ data, onChange, locale }: Props) {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({
        ...data,
        avatarFile: file,
        avatarPreview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field: keyof AboutYouData, value: string) => {
    onChange({ ...data, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      {/* Photo Upload */}
      <div className="flex flex-col items-center gap-4">
        <div
          role="button"
          tabIndex={0}
          aria-label={data.avatarPreview ? t.changePhoto : t.uploadPhoto}
          className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/20 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {data.avatarPreview ? (
            <img
              src={data.avatarPreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/40">
              <User className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
          aria-label={t.uploadPhoto}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {data.avatarPreview ? t.changePhoto : t.uploadPhoto}
        </Button>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {t.photoHint}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FloatingInput
              id="firstName"
              label={t.firstName}
              value={data.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={errors.firstName}
              data-testid="onboarding-firstName"
            />
          </div>
          <div>
            <FloatingInput
              id="lastName"
              label={t.lastName}
              value={data.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={errors.lastName}
              data-testid="onboarding-lastName"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            {t.birthDate} <span className="text-xs">({t.birthDateOptional})</span>
          </Label>
          <input
            type="date"
            value={data.birthDate || ''}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            aria-label={t.birthDate}
            className="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            data-testid="onboarding-birthDate"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            {t.gender} <span className="text-xs">({t.genderOptional})</span>
          </Label>
          <Select
            value={data.gender || ''}
            onValueChange={(value) => handleInputChange('gender', value as Gender)}
          >
            <SelectTrigger data-testid="onboarding-gender">
              <SelectValue placeholder={t.genderOptional} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t.genderMale}</SelectItem>
              <SelectItem value="female">{t.genderFemale}</SelectItem>
              <SelectItem value="other">{t.genderOther}</SelectItem>
              <SelectItem value="unknown">{t.genderUnknown}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
