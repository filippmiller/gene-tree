'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuickInviteLinkGenerator } from './QuickInviteLinkGenerator';
import { QuickLinkApprovalList } from './QuickLinkApprovalList';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ShareButtons } from './ShareButtons';
import {
  Link2,
  MoreVertical,
  Users,
  Clock,
  QrCode,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { QuickInviteLink, QuickLinkSignup } from '@/types/quick-invite';
import { getTimeRemaining, isLinkValid } from '@/types/quick-invite';

interface MyQuickLinksProps {
  locale?: string;
}

const translations = {
  en: {
    title: 'Quick Invite Links',
    description: 'Manage your shareable invite links',
    noLinks: 'No invite links yet',
    noLinksHint: 'Create a quick invite link to share at family events',
    createFirst: 'Create Your First Link',
    viewSignups: 'View Signups',
    showQR: 'Show QR Code',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    openLink: 'Open Link',
    deactivate: 'Deactivate',
    activate: 'Activate',
    delete: 'Delete',
    uses: 'uses',
    of: 'of',
    expires: 'Expires',
    expired: 'Expired',
    active: 'Active',
    inactive: 'Inactive',
    pendingApprovals: 'pending',
    expiresIn: 'Expires in',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    loading: 'Loading...',
    signupsTitle: 'Signups for',
    qrTitle: 'QR Code',
  },
  ru: {
    title: 'Быстрые ссылки-приглашения',
    description: 'Управляйте ссылками для приглашений',
    noLinks: 'Нет ссылок-приглашений',
    noLinksHint: 'Создайте быструю ссылку для семейных мероприятий',
    createFirst: 'Создать первую ссылку',
    viewSignups: 'Показать заявки',
    showQR: 'Показать QR-код',
    copyLink: 'Копировать ссылку',
    copied: 'Скопировано!',
    openLink: 'Открыть ссылку',
    deactivate: 'Деактивировать',
    activate: 'Активировать',
    delete: 'Удалить',
    uses: 'исп.',
    of: 'из',
    expires: 'Истекает',
    expired: 'Истекла',
    active: 'Активна',
    inactive: 'Неактивна',
    pendingApprovals: 'ожидают',
    expiresIn: 'Истекает через',
    days: 'д',
    hours: 'ч',
    minutes: 'м',
    loading: 'Загрузка...',
    signupsTitle: 'Заявки для',
    qrTitle: 'QR-код',
  },
};

function formatTimeRemaining(expiresAt: string, locale: string): string {
  const t = translations[locale as keyof typeof translations] || translations.en;
  const remaining = getTimeRemaining(expiresAt);

  if (remaining.expired) return t.expired;

  const parts = [];
  if (remaining.days > 0) parts.push(`${remaining.days}${t.days}`);
  if (remaining.hours > 0) parts.push(`${remaining.hours}${t.hours}`);
  if (remaining.minutes > 0 && remaining.days === 0) parts.push(`${remaining.minutes}${t.minutes}`);

  return parts.join(' ') || `< 1${t.minutes}`;
}

export function MyQuickLinks({ locale = 'en' }: MyQuickLinksProps) {
  const [links, setLinks] = useState<QuickInviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<QuickInviteLink | null>(null);
  const [signups, setSignups] = useState<QuickLinkSignup[]>([]);
  const [signupsDialogOpen, setSignupsDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

  const t = translations[locale as keyof typeof translations] || translations.en;

  const fetchLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/quick-links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);

        // Fetch pending counts for each link
        const counts: Record<string, number> = {};
        for (const link of data.links || []) {
          const signupsRes = await fetch(`/api/quick-links/${link.id}/signups`);
          if (signupsRes.ok) {
            const signupsData = await signupsRes.json();
            counts[link.id] = (signupsData.signups || []).filter(
              (s: QuickLinkSignup) => s.status === 'pending'
            ).length;
          }
        }
        setPendingCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleLinkCreated = (newLink: QuickInviteLink) => {
    setLinks((prev) => [newLink, ...prev]);
    setPendingCounts((prev) => ({ ...prev, [newLink.id]: 0 }));
  };

  const handleViewSignups = async (link: QuickInviteLink) => {
    setSelectedLink(link);
    setSignupsDialogOpen(true);

    try {
      const response = await fetch(`/api/quick-links/${link.id}/signups`);
      if (response.ok) {
        const data = await response.json();
        setSignups(data.signups || []);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    }
  };

  const handleShowQR = (link: QuickInviteLink) => {
    setSelectedLink(link);
    setQrDialogOpen(true);
  };

  const handleCopyLink = async (link: QuickInviteLink) => {
    const url = `${window.location.origin}/join/${link.code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link: QuickInviteLink) => {
    try {
      const response = await fetch(`/api/quick-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.is_active }),
      });

      if (response.ok) {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l))
        );
      }
    } catch (error) {
      console.error('Error toggling link:', error);
    }
  };

  const handleDelete = async (link: QuickInviteLink) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await fetch(`/api/quick-links/${link.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== link.id));
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleApprove = async (signupId: string) => {
    await fetch(`/api/quick-links/signups/${signupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });

    // Refresh signups
    if (selectedLink) {
      const response = await fetch(`/api/quick-links/${selectedLink.id}/signups`);
      if (response.ok) {
        const data = await response.json();
        setSignups(data.signups || []);
        // Update pending count
        const pendingCount = (data.signups || []).filter(
          (s: QuickLinkSignup) => s.status === 'pending'
        ).length;
        setPendingCounts((prev) => ({ ...prev, [selectedLink.id]: pendingCount }));
      }
    }
  };

  const handleReject = async (signupId: string, reason?: string) => {
    await fetch(`/api/quick-links/signups/${signupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason }),
    });

    // Refresh signups
    if (selectedLink) {
      const response = await fetch(`/api/quick-links/${selectedLink.id}/signups`);
      if (response.ok) {
        const data = await response.json();
        setSignups(data.signups || []);
        // Update pending count
        const pendingCount = (data.signups || []).filter(
          (s: QuickLinkSignup) => s.status === 'pending'
        ).length;
        setPendingCounts((prev) => ({ ...prev, [selectedLink.id]: pendingCount }));
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <QuickInviteLinkGenerator locale={locale} onLinkCreated={handleLinkCreated} />
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">{t.noLinks}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t.noLinksHint}</p>
              <QuickInviteLinkGenerator locale={locale} onLinkCreated={handleLinkCreated} />
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => {
                const valid = isLinkValid(link);
                const pendingCount = pendingCounts[link.id] || 0;

                return (
                  <div
                    key={link.id}
                    className={`p-4 border rounded-lg ${
                      !valid ? 'bg-muted/50 opacity-75' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-bold text-lg tracking-widest">
                            {link.code}
                          </span>
                          {link.is_active ? (
                            <Badge className="bg-green-100 text-green-800">{t.active}</Badge>
                          ) : (
                            <Badge variant="secondary">{t.inactive}</Badge>
                          )}
                          {pendingCount > 0 && (
                            <Badge variant="destructive">
                              {pendingCount} {t.pendingApprovals}
                            </Badge>
                          )}
                        </div>

                        {link.event_name && (
                          <p className="font-medium text-sm mb-2">{link.event_name}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {link.current_uses} {t.of} {link.max_uses} {t.uses}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeRemaining(link.expires_at, locale)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {pendingCount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSignups(link)}
                          >
                            {t.viewSignups} ({pendingCount})
                          </Button>
                        )}

                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleShowQR(link)}
                          title={t.showQR}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleCopyLink(link)}
                          title={t.copyLink}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleViewSignups(link)}
                              className="flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              {t.viewSignups}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/join/${link.code}`, '_blank')
                              }
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {t.openLink}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(link)}
                              className="flex items-center gap-2"
                            >
                              {link.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4" />
                                  {t.deactivate}
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4" />
                                  {t.activate}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(link)}
                              className="flex items-center gap-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signups Dialog */}
      <Dialog open={signupsDialogOpen} onOpenChange={setSignupsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.signupsTitle} {selectedLink?.event_name || selectedLink?.code}
            </DialogTitle>
            <DialogDescription>
              {selectedLink?.code}
            </DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <QuickLinkApprovalList
              signups={signups}
              linkId={selectedLink.id}
              onApprove={handleApprove}
              onReject={handleReject}
              locale={locale}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.qrTitle}</DialogTitle>
            {selectedLink?.event_name && (
              <DialogDescription>{selectedLink.event_name}</DialogDescription>
            )}
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-6">
              <QRCodeDisplay
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${selectedLink.code}`}
                code={selectedLink.code}
                eventName={selectedLink.event_name}
                locale={locale}
              />
              <ShareButtons
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${selectedLink.code}`}
                eventName={selectedLink.event_name}
                locale={locale}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
