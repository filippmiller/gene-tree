'use client';

import { User } from 'lucide-react';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import type { GrandparentsData, GrandparentData } from '@/lib/onboarding/wizard-state';

interface Props {
  data: GrandparentsData;
  onChange: (data: GrandparentsData) => void;
  locale: string;
  /** Whether mother was skipped in step 2 */
  motherSkipped: boolean;
  /** Whether father was skipped in step 2 */
  fatherSkipped: boolean;
  /** Translations from common.json */
  t: {
    title: string;
    subtitle: string;
    maternalTitle: string;
    paternalTitle: string;
    grandmother: string;
    grandfather: string;
    grandmotherMaternal: string;
    grandfatherMaternal: string;
    grandmotherPaternal: string;
    grandfatherPaternal: string;
    firstName: string;
    lastName: string;
    birthYear: string;
    birthYearOptional: string;
    deceased: string;
    skip: string;
    skipAll: string;
    skipHint: string;
  };
}

interface GrandparentCardProps {
  title: string;
  variant: 'grandmother' | 'grandfather';
  data: GrandparentData;
  onChange: (data: GrandparentData) => void;
  t: Props['t'];
  idPrefix: string;
}

function GrandparentCard({ title, variant, data, onChange, t, idPrefix }: GrandparentCardProps) {
  const iconColor = variant === 'grandmother' ? 'text-rose-400' : 'text-blue-400';
  const bgColor = variant === 'grandmother' ? 'from-rose-400/10 to-rose-400/5' : 'from-blue-400/10 to-blue-400/5';
  const borderColor = variant === 'grandmother' ? 'border-rose-400/20' : 'border-blue-400/20';

  const handleChange = (field: keyof GrandparentData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className={`p-4 rounded-lg border ${data.skip ? 'opacity-50' : ''} ${borderColor} bg-background/50`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center`}>
          <User className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
        <input
          type="checkbox"
          checked={data.skip || false}
          onChange={(e) => handleChange('skip', e.target.checked)}
          aria-label={`${t.skip} - ${title}`}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <span>{t.skip}</span>
      </label>

      {!data.skip && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FloatingInput
              id={`${idPrefix}-firstName`}
              label={t.firstName}
              value={data.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
            <FloatingInput
              id={`${idPrefix}-lastName`}
              label={t.lastName}
              value={data.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {t.birthYear} ({t.birthYearOptional})
              </Label>
              <input
                type="number"
                min="1850"
                max={new Date().getFullYear()}
                placeholder="1935"
                value={data.birthYear || ''}
                onChange={(e) => handleChange('birthYear', e.target.value)}
                aria-label={`${title} ${t.birthYear}`}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={data.isDeceased}
                  onChange={(e) => handleChange('isDeceased', e.target.checked)}
                  aria-label={`${t.deceased} - ${title}`}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span>{t.deceased}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Step3Grandparents({ data, onChange, t, motherSkipped, fatherSkipped }: Props) {
  const updateGrandparent = (key: keyof GrandparentsData, grandparent: GrandparentData) => {
    onChange({ ...data, [key]: grandparent });
  };

  const showMaternal = !motherSkipped;
  const showPaternal = !fatherSkipped;

  if (!showMaternal && !showPaternal) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
          <p className="text-muted-foreground mt-2">{t.skipHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Maternal Grandparents */}
        {showMaternal && (
          <GlassCard glass="subtle" padding="md" className="border-2 border-rose-500/20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <h3 className="font-semibold text-foreground text-sm">{t.maternalTitle}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GrandparentCard
                title={t.grandmotherMaternal}
                variant="grandmother"
                data={data.maternalGrandmother}
                onChange={(gp) => updateGrandparent('maternalGrandmother', gp)}
                t={t}
                idPrefix="maternal-gm"
              />
              <GrandparentCard
                title={t.grandfatherMaternal}
                variant="grandfather"
                data={data.maternalGrandfather}
                onChange={(gp) => updateGrandparent('maternalGrandfather', gp)}
                t={t}
                idPrefix="maternal-gf"
              />
            </div>
          </GlassCard>
        )}

        {/* Paternal Grandparents */}
        {showPaternal && (
          <GlassCard glass="subtle" padding="md" className="border-2 border-blue-500/20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <h3 className="font-semibold text-foreground text-sm">{t.paternalTitle}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GrandparentCard
                title={t.grandmotherPaternal}
                variant="grandmother"
                data={data.paternalGrandmother}
                onChange={(gp) => updateGrandparent('paternalGrandmother', gp)}
                t={t}
                idPrefix="paternal-gm"
              />
              <GrandparentCard
                title={t.grandfatherPaternal}
                variant="grandfather"
                data={data.paternalGrandfather}
                onChange={(gp) => updateGrandparent('paternalGrandfather', gp)}
                t={t}
                idPrefix="paternal-gf"
              />
            </div>
          </GlassCard>
        )}

        <p className="text-xs text-muted-foreground text-center">{t.skipHint}</p>
      </div>
    </div>
  );
}
