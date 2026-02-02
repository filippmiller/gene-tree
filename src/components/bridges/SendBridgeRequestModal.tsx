'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBridgeRequests } from '@/hooks/useBridgeRequests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { DiscoveryResult } from '@/types/bridge-request';

const translations = {
  en: {
    title: 'Send Bridge Request',
    description: 'Connect with a potential family member',
    targetInfo: 'You are sending a request to:',
    relationshipLabel: 'How do you think you are related?',
    relationshipPlaceholder:
      'I believe we might be second cousins through our grandparents...',
    relationshipRequired: 'Please explain how you think you are related',
    ancestorHintLabel: 'Common ancestor hint (optional)',
    ancestorHintPlaceholder: 'Our common ancestor might be Maria Ivanova...',
    supportingInfoLabel: 'Additional information (optional)',
    supportingInfoPlaceholder: 'Any other details that might help...',
    cancel: 'Cancel',
    send: 'Send Request',
    sending: 'Sending...',
    success: 'Bridge request sent successfully!',
    error: 'Failed to send request',
    matchReasons: {
      same_last_name: 'Same last name',
      same_maiden_name: 'Same maiden name',
      same_birth_place: 'Same birth place',
      shared_ancestor: 'Shared ancestor',
      same_location: 'Same location',
      email_domain: 'Same organization',
    },
  },
  ru: {
    title: 'Отправить запрос на связь',
    description: 'Свяжитесь с потенциальным родственником',
    targetInfo: 'Вы отправляете запрос:',
    relationshipLabel: 'Как, по-вашему, вы связаны?',
    relationshipPlaceholder:
      'Я думаю, мы можем быть троюродными через наших бабушек и дедушек...',
    relationshipRequired: 'Пожалуйста, объясните, как вы думаете, что вы связаны',
    ancestorHintLabel: 'Подсказка о общем предке (необязательно)',
    ancestorHintPlaceholder: 'Наш общий предок может быть Мария Иванова...',
    supportingInfoLabel: 'Дополнительная информация (необязательно)',
    supportingInfoPlaceholder: 'Любые другие детали, которые могут помочь...',
    cancel: 'Отмена',
    send: 'Отправить запрос',
    sending: 'Отправка...',
    success: 'Запрос на связь успешно отправлен!',
    error: 'Не удалось отправить запрос',
    matchReasons: {
      same_last_name: 'Одинаковая фамилия',
      same_maiden_name: 'Одинаковая девичья фамилия',
      same_birth_place: 'Одно место рождения',
      shared_ancestor: 'Общий предок',
      same_location: 'Одна локация',
      email_domain: 'Одна организация',
    },
  },
};

interface SendBridgeRequestModalProps {
  open: boolean;
  onClose: () => void;
  candidate: DiscoveryResult;
  onSuccess?: () => void;
}

export function SendBridgeRequestModal({
  open,
  onClose,
  candidate,
  onSuccess,
}: SendBridgeRequestModalProps) {
  const { locale } = useParams<{ locale: string }>();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const { sendRequest } = useBridgeRequests();

  const [claimedRelationship, setClaimedRelationship] = useState('');
  const [ancestorHint, setAncestorHint] = useState('');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getMatchReasonLabel = (type: string) => {
    return t.matchReasons[type as keyof typeof t.matchReasons] || type;
  };

  const handleSubmit = async () => {
    if (!claimedRelationship.trim()) {
      setError(t.relationshipRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await sendRequest({
        target_user_id: candidate.candidate_id,
        claimed_relationship: claimedRelationship.trim(),
        common_ancestor_hint: ancestorHint.trim() || undefined,
        supporting_info: supportingInfo.trim() || undefined,
      });

      toast.success(t.success);
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.error;
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullName =
    [candidate.profile.first_name, candidate.profile.last_name].filter(Boolean).join(' ') ||
    'Unknown';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target person info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-3">{t.targetInfo}</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={candidate.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(candidate.profile.first_name, candidate.profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{fullName}</p>
                {candidate.profile.birth_place && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {candidate.profile.birth_place}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.match_reasons.map((reason, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {getMatchReasonLabel(reason.type)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Relationship explanation */}
          <div className="space-y-2">
            <Label htmlFor="relationship">{t.relationshipLabel} *</Label>
            <Textarea
              id="relationship"
              value={claimedRelationship}
              onChange={(e) => setClaimedRelationship(e.target.value)}
              placeholder={t.relationshipPlaceholder}
              rows={3}
              className={error && !claimedRelationship.trim() ? 'border-destructive' : ''}
            />
          </div>

          {/* Ancestor hint */}
          <div className="space-y-2">
            <Label htmlFor="ancestor">{t.ancestorHintLabel}</Label>
            <Textarea
              id="ancestor"
              value={ancestorHint}
              onChange={(e) => setAncestorHint(e.target.value)}
              placeholder={t.ancestorHintPlaceholder}
              rows={2}
            />
          </div>

          {/* Supporting info */}
          <div className="space-y-2">
            <Label htmlFor="supporting">{t.supportingInfoLabel}</Label>
            <Textarea
              id="supporting"
              value={supportingInfo}
              onChange={(e) => setSupportingInfo(e.target.value)}
              placeholder={t.supportingInfoPlaceholder}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.sending}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t.send}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
