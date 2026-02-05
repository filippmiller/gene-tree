'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, User, Check, AlertCircle } from 'lucide-react';
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
import type { InviteData } from '@/lib/onboarding/wizard-state';

interface CreatedRelative {
  id: string;
  name: string;
  relationship: string;
}

interface Props {
  data: InviteData;
  onChange: (data: InviteData) => void;
  createdRelativeIds: string[];
  locale: string;
}

const translations = {
  en: {
    title: 'Invite a family member',
    subtitle: 'Send an invitation to help them join your family tree',
    selectRelative: 'Select a family member to invite',
    selectRelativePlaceholder: 'Choose who to invite...',
    email: 'Email Address',
    emailPlaceholder: 'their.email@example.com',
    phone: 'Phone Number',
    phoneOptional: 'Optional',
    phonePlaceholder: '+1 (555) 123-4567',
    sendInvite: 'Send Invitation',
    skipAndFinish: 'Skip & Finish',
    skipHint: 'You can always invite family members later from your dashboard',
    inviteSent: 'Invitation will be sent when you finish the wizard',
    noRelatives: 'No family members to invite yet',
    noRelativesHint: 'Complete the previous steps to add family members',
    invalidEmail: 'Please enter a valid email address',
    emailRequired: 'Email is required to send an invitation',
  },
  ru: {
    title: 'Пригласите родственника',
    subtitle: 'Отправьте приглашение присоединиться к семейному древу',
    selectRelative: 'Выберите родственника для приглашения',
    selectRelativePlaceholder: 'Выберите кого пригласить...',
    email: 'Email адрес',
    emailPlaceholder: 'email@example.com',
    phone: 'Телефон',
    phoneOptional: 'Необязательно',
    phonePlaceholder: '+7 (999) 123-45-67',
    sendInvite: 'Отправить приглашение',
    skipAndFinish: 'Пропустить и завершить',
    skipHint: 'Вы всегда можете пригласить родственников позже',
    inviteSent: 'Приглашение будет отправлено при завершении мастера',
    noRelatives: 'Пока нет родственников для приглашения',
    noRelativesHint: 'Завершите предыдущие шаги, чтобы добавить родственников',
    invalidEmail: 'Введите корректный email адрес',
    emailRequired: 'Email обязателен для отправки приглашения',
  },
};

export default function Step4Invite({ data, onChange, createdRelativeIds, locale }: Props) {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const [createdRelatives, setCreatedRelatives] = useState<CreatedRelative[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch created relatives info
  useEffect(() => {
    const fetchRelatives = async () => {
      try {
        const response = await fetch('/api/relatives');
        if (response.ok) {
          const allRelatives = await response.json();
          // Show all pending relatives if no specific IDs, or filter by session IDs
          let filtered;
          if (createdRelativeIds.length > 0) {
            // Filter to only show relatives created in this wizard session
            filtered = allRelatives.filter((r: any) => createdRelativeIds.includes(r.id));
          } else {
            // Fallback: show all pending relatives (for resume scenarios)
            filtered = allRelatives.filter((r: any) => r.status === 'pending');
          }

          setCreatedRelatives(
            filtered.map((r: any) => ({
              id: r.id,
              name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown',
              relationship: r.relationship_type,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch relatives:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatives();
  }, [createdRelativeIds]);

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Empty is handled separately
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (email: string) => {
    onChange({ ...data, email });
    if (email && !validateEmail(email)) {
      setEmailError(t.invalidEmail);
    } else {
      setEmailError(null);
    }
  };

  const handleRelativeSelect = (relativeId: string) => {
    const relative = createdRelatives.find((r) => r.id === relativeId);
    onChange({
      ...data,
      relativeId,
      relativeName: relative?.name,
      relationshipType: relative?.relationship,
    });
  };

  const hasValidInvite = data.relativeId && data.email && validateEmail(data.email);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : createdRelatives.length === 0 ? (
          <GlassCard glass="subtle" padding="lg" className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">{t.noRelatives}</p>
            <p className="text-xs text-muted-foreground">{t.noRelativesHint}</p>
          </GlassCard>
        ) : (
          <>
            {/* Select Relative */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                {t.selectRelative}
              </Label>
              <Select value={data.relativeId || ''} onValueChange={handleRelativeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectRelativePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {createdRelatives.map((relative) => (
                    <SelectItem key={relative.id} value={relative.id}>
                      <div className="flex items-center gap-2">
                        <span>{relative.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({relative.relationship})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div>
              <FloatingInput
                id="invite-email"
                label={t.email}
                type="email"
                value={data.email || ''}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={emailError || undefined}
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                {t.phone} <span className="text-xs">({t.phoneOptional})</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={data.phone || ''}
                  onChange={(e) => onChange({ ...data, phone: e.target.value })}
                  placeholder={t.phonePlaceholder}
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Success State */}
            {hasValidInvite && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400">
                <Check className="w-5 h-5" />
                <span className="text-sm">{t.inviteSent}</span>
              </div>
            )}
          </>
        )}

        {/* Skip hint */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">{t.skipHint}</p>
        </div>
      </div>
    </div>
  );
}
