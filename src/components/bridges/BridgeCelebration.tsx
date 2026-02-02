'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Trees, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBridgeRelationshipLabel } from '@/types/bridge-request';
import confetti from 'canvas-confetti';

const translations = {
  en: {
    title: 'Family Connected!',
    subtitle: 'You and {name} are now connected',
    connectedAs: 'Connected as',
    viewConnection: 'View Connection',
    viewTree: 'View Family Tree',
    close: 'Close',
  },
  ru: {
    title: 'Семья соединена!',
    subtitle: 'Вы и {name} теперь связаны',
    connectedAs: 'Связаны как',
    viewConnection: 'Смотреть связь',
    viewTree: 'Смотреть древо',
    close: 'Закрыть',
  },
};

interface BridgeCelebrationProps {
  open: boolean;
  onClose: () => void;
  connectedPerson: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  relationshipType: string;
}

export function BridgeCelebration({
  open,
  onClose,
  connectedPerson,
  relationshipType,
}: BridgeCelebrationProps) {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = translations[(locale as keyof typeof translations) || 'en'] || translations.en;

  const [showContent, setShowContent] = useState(false);

  // Trigger confetti and animation when opened
  useEffect(() => {
    if (open) {
      // Delay content appearance for animation effect
      const timer = setTimeout(() => setShowContent(true), 100);

      // Confetti!
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f97316', '#eab308', '#22c55e', '#ef4444', '#3b82f6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#eab308', '#22c55e', '#ef4444', '#3b82f6'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      return () => {
        clearTimeout(timer);
        setShowContent(false);
      };
    }
  }, [open]);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const fullName =
    [connectedPerson.first_name, connectedPerson.last_name].filter(Boolean).join(' ') ||
    'Unknown';

  const handleViewConnection = () => {
    router.push(`/${locale}/profile/${connectedPerson.id}`);
    onClose();
  };

  const handleViewTree = () => {
    router.push(`/${locale}/tree`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px] text-center">
        <DialogHeader>
          <div
            className={cn(
              'mx-auto mb-4 transition-all duration-500',
              showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            )}
          >
            <div className="relative">
              {/* Animated rings */}
              <div className="absolute inset-0 animate-ping rounded-full bg-green-400/30" />
              <div className="absolute inset-0 animate-pulse rounded-full bg-green-300/20" />

              {/* Heart icon */}
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <Heart className="h-10 w-10 text-white fill-white" />
              </div>

              {/* Sparkles */}
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-bounce" />
              <Sparkles className="absolute -bottom-2 -left-2 h-5 w-5 text-yellow-400 animate-bounce delay-100" />
            </div>
          </div>

          <DialogTitle
            className={cn(
              'text-2xl transition-all duration-500 delay-200',
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {t.title}
          </DialogTitle>
          <DialogDescription
            className={cn(
              'transition-all duration-500 delay-300',
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {t.subtitle.replace('{name}', fullName)}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'py-6 transition-all duration-500 delay-400',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Connected person avatar */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto border-4 border-green-200 shadow-md">
                <AvatarImage src={connectedPerson.avatar_url || undefined} />
                <AvatarFallback className="bg-green-100 text-green-800 text-lg">
                  {getInitials(connectedPerson.first_name, connectedPerson.last_name)}
                </AvatarFallback>
              </Avatar>
              <p className="mt-2 font-medium">{fullName}</p>
            </div>
          </div>

          {/* Relationship type */}
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">{t.connectedAs}</p>
            <p className="font-semibold text-green-700 dark:text-green-300">
              {getBridgeRelationshipLabel(relationshipType, locale as 'en' | 'ru')}
            </p>
          </div>
        </div>

        <DialogFooter
          className={cn(
            'flex-col sm:flex-row gap-2 transition-all duration-500 delay-500',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Button variant="outline" onClick={onClose} className="sm:order-1">
            {t.close}
          </Button>
          <Button onClick={handleViewConnection} className="sm:order-2">
            {t.viewConnection}
          </Button>
          <Button variant="secondary" onClick={handleViewTree} className="sm:order-3">
            <Trees className="mr-2 h-4 w-4" />
            {t.viewTree}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
