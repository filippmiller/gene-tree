'use client';

import { Plus, X, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SiblingsData, SiblingData, SpouseData } from '@/lib/onboarding/wizard-state';
import type { Gender } from '@/types/database';

interface Props {
  data: SiblingsData;
  onChange: (data: SiblingsData) => void;
  locale: string;
}

const translations = {
  en: {
    title: 'Add siblings or spouse',
    subtitle: 'Expand your family tree with more connections',
    siblings: 'Siblings',
    siblingsHint: 'Brothers and sisters',
    addSibling: 'Add Sibling',
    spouse: 'Spouse',
    spouseHint: 'Husband or wife',
    addSpouse: 'Add Spouse',
    firstName: 'First Name',
    lastName: 'Last Name',
    birthYear: 'Birth Year',
    birthYearOptional: 'Optional',
    marriageYear: 'Marriage Year',
    gender: 'Gender',
    genderMale: 'Male (Brother)',
    genderFemale: 'Female (Sister)',
    remove: 'Remove',
    noSiblings: 'No siblings added yet',
    noSpouse: 'No spouse added',
    skipHint: 'You can skip this step if you prefer',
  },
  ru: {
    title: 'Добавьте братьев, сестер или супруга',
    subtitle: 'Расширьте ваше семейное древо',
    siblings: 'Братья и сестры',
    siblingsHint: 'Родные братья и сестры',
    addSibling: 'Добавить',
    spouse: 'Супруг(а)',
    spouseHint: 'Муж или жена',
    addSpouse: 'Добавить супруга',
    firstName: 'Имя',
    lastName: 'Фамилия',
    birthYear: 'Год рождения',
    birthYearOptional: 'Необязательно',
    marriageYear: 'Год свадьбы',
    gender: 'Пол',
    genderMale: 'Мужской (Брат)',
    genderFemale: 'Женский (Сестра)',
    remove: 'Удалить',
    noSiblings: 'Братья и сестры не добавлены',
    noSpouse: 'Супруг(а) не добавлен(а)',
    skipHint: 'Вы можете пропустить этот шаг',
  },
};

export default function Step3Siblings({ data, onChange, locale }: Props) {
  const t = translations[locale as keyof typeof translations] || translations.en;

  const handleAddSibling = () => {
    const newSibling: SiblingData = {
      firstName: '',
      lastName: '',
      gender: 'male',
    };
    onChange({
      ...data,
      siblings: [...data.siblings, newSibling],
    });
  };

  const handleRemoveSibling = (index: number) => {
    onChange({
      ...data,
      siblings: data.siblings.filter((_, i) => i !== index),
    });
  };

  const handleSiblingChange = (index: number, field: keyof SiblingData, value: string) => {
    const newSiblings = [...data.siblings];
    newSiblings[index] = { ...newSiblings[index], [field]: value };
    onChange({ ...data, siblings: newSiblings });
  };

  const handleAddSpouse = () => {
    onChange({
      ...data,
      spouse: {
        firstName: '',
        lastName: '',
      },
    });
  };

  const handleRemoveSpouse = () => {
    onChange({
      ...data,
      spouse: undefined,
    });
  };

  const handleSpouseChange = (field: keyof SpouseData, value: string) => {
    if (!data.spouse) return;
    onChange({
      ...data,
      spouse: { ...data.spouse, [field]: value },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Siblings Section */}
        <GlassCard glass="subtle" padding="md" className="border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.siblings}</h3>
                <p className="text-xs text-muted-foreground">{t.siblingsHint}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSibling}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t.addSibling}
            </Button>
          </div>

          {data.siblings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t.noSiblings}
            </p>
          ) : (
            <div className="space-y-4">
              {data.siblings.map((sibling, index) => (
                <div
                  key={index}
                  className="p-4 bg-background/50 rounded-lg border border-border/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <FloatingInput
                        id={`sibling-${index}-firstName`}
                        label={t.firstName}
                        value={sibling.firstName}
                        onChange={(e) =>
                          handleSiblingChange(index, 'firstName', e.target.value)
                        }
                      />
                      <FloatingInput
                        id={`sibling-${index}-lastName`}
                        label={t.lastName}
                        value={sibling.lastName}
                        onChange={(e) =>
                          handleSiblingChange(index, 'lastName', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveSibling(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {t.gender}
                      </Label>
                      <Select
                        value={sibling.gender}
                        onValueChange={(value) =>
                          handleSiblingChange(index, 'gender', value as Gender)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t.genderMale}</SelectItem>
                          <SelectItem value="female">{t.genderFemale}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        {t.birthYear} ({t.birthYearOptional})
                      </Label>
                      <input
                        type="number"
                        min="1850"
                        max={new Date().getFullYear()}
                        placeholder="1990"
                        value={sibling.birthYear || ''}
                        onChange={(e) =>
                          handleSiblingChange(index, 'birthYear', e.target.value)
                        }
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Spouse Section */}
        <GlassCard glass="subtle" padding="md" className="border-2 border-rose-500/20">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.spouse}</h3>
                <p className="text-xs text-muted-foreground">{t.spouseHint}</p>
              </div>
            </div>
            {!data.spouse && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSpouse}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t.addSpouse}
              </Button>
            )}
          </div>

          {!data.spouse ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t.noSpouse}
            </p>
          ) : (
            <div className="p-4 bg-background/50 rounded-lg border border-border/50 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <FloatingInput
                    id="spouse-firstName"
                    label={t.firstName}
                    value={data.spouse.firstName}
                    onChange={(e) => handleSpouseChange('firstName', e.target.value)}
                  />
                  <FloatingInput
                    id="spouse-lastName"
                    label={t.lastName}
                    value={data.spouse.lastName}
                    onChange={(e) => handleSpouseChange('lastName', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemoveSpouse}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t.birthYear} ({t.birthYearOptional})
                  </Label>
                  <input
                    type="number"
                    min="1850"
                    max={new Date().getFullYear()}
                    placeholder="1985"
                    value={data.spouse.birthYear || ''}
                    onChange={(e) => handleSpouseChange('birthYear', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t.marriageYear} ({t.birthYearOptional})
                  </Label>
                  <input
                    type="number"
                    min="1850"
                    max={new Date().getFullYear()}
                    placeholder="2010"
                    value={data.spouse.marriageYear || ''}
                    onChange={(e) => handleSpouseChange('marriageYear', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <p className="text-xs text-muted-foreground text-center">{t.skipHint}</p>
      </div>
    </div>
  );
}
