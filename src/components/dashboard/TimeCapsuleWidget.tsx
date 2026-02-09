'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Timer, Loader2, Mail, Clock, ArrowRight, Package } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';

interface TimeCapsuleStats {
  pendingSent: number;
  unreadDelivered: number;
}

const translations = {
  en: {
    title: 'Time Capsules',
    pending: 'Pending',
    pendingDesc: 'capsules scheduled',
    delivered: 'Delivered',
    deliveredDesc: 'waiting to be opened',
    viewAll: 'View all capsules',
    create: 'Create capsule',
    empty: 'No time capsules yet',
    emptyHint: 'Send a message to the future',
    loading: 'Loading...',
    error: 'Failed to load',
  },
  ru: {
    title: 'Капсулы времени',
    pending: 'Ожидают',
    pendingDesc: 'капсул запланировано',
    delivered: 'Доставлены',
    deliveredDesc: 'ждут открытия',
    viewAll: 'Все капсулы',
    create: 'Создать капсулу',
    empty: 'Пока нет капсул',
    emptyHint: 'Отправьте послание в будущее',
    loading: 'Загрузка...',
    error: 'Ошибка загрузки',
  },
};

export default function TimeCapsuleWidget() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [stats, setStats] = useState<TimeCapsuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/time-capsules/stats');
        if (!res.ok) {
          throw new Error(t.error);
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('[TimeCapsuleWidget] Error:', err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [t.error]);

  const hasContent = stats && (stats.pendingSent > 0 || stats.unreadDelivered > 0);

  return (
    <GlassCard glass="medium" padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#D29922]/5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-[#D29922] flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            {stats && stats.unreadDelivered > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
                {stats.unreadDelivered > 99 ? '99+' : stats.unreadDelivered}
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#D29922]" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {error}
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#D29922]/10 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-[#D29922]" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{t.empty}</p>
            <p className="text-xs text-muted-foreground mb-4">{t.emptyHint}</p>
            <Link
              href={`/${locale}/time-capsules/new`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D29922] hover:text-[#D29922]/80 transition-colors"
            >
              {t.create}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending capsules */}
            {stats && stats.pendingSent > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#D29922]/5 border border-[#D29922]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D29922]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#D29922]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.pending}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingSent} {t.pendingDesc}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[#D29922]/10 text-[#D29922]">
                  {stats.pendingSent}
                </Badge>
              </div>
            )}

            {/* Delivered capsules */}
            {stats && stats.unreadDelivered > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200/30 dark:border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.delivered}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.unreadDelivered} {t.deliveredDesc}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 animate-pulse">
                  {stats.unreadDelivered}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#D29922]/5">
        <Link
          href={`/${locale}/time-capsules`}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#D29922] hover:text-[#D29922]/80 font-semibold py-1 transition-colors"
        >
          {t.viewAll}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </GlassCard>
  );
}
