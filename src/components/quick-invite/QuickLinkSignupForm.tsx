'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Users } from 'lucide-react';
import type { QuickLinkSignupRequest } from '@/types/quick-invite';

interface QuickLinkSignupFormProps {
  code: string;
  eventName?: string | null;
  creatorName?: string | null;
  locale?: string;
}

const translations = {
  en: {
    title: 'Join the Family',
    eventTitle: 'Join {event}',
    description: 'Fill in your details to request access to the family tree.',
    invitedBy: 'Invited by',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone (optional)',
    relationship: 'How are you related?',
    relationshipPlaceholder: 'e.g., "I am John\'s cousin" or "Married to Sarah"',
    relationshipHint: 'Describe your connection to the family',
    submit: 'Request to Join',
    submitting: 'Submitting...',
    successTitle: 'Request Submitted!',
    successMessage: 'Your request has been sent. You will be notified when approved.',
    errorTitle: 'Something went wrong',
    alreadySignedUp: 'You have already signed up with this email',
    linkExpired: 'This invite link has expired or is no longer valid',
    requiredFields: 'Please fill in all required fields',
    invalidEmail: 'Please enter a valid email address',
  },
  ru: {
    title: 'Присоединиться к семье',
    eventTitle: 'Присоединиться к {event}',
    description: 'Заполните данные для запроса доступа к семейному дереву.',
    invitedBy: 'Приглашение от',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Email',
    phone: 'Телефон (опционально)',
    relationship: 'Как вы связаны с семьёй?',
    relationshipPlaceholder: 'напр., "Я двоюродный брат Ивана" или "Супруг(а) Марии"',
    relationshipHint: 'Опишите вашу связь с семьёй',
    submit: 'Отправить запрос',
    submitting: 'Отправка...',
    successTitle: 'Запрос отправлен!',
    successMessage: 'Ваш запрос отправлен. Вы получите уведомление после одобрения.',
    errorTitle: 'Что-то пошло не так',
    alreadySignedUp: 'Вы уже зарегистрировались с этим email',
    linkExpired: 'Эта ссылка-приглашение истекла или больше недействительна',
    requiredFields: 'Заполните все обязательные поля',
    invalidEmail: 'Введите корректный email адрес',
  },
};

export function QuickLinkSignupForm({
  code,
  eventName,
  creatorName,
  locale = 'en',
}: QuickLinkSignupFormProps) {
  const [formData, setFormData] = useState<QuickLinkSignupRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    claimedRelationship: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const t = translations[locale as keyof typeof translations] || translations.en;

  const title = eventName ? t.eventTitle.replace('{event}', eventName) : t.title;

  const validateForm = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setErrorMessage(t.requiredFields);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage(t.invalidEmail);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitState('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitState('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/quick-links/by-code/${code}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(t.alreadySignedUp);
        } else if (response.status === 410) {
          setErrorMessage(t.linkExpired);
        } else {
          setErrorMessage(data.error || t.errorTitle);
        }
        setSubmitState('error');
        return;
      }

      setSubmitState('success');
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(t.errorTitle);
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitState === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">{t.successTitle}</h2>
            <p className="text-muted-foreground">{t.successMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
        {creatorName && (
          <p className="text-sm text-muted-foreground mt-2">
            {t.invitedBy}: <span className="font-medium">{creatorName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t.firstName} *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t.lastName} *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.email} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">{t.relationship}</Label>
            <Textarea
              id="relationship"
              placeholder={t.relationshipPlaceholder}
              value={formData.claimedRelationship}
              onChange={(e) => setFormData({ ...formData, claimedRelationship: e.target.value })}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">{t.relationshipHint}</p>
          </div>

          {submitState === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
