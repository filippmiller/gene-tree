'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RelationshipPathResult } from '@/types/relationship-path';
import PathVisualization from './PathVisualization';

interface RelationshipPathModalProps {
  /** The ID of the first person (usually current user) */
  person1Id: string;
  /** Name of person 1 for display */
  person1Name: string;
  /** The ID of the second person */
  person2Id: string;
  /** Name of person 2 for display */
  person2Name: string;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal component for showing relationship path between two specific people
 * Used on profile pages with "How are we related?" button
 */
export default function RelationshipPathModal({
  person1Id,
  person1Name,
  person2Id,
  person2Name,
  open,
  onOpenChange,
}: RelationshipPathModalProps) {
  const locale = useLocale() as 'en' | 'ru';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RelationshipPathResult | null>(null);

  // Fetch relationship when modal opens
  useEffect(() => {
    if (!open || !person1Id || !person2Id) {
      setResult(null);
      setError(null);
      return;
    }

    const fetchRelationship = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/relationship-path?person1=${person1Id}&person2=${person2Id}&locale=${locale}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to find relationship');
        }

        if (data.success && data.result) {
          setResult(data.result);
        } else {
          throw new Error(data.error || 'No result returned');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationship();
  }, [open, person1Id, person2Id, locale]);

  const t = locale === 'ru' ? {
    title: 'Как мы связаны?',
    finding: 'Ищем связь...',
    noConnection: 'Связь не найдена',
    noConnectionDesc: 'Эти два человека, похоже, не связаны в вашем семейном дереве',
    close: 'Закрыть',
    error: 'Ошибка',
  } : {
    title: 'How Are We Related?',
    finding: 'Finding connection...',
    noConnection: 'No Connection Found',
    noConnectionDesc: 'These two people don\'t appear to be connected in your family tree',
    close: 'Close',
    error: 'Error',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#58A6FF] flex items-center justify-center text-white">
              <Link2 className="w-4 h-4" />
            </div>
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {person1Name} & {person2Name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-[#58A6FF]/20 border-t-[#58A6FF] animate-spin" />
              <p className="mt-4 text-gray-500">{t.finding}</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">{t.error}</h3>
              <p className="text-red-500 mt-2">{error}</p>
            </div>
          )}

          {!loading && !error && result && (
            result.found ? (
              <PathVisualization
                result={result}
                locale={locale}
                showExport={true}
              />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-500 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  ?
                </div>
                <h3 className="text-lg font-semibold text-gray-700">{t.noConnection}</h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  {t.noConnectionDesc}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Button that triggers the relationship path modal
 */
interface HowAreWeRelatedButtonProps {
  /** Current user's ID */
  currentUserId: string;
  /** Current user's name */
  currentUserName: string;
  /** Target person's ID */
  targetPersonId: string;
  /** Target person's name */
  targetPersonName: string;
  /** Optional className */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
}

export function HowAreWeRelatedButton({
  currentUserId,
  currentUserName,
  targetPersonId,
  targetPersonName,
  className,
  variant = 'outline',
  size = 'sm',
}: HowAreWeRelatedButtonProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale() as 'en' | 'ru';

  const label = locale === 'ru' ? 'Как мы связаны?' : 'How are we related?';

  // Don't show for same person
  if (currentUserId === targetPersonId) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
        leftIcon={<Link2 className="w-4 h-4" />}
      >
        {label}
      </Button>

      <RelationshipPathModal
        person1Id={currentUserId}
        person1Name={currentUserName}
        person2Id={targetPersonId}
        person2Name={targetPersonName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
