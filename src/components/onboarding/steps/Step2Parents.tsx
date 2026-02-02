'use client';

import { useState } from 'react';
import { User, Heart } from 'lucide-react';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import type { ParentsData, ParentData } from '@/lib/onboarding/wizard-state';

interface Props {
  data: ParentsData;
  onChange: (data: ParentsData) => void;
  locale: string;
}

const translations = {
  en: {
    title: 'Add your parents',
    subtitle: 'Help us understand your family connections',
    mother: 'Mother',
    father: 'Father',
    firstName: 'First Name',
    lastName: 'Last Name',
    birthYear: 'Birth Year',
    birthYearOptional: 'Optional',
    deceased: 'Deceased',
    skip: 'Unknown / Skip',
    skipHint: 'Check if you do not know this parent',
  },
  ru: {
    title: 'Добавьте родителей',
    subtitle: 'Это поможет понять ваши семейные связи',
    mother: 'Мать',
    father: 'Отец',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthYear: 'Год рождения',
    birthYearOptional: 'Необязательно',
    deceased: 'Умер(ла)',
    skip: 'Неизвестно / Пропустить',
    skipHint: 'Отметьте, если не знаете этого родителя',
  },
};

interface ParentCardProps {
  title: string;
  icon: 'mother' | 'father';
  data: ParentData;
  onChange: (data: ParentData) => void;
  t: typeof translations.en;
}

function ParentCard({ title, icon, data, onChange, t }: ParentCardProps) {
  const iconColor = icon === 'mother' ? 'text-rose-500' : 'text-blue-500';
  const bgColor = icon === 'mother' ? 'from-rose-500/10 to-rose-500/5' : 'from-blue-500/10 to-blue-500/5';
  const borderColor = icon === 'mother' ? 'border-rose-500/20' : 'border-blue-500/20';

  const handleChange = (field: keyof ParentData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <GlassCard
      glass="subtle"
      padding="md"
      className={`border-2 ${data.skip ? 'opacity-50' : ''} ${borderColor}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-border/50`}>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center`}>
          <User className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      {/* Skip checkbox */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
        <input
          type="checkbox"
          checked={data.skip || false}
          onChange={(e) => handleChange('skip', e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <span>{t.skip}</span>
      </label>

      {/* Form fields */}
      {!data.skip && (
        <div className="space-y-3">
          <FloatingInput
            id={`${icon}-firstName`}
            label={t.firstName}
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
          <FloatingInput
            id={`${icon}-lastName`}
            label={t.lastName}
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              {t.birthYear} ({t.birthYearOptional})
            </Label>
            <input
              type="number"
              min="1850"
              max={new Date().getFullYear()}
              placeholder="1960"
              value={data.birthYear || ''}
              onChange={(e) => handleChange('birthYear', e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
            <input
              type="checkbox"
              checked={data.isDeceased}
              onChange={(e) => handleChange('isDeceased', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span>{t.deceased}</span>
          </label>
        </div>
      )}
    </GlassCard>
  );
}

export default function Step2Parents({ data, onChange, locale }: Props) {
  const t = translations[locale as keyof typeof translations] || translations.en;

  const handleMotherChange = (mother: ParentData) => {
    onChange({ ...data, mother });
  };

  const handleFatherChange = (father: ParentData) => {
    onChange({ ...data, father });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      {/* Parent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <ParentCard
          title={t.mother}
          icon="mother"
          data={data.mother}
          onChange={handleMotherChange}
          t={t}
        />
        <ParentCard
          title={t.father}
          icon="father"
          data={data.father}
          onChange={handleFatherChange}
          t={t}
        />
      </div>
    </div>
  );
}
