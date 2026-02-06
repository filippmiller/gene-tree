/**
 * QuickAddDialog.tsx
 *
 * Lightweight inline dialog for adding relatives directly from the tree view.
 * Shows over the tree canvas — no page navigation needed.
 *
 * Fields: First Name, Last Name, Birth Year (optional), Deceased checkbox
 * Calls POST /api/relatives, then triggers tree refetch on success.
 */

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { QuickAddType } from './QuickAddMenu';

interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  relationshipType: QuickAddType;
  onSuccess: () => void;
}

export function QuickAddDialog({
  isOpen,
  onClose,
  personId,
  personName,
  relationshipType,
  onSuccess,
}: QuickAddDialogProps) {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('quickAdd');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationshipLabels: Record<QuickAddType, string> = {
    parent: t('addParent'),
    child: t('addChild'),
    spouse: t('addSpouse'),
    sibling: t('addSibling'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);

    try {
      const dateOfBirth = birthYear.trim()
        ? `${birthYear.trim()}-01-01`
        : undefined;

      const response = await fetch('/api/relatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDirect: false,
          relatedToUserId: personId,
          relatedToRelationship: relationshipType,
          relationshipType,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isDeceased,
          dateOfBirth,
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to add relative');
      }

      toast.success(t('success'));
      resetForm();
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setBirthYear('');
    setIsDeceased(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{relationshipLabels[relationshipType]}</DialogTitle>
          <DialogDescription>
            {t('addRelativeFor', { name: personName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="qa-firstName"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t('firstName')} *
            </label>
            <input
              id="qa-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t('firstName')}
              required
              autoFocus
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="qa-lastName"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t('lastName')} *
            </label>
            <input
              id="qa-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t('lastName')}
              required
            />
          </div>

          {/* Birth Year (optional) */}
          <div>
            <label
              htmlFor="qa-birthYear"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {t('birthYear')}
            </label>
            <input
              id="qa-birthYear"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="1960"
            />
          </div>

          {/* Deceased checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              {t('deceased')}
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
              loading={isSubmitting}
            >
              {t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddDialog;
