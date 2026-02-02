'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Mail, Phone, Clock, User, AlertCircle } from 'lucide-react';
import type { QuickLinkSignup, QuickLinkSignupStatus } from '@/types/quick-invite';

interface QuickLinkApprovalListProps {
  signups: QuickLinkSignup[];
  linkId: string;
  onApprove: (signupId: string) => Promise<void>;
  onReject: (signupId: string, reason?: string) => Promise<void>;
  locale?: string;
}

const translations = {
  en: {
    title: 'Pending Approvals',
    description: 'Review and approve people who want to join',
    noSignups: 'No pending signups',
    approve: 'Approve',
    reject: 'Reject',
    approveAll: 'Approve All',
    claimedRelationship: 'Claims to be:',
    signedUpAt: 'Signed up',
    rejectDialogTitle: 'Reject Signup',
    rejectDialogDescription: 'Optionally provide a reason for rejection',
    reasonPlaceholder: 'Reason (optional)',
    cancel: 'Cancel',
    confirm: 'Confirm Rejection',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    approved: 'Approved',
    rejected: 'Rejected',
  },
  ru: {
    title: 'Ожидают одобрения',
    description: 'Проверьте и одобрите людей, которые хотят присоединиться',
    noSignups: 'Нет ожидающих заявок',
    approve: 'Одобрить',
    reject: 'Отклонить',
    approveAll: 'Одобрить всех',
    claimedRelationship: 'Указанное родство:',
    signedUpAt: 'Зарегистрировался',
    rejectDialogTitle: 'Отклонить заявку',
    rejectDialogDescription: 'При желании укажите причину отклонения',
    reasonPlaceholder: 'Причина (опционально)',
    cancel: 'Отмена',
    confirm: 'Подтвердить отклонение',
    status: {
      pending: 'Ожидает',
      approved: 'Одобрено',
      rejected: 'Отклонено',
    },
    approved: 'Одобрено',
    rejected: 'Отклонено',
  },
};

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function QuickLinkApprovalList({
  signups,
  onApprove,
  onReject,
  locale = 'en',
}: QuickLinkApprovalListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<QuickLinkSignup | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionResults, setActionResults] = useState<Record<string, 'approved' | 'rejected'>>({});

  const t = translations[locale as keyof typeof translations] || translations.en;

  const pendingSignups = signups.filter((s) => s.status === 'pending' && !actionResults[s.id]);

  const handleApprove = async (signup: QuickLinkSignup) => {
    setProcessingId(signup.id);
    try {
      await onApprove(signup.id);
      setActionResults((prev) => ({ ...prev, [signup.id]: 'approved' }));
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (signup: QuickLinkSignup) => {
    setSelectedSignup(signup);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSignup) return;

    setProcessingId(selectedSignup.id);
    setRejectDialogOpen(false);

    try {
      await onReject(selectedSignup.id, rejectReason || undefined);
      setActionResults((prev) => ({ ...prev, [selectedSignup.id]: 'rejected' }));
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessingId(null);
      setSelectedSignup(null);
      setRejectReason('');
    }
  };

  const handleApproveAll = async () => {
    for (const signup of pendingSignups) {
      await handleApprove(signup);
    }
  };

  const getStatusBadge = (status: QuickLinkSignupStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">{t.status.pending}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{t.status.approved}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t.status.rejected}</Badge>;
    }
  };

  if (signups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noSignups}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            {pendingSignups.length > 1 && (
              <Button size="sm" onClick={handleApproveAll}>
                {t.approveAll} ({pendingSignups.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signups.map((signup) => {
              const result = actionResults[signup.id];
              const isProcessing = processingId === signup.id;
              const isPending = signup.status === 'pending' && !result;

              return (
                <div
                  key={signup.id}
                  className={`p-4 border rounded-lg ${
                    result === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : result === 'rejected'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {signup.first_name} {signup.last_name}
                        </h4>
                        {result ? (
                          <Badge
                            className={
                              result === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {result === 'approved' ? t.approved : t.rejected}
                          </Badge>
                        ) : (
                          getStatusBadge(signup.status)
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{signup.email}</span>
                        </div>

                        {signup.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{signup.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {t.signedUpAt} {formatDate(signup.created_at, locale)}
                          </span>
                        </div>
                      </div>

                      {signup.claimed_relationship && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">{t.claimedRelationship}</span>{' '}
                          {signup.claimed_relationship}
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(signup)}
                          loading={isProcessing}
                          leftIcon={<Check className="h-4 w-4" />}
                        >
                          {t.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(signup)}
                          disabled={isProcessing}
                          leftIcon={<X className="h-4 w-4" />}
                        >
                          {t.reject}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t.rejectDialogTitle}
            </DialogTitle>
            <DialogDescription>{t.rejectDialogDescription}</DialogDescription>
          </DialogHeader>

          {selectedSignup && (
            <div className="py-2">
              <p className="font-medium">
                {selectedSignup.first_name} {selectedSignup.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedSignup.email}</p>
            </div>
          )}

          <Textarea
            placeholder={t.reasonPlaceholder}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
