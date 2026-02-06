'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Users, AlertTriangle } from 'lucide-react';

const translations = {
  en: {
    title: 'Tree failed to load',
    description: 'The family tree visualization encountered an error. This usually resolves on retry.',
    tryAgain: 'Reload Tree',
    viewList: 'View as List',
  },
  ru: {
    title: 'Ошибка загрузки дерева',
    description: 'Визуализация семейного дерева столкнулась с ошибкой. Обычно это решается при повторной попытке.',
    tryAgain: 'Перезагрузить дерево',
    viewList: 'Показать списком',
  },
};

export default function TreeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    console.error('[TreeView] Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
          <div className="flex gap-3 pt-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.tryAgain}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `/${locale}/people`}
            >
              <Users className="mr-2 h-4 w-4" />
              {t.viewList}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
