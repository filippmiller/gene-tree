'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, Heart } from 'lucide-react';
import { BRIDGE_RELATIONSHIP_TYPES, getBridgeRelationshipLabel } from '@/types/bridge-request';
import type { BridgeRequestWithProfiles } from '@/types/bridge-request';

const translations = {
  en: {
    title: 'Accept Bridge Request',
    description: 'Confirm the family connection',
    fromPerson: 'Request from:',
    theyClaim: 'They say:',
    selectRelationship: 'How are you actually related?',
    selectPlaceholder: 'Select relationship type',
    relationshipRequired: 'Please select a relationship type',
    addMessage: 'Add a message (optional)',
    messagePlaceholder: 'Welcome to the family tree!',
    cancel: 'Cancel',
    accept: 'Accept & Connect',
    accepting: 'Connecting...',
  },
  ru: {
    title: 'Принять запрос на связь',
    description: 'Подтвердите семейную связь',
    fromPerson: 'Запрос от:',
    theyClaim: 'Они утверждают:',
    selectRelationship: 'Как вы на самом деле связаны?',
    selectPlaceholder: 'Выберите тип связи',
    relationshipRequired: 'Пожалуйста, выберите тип связи',
    addMessage: 'Добавить сообщение (необязательно)',
    messagePlaceholder: 'Добро пожаловать в семейное древо!',
    cancel: 'Отмена',
    accept: 'Принять и связать',
    accepting: 'Связываем...',
  },
};

interface BridgeAcceptModalProps {
  open: boolean;
  onClose: () => void;
  request: BridgeRequestWithProfiles;
  onAccept: (relationshipType: string, message?: string) => Promise<void>;
  isProcessing: boolean;
}

export function BridgeAcceptModal({
  open,
  onClose,
  request,
  onAccept,
  isProcessing,
}: BridgeAcceptModalProps) {
  const { locale } = useParams<{ locale: string }>();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const [relationshipType, setRelationshipType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const handleAccept = async () => {
    if (!relationshipType) {
      setError(t.relationshipRequired);
      return;
    }

    setError(null);
    await onAccept(relationshipType, message.trim() || undefined);
  };

  const fullName =
    [request.requester?.first_name, request.requester?.last_name].filter(Boolean).join(' ') ||
    'Unknown';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Requester info */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-3">{t.fromPerson}</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.requester?.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(request.requester?.first_name, request.requester?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{fullName}</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-background rounded text-sm">
              <span className="font-medium">{t.theyClaim}</span> {request.claimed_relationship}
            </div>
          </div>

          {/* Relationship selection */}
          <div className="space-y-2">
            <Label>{t.selectRelationship} *</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger className={error && !relationshipType ? 'border-destructive' : ''}>
                <SelectValue placeholder={t.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {BRIDGE_RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getBridgeRelationshipLabel(type, locale as 'en' | 'ru')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional message */}
          <div className="space-y-2">
            <Label>{t.addMessage}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {t.cancel}
          </Button>
          <Button onClick={handleAccept} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.accepting}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t.accept}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
