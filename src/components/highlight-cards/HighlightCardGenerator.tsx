'use client';

/**
 * HighlightCardGenerator Component
 *
 * Full-featured component for creating and customizing highlight cards.
 * Combines card type selection, data input, preview, and sharing.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Cake,
  Heart,
  Calendar,
  Trophy,
  TreePine,
  Sparkles,
} from 'lucide-react';
import { CardPreview } from './CardPreview';
import type {
  HighlightCardData,
  HighlightCardType,
  BirthdayCardData,
  AnniversaryCardData,
  MemoryCardData,
  MilestoneCardData,
  FamilyStatsCardData,
  CardTheme,
} from '@/types/highlight-cards';

interface HighlightCardGeneratorProps {
  /** Pre-fill with profile data */
  initialData?: Partial<HighlightCardData>;
  /** Default card type */
  defaultType?: HighlightCardType;
  /** Callback when card is generated */
  onGenerate?: (data: HighlightCardData) => void;
  /** Additional CSS classes */
  className?: string;
}

const CARD_TYPE_CONFIG: Record<
  HighlightCardType,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultTheme: CardTheme;
  }
> = {
  birthday: {
    label: 'Birthday',
    description: 'Celebrate a birthday with a festive card',
    icon: <Cake className="w-5 h-5" />,
    defaultTheme: 'warm-sunset',
  },
  anniversary: {
    label: 'Anniversary',
    description: 'Mark a special anniversary milestone',
    icon: <Heart className="w-5 h-5" />,
    defaultTheme: 'royal-violet',
  },
  memory: {
    label: 'Memory',
    description: '"On This Day" memory cards',
    icon: <Calendar className="w-5 h-5" />,
    defaultTheme: 'ocean-breeze',
  },
  milestone: {
    label: 'Milestone',
    description: 'Celebrate achievements and milestones',
    icon: <Trophy className="w-5 h-5" />,
    defaultTheme: 'forest-dawn',
  },
  'family-stats': {
    label: 'Family Stats',
    description: 'Share your family tree statistics',
    icon: <TreePine className="w-5 h-5" />,
    defaultTheme: 'royal-violet',
  },
};

export function HighlightCardGenerator({
  initialData,
  defaultType = 'birthday',
  onGenerate,
  className = '',
}: HighlightCardGeneratorProps) {
  const [cardType, setCardType] = useState<HighlightCardType>(defaultType);
  const [showPreview, setShowPreview] = useState(false);

  // Form states for each card type
  const [birthdayForm, setBirthdayForm] = useState({
    personName: initialData?.personName || '',
    age: 1,
    birthDate: new Date().toISOString().split('T')[0],
    message: '',
    photoUrl: initialData?.photoUrl || '',
  });

  const [anniversaryForm, setAnniversaryForm] = useState({
    personName: initialData?.personName || '',
    partnerName: '',
    years: 1,
    anniversaryDate: new Date().toISOString().split('T')[0],
    message: '',
    photoUrl: initialData?.photoUrl || '',
    partnerPhotoUrl: '',
  });

  const [memoryForm, setMemoryForm] = useState({
    personName: initialData?.personName || '',
    year: new Date().getFullYear() - 10,
    description: '',
    eventType: 'other' as const,
    photoUrl: initialData?.photoUrl || '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    personName: initialData?.personName || '',
    title: '',
    subtitle: '',
    icon: 'star' as const,
    photoUrl: initialData?.photoUrl || '',
  });

  const [familyStatsForm, setFamilyStatsForm] = useState({
    personName: initialData?.personName || '',
    totalMembers: 10,
    generations: 3,
    countriesRepresented: 1,
  });

  // Build card data from form
  const buildCardData = useCallback((): HighlightCardData | null => {
    const config = CARD_TYPE_CONFIG[cardType];

    switch (cardType) {
      case 'birthday':
        if (!birthdayForm.personName) return null;
        return {
          type: 'birthday',
          personName: birthdayForm.personName,
          age: birthdayForm.age,
          birthDate: birthdayForm.birthDate,
          message: birthdayForm.message || undefined,
          photoUrl: birthdayForm.photoUrl || undefined,
          theme: config.defaultTheme,
        };

      case 'anniversary':
        if (!anniversaryForm.personName || !anniversaryForm.partnerName) return null;
        return {
          type: 'anniversary',
          personName: anniversaryForm.personName,
          partnerName: anniversaryForm.partnerName,
          years: anniversaryForm.years,
          anniversaryDate: anniversaryForm.anniversaryDate,
          message: anniversaryForm.message || undefined,
          photoUrl: anniversaryForm.photoUrl || undefined,
          partnerPhotoUrl: anniversaryForm.partnerPhotoUrl || undefined,
          theme: config.defaultTheme,
        };

      case 'memory':
        if (!memoryForm.personName || !memoryForm.description) return null;
        return {
          type: 'memory',
          personName: memoryForm.personName,
          year: memoryForm.year,
          description: memoryForm.description,
          eventType: memoryForm.eventType,
          photoUrl: memoryForm.photoUrl || undefined,
          theme: config.defaultTheme,
        };

      case 'milestone':
        if (!milestoneForm.personName || !milestoneForm.title) return null;
        return {
          type: 'milestone',
          personName: milestoneForm.personName,
          title: milestoneForm.title,
          subtitle: milestoneForm.subtitle || undefined,
          icon: milestoneForm.icon,
          photoUrl: milestoneForm.photoUrl || undefined,
          theme: config.defaultTheme,
        };

      case 'family-stats':
        if (!familyStatsForm.personName) return null;
        return {
          type: 'family-stats',
          personName: familyStatsForm.personName,
          totalMembers: familyStatsForm.totalMembers,
          generations: familyStatsForm.generations,
          countriesRepresented: familyStatsForm.countriesRepresented,
          theme: config.defaultTheme,
        };

      default:
        return null;
    }
  }, [cardType, birthdayForm, anniversaryForm, memoryForm, milestoneForm, familyStatsForm]);

  const handleGeneratePreview = () => {
    const cardData = buildCardData();
    if (cardData) {
      setShowPreview(true);
      onGenerate?.(cardData);
    }
  };

  const cardData = buildCardData();

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Card Type Selection */}
      <Tabs
        value={cardType}
        onValueChange={(v) => {
          setCardType(v as HighlightCardType);
          setShowPreview(false);
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 w-full">
          {(Object.keys(CARD_TYPE_CONFIG) as HighlightCardType[]).map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {CARD_TYPE_CONFIG[type].icon}
              <span className="hidden sm:inline">{CARD_TYPE_CONFIG[type].label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Birthday Form */}
        <TabsContent value="birthday" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="w-5 h-5" />
                Birthday Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthday-name">Name</Label>
                  <Input
                    id="birthday-name"
                    value={birthdayForm.personName}
                    onChange={(e) =>
                      setBirthdayForm((f) => ({ ...f, personName: e.target.value }))
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday-age">Age</Label>
                  <Input
                    id="birthday-age"
                    type="number"
                    min={1}
                    max={150}
                    value={birthdayForm.age}
                    onChange={(e) =>
                      setBirthdayForm((f) => ({ ...f, age: parseInt(e.target.value) || 1 }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday-message">Personal Message (optional)</Label>
                <Textarea
                  id="birthday-message"
                  value={birthdayForm.message}
                  onChange={(e) =>
                    setBirthdayForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Add a personal birthday message..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday-photo">Photo URL (optional)</Label>
                <Input
                  id="birthday-photo"
                  value={birthdayForm.photoUrl}
                  onChange={(e) =>
                    setBirthdayForm((f) => ({ ...f, photoUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anniversary Form */}
        <TabsContent value="anniversary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Anniversary Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anniversary-name1">First Person</Label>
                  <Input
                    id="anniversary-name1"
                    value={anniversaryForm.personName}
                    onChange={(e) =>
                      setAnniversaryForm((f) => ({ ...f, personName: e.target.value }))
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anniversary-name2">Second Person</Label>
                  <Input
                    id="anniversary-name2"
                    value={anniversaryForm.partnerName}
                    onChange={(e) =>
                      setAnniversaryForm((f) => ({ ...f, partnerName: e.target.value }))
                    }
                    placeholder="Enter partner name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anniversary-years">Years</Label>
                <Input
                  id="anniversary-years"
                  type="number"
                  min={1}
                  max={100}
                  value={anniversaryForm.years}
                  onChange={(e) =>
                    setAnniversaryForm((f) => ({
                      ...f,
                      years: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anniversary-message">Personal Message (optional)</Label>
                <Textarea
                  id="anniversary-message"
                  value={anniversaryForm.message}
                  onChange={(e) =>
                    setAnniversaryForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Add a personal message..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Form */}
        <TabsContent value="memory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Memory Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memory-name">Person Name</Label>
                  <Input
                    id="memory-name"
                    value={memoryForm.personName}
                    onChange={(e) =>
                      setMemoryForm((f) => ({ ...f, personName: e.target.value }))
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory-year">Year</Label>
                  <Input
                    id="memory-year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={memoryForm.year}
                    onChange={(e) =>
                      setMemoryForm((f) => ({
                        ...f,
                        year: parseInt(e.target.value) || 2020,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory-description">Description</Label>
                <Textarea
                  id="memory-description"
                  value={memoryForm.description}
                  onChange={(e) =>
                    setMemoryForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the memory..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestone Form */}
        <TabsContent value="milestone" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Milestone Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-name">Person Name</Label>
                <Input
                  id="milestone-name"
                  value={milestoneForm.personName}
                  onChange={(e) =>
                    setMilestoneForm((f) => ({ ...f, personName: e.target.value }))
                  }
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-title">Title</Label>
                <Input
                  id="milestone-title"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., '100 Family Members'"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-subtitle">Subtitle (optional)</Label>
                <Input
                  id="milestone-subtitle"
                  value={milestoneForm.subtitle}
                  onChange={(e) =>
                    setMilestoneForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  placeholder="e.g., 'A Growing Legacy'"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Stats Form */}
        <TabsContent value="family-stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                Family Stats Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stats-name">Family Name</Label>
                <Input
                  id="stats-name"
                  value={familyStatsForm.personName}
                  onChange={(e) =>
                    setFamilyStatsForm((f) => ({ ...f, personName: e.target.value }))
                  }
                  placeholder="Enter family name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stats-members">Total Members</Label>
                  <Input
                    id="stats-members"
                    type="number"
                    min={1}
                    value={familyStatsForm.totalMembers}
                    onChange={(e) =>
                      setFamilyStatsForm((f) => ({
                        ...f,
                        totalMembers: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stats-generations">Generations</Label>
                  <Input
                    id="stats-generations"
                    type="number"
                    min={1}
                    value={familyStatsForm.generations}
                    onChange={(e) =>
                      setFamilyStatsForm((f) => ({
                        ...f,
                        generations: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stats-countries">Countries</Label>
                  <Input
                    id="stats-countries"
                    type="number"
                    min={1}
                    value={familyStatsForm.countriesRepresented}
                    onChange={(e) =>
                      setFamilyStatsForm((f) => ({
                        ...f,
                        countriesRepresented: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <Button
        onClick={handleGeneratePreview}
        disabled={!cardData}
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Preview
      </Button>

      {/* Card Preview */}
      {showPreview && cardData && (
        <div className="animate-fade-in-up">
          <CardPreview
            data={cardData}
            allowThemeChange
            allowSizeChange
          />
        </div>
      )}
    </div>
  );
}
