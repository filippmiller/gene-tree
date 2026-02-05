'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import {
  X,
  Calendar,
  User,
  Play,
  Pause,
  Download,
  Mic,
  Video,
  Image as ImageIcon,
  Heart,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TimeCapsuleWithProfiles } from '@/lib/time-capsules/types';

interface TimeCapsuleViewerProps {
  capsule: TimeCapsuleWithProfiles | null;
  locale: string;
  open: boolean;
  onClose: () => void;
}

export default function TimeCapsuleViewer({
  capsule,
  locale,
  open,
  onClose,
}: TimeCapsuleViewerProps) {
  const dateLocale = locale === 'ru' ? ru : enUS;
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!capsule?.media_url) {
      setMediaUrl(null);
      return;
    }

    // Construct the signed URL for media
    // The media is stored in the time-capsule-media bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      // For now, use public URL - in production, you'd want signed URLs
      setMediaUrl(`${supabaseUrl}/storage/v1/object/public/time-capsule-media/${capsule.media_url}`);
    }
  }, [capsule?.media_url]);

  if (!capsule) return null;

  const t = locale === 'ru' ? {
    from: 'От',
    deliveredOn: 'Доставлено',
    createdOn: 'Создано',
    close: 'Закрыть',
    download: 'Скачать',
    play: 'Воспроизвести',
    pause: 'Пауза',
  } : {
    from: 'From',
    deliveredOn: 'Delivered on',
    createdOn: 'Created on',
    close: 'Close',
    download: 'Download',
    play: 'Play',
    pause: 'Pause',
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDateStr = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PPP', { locale: dateLocale });
  };

  const getMediaIcon = () => {
    switch (capsule.media_type) {
      case 'audio':
        return <Mic className="w-8 h-8" />;
      case 'video':
        return <Video className="w-8 h-8" />;
      case 'image':
        return <ImageIcon className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </div>
            <span>{capsule.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
            <Avatar className="w-12 h-12">
              <AvatarImage src={capsule.creator.avatar_url || undefined} />
              <AvatarFallback>
                {getInitials(capsule.creator.first_name, capsule.creator.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">{t.from}</p>
              <p className="font-medium">
                {capsule.creator.first_name} {capsule.creator.last_name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">{t.deliveredOn}</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {capsule.delivered_at
                  ? formatDateStr(capsule.delivered_at)
                  : formatDateStr(capsule.scheduled_delivery_date)}
              </p>
            </div>
          </div>

          {/* Message */}
          {capsule.message && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800/30">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {capsule.message}
              </p>
            </div>
          )}

          {/* Media Player */}
          {capsule.media_type && mediaUrl && (
            <div className="space-y-3">
              {capsule.media_type === 'image' && (
                <div className="rounded-xl overflow-hidden bg-muted">
                  <img
                    src={mediaUrl}
                    alt=""
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              {capsule.media_type === 'audio' && (
                <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                    <Mic className="w-8 h-8" />
                  </div>
                  <audio
                    controls
                    className="flex-1"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={mediaUrl} />
                  </audio>
                </div>
              )}

              {capsule.media_type === 'video' && (
                <div className="rounded-xl overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full max-h-96"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={mediaUrl} />
                  </video>
                </div>
              )}

              {/* Download Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={mediaUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    {t.download}
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {t.createdOn} {formatDateStr(capsule.created_at)}
            </p>
            <Button variant="outline" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
