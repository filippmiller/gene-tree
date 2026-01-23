/**
 * RelationshipsListByDepth.tsx
 *
 * Modern glassmorphism design for family relationships display.
 *
 * Features:
 * - Icon badges instead of emoji headers
 * - Glass card styling
 * - Modern person cards with avatars
 * - Responsive grid layout
 * - Smooth animations
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { GlassCard } from '@/components/ui/glass-card';
import { PersonCard, SpouseCard } from '@/components/ui/person-card';
import { CategorySection } from '@/components/ui/category-section';
import { Button } from '@/components/ui/button';
import {
  Users,
  Crown,
  Baby,
  Sparkles,
  Users2,
  Heart,
  TreePine,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Person {
  id: string;
  name: string;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  photo_url: string | null;
  is_alive: boolean;
}

interface Spouse extends Person {
  marriage_date: string | null;
  divorce_date: string | null;
}

interface RelationshipsData {
  parents: Person[];
  grandparents: Person[];
  children: Person[];
  grandchildren: Person[];
  siblings: Person[];
  spouses: Spouse[];
}

interface Props {
  currentUserId: string;
}

export default function RelationshipsListByDepth({ currentUserId }: Props) {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const [data, setData] = useState<RelationshipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRelationships();
  }, [currentUserId]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/relationships-temp?proband_id=${currentUserId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      logger.error('[RELATIONSHIPS] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Labels based on locale
  const labels = {
    en: {
      yourFamily: 'Your Family',
      totalRelatives: 'Total relatives',
      parents: 'Parents',
      parentsDesc: '1 generation up',
      grandparents: 'Grandparents',
      grandparentsDesc: '2 generations up',
      children: 'Children',
      childrenDesc: '1 generation down',
      grandchildren: 'Grandchildren',
      grandchildrenDesc: '2 generations down',
      siblings: 'Siblings',
      siblingsDesc: 'Shared parents',
      spouses: 'Spouses',
      spousesDesc: 'Marriages & partnerships',
      noParents: 'No parents in the system',
      noGrandparents: 'No grandparents in the system',
      noChildren: 'No children in the system',
      noGrandchildren: 'No grandchildren in the system',
      noSiblings: 'No siblings in the system',
      noSpouses: 'No spouses in the system',
      visualizeTree: 'Visualize Tree',
      visualizeDesc: 'View your family tree in graphical form',
      openTree: 'Open Family Tree',
      loading: 'Loading relatives...',
      error: 'Loading Error',
      tryAgain: 'Try Again',
      noData: 'No Data',
      addRelatives: 'Add relatives to build your family tree',
    },
    ru: {
      yourFamily: 'Ваша семья',
      totalRelatives: 'Всего родственников',
      parents: 'Родители',
      parentsDesc: '1 поколение вверх',
      grandparents: 'Бабушки и Дедушки',
      grandparentsDesc: '2 поколения вверх',
      children: 'Дети',
      childrenDesc: '1 поколение вниз',
      grandchildren: 'Внуки',
      grandchildrenDesc: '2 поколения вниз',
      siblings: 'Братья и Сёстры',
      siblingsDesc: 'Общие родители',
      spouses: 'Супруги',
      spousesDesc: 'Браки и партнёрства',
      noParents: 'Нет родителей в системе',
      noGrandparents: 'Нет бабушек и дедушек в системе',
      noChildren: 'Нет детей в системе',
      noGrandchildren: 'Нет внуков в системе',
      noSiblings: 'Нет братьев и сестёр в системе',
      noSpouses: 'Нет супругов в системе',
      visualizeTree: 'Визуализировать дерево',
      visualizeDesc: 'Посмотрите на ваше семейное дерево в графическом виде',
      openTree: 'Открыть семейное дерево',
      loading: 'Загрузка родственников...',
      error: 'Ошибка загрузки',
      tryAgain: 'Попробовать снова',
      noData: 'Нет данных',
      addRelatives: 'Добавьте родственников, чтобы построить ваше семейное дерево',
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard glass="tinted" className="border-destructive/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t.error}</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button onClick={fetchRelationships} variant="default" leftIcon={<RefreshCw className="w-4 h-4" />}>
          {t.tryAgain}
        </Button>
      </GlassCard>
    );
  }

  // Empty state
  if (!data) {
    return (
      <GlassCard glass="medium" className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{t.noData}</h3>
        <p className="text-muted-foreground">{t.addRelatives}</p>
      </GlassCard>
    );
  }

  const totalCount =
    data.parents.length +
    data.grandparents.length +
    data.children.length +
    data.grandchildren.length +
    data.siblings.length +
    data.spouses.length;

  // Main content
  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <GlassCard
        glass="tinted"
        padding="lg"
        className="bg-gradient-to-br from-violet-500/90 to-purple-600/90 text-white border-violet-400/30"
      >
        <h2 className="text-2xl font-bold mb-2">{t.yourFamily}</h2>
        <p className="text-white/80 mb-6">
          {t.totalRelatives}: {totalCount}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatItem
            icon={<Users className="w-5 h-5" />}
            value={data.parents.length}
            label={t.parents}
          />
          <StatItem
            icon={<Crown className="w-5 h-5" />}
            value={data.grandparents.length}
            label={t.grandparents}
          />
          <StatItem
            icon={<Baby className="w-5 h-5" />}
            value={data.children.length}
            label={t.children}
          />
          <StatItem
            icon={<Sparkles className="w-5 h-5" />}
            value={data.grandchildren.length}
            label={t.grandchildren}
          />
          <StatItem
            icon={<Users2 className="w-5 h-5" />}
            value={data.siblings.length}
            label={t.siblings}
          />
          <StatItem
            icon={<Heart className="w-5 h-5" />}
            value={data.spouses.length}
            label={t.spouses}
          />
        </div>
      </GlassCard>

      {/* Relationship Sections */}
      <div className="space-y-8">
        {/* Parents */}
        <CategorySection
          category="parents"
          title={t.parents}
          description={t.parentsDesc}
          count={data.parents.length}
          emptyMessage={t.noParents}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.parents.map((person) => (
              <PersonCard
                key={person.id}
                person={{
                  id: person.id,
                  name: person.name,
                  photoUrl: person.photo_url,
                  birthDate: person.birth_date,
                  deathDate: person.death_date,
                  isAlive: person.is_alive,
                }}
                relationshipType="parents"
                locale={locale}
                href={`/${locale}/profile/${person.id}`}
              />
            ))}
          </div>
        </CategorySection>

        {/* Grandparents */}
        <CategorySection
          category="grandparents"
          title={t.grandparents}
          description={t.grandparentsDesc}
          count={data.grandparents.length}
          emptyMessage={t.noGrandparents}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.grandparents.map((person) => (
              <PersonCard
                key={person.id}
                person={{
                  id: person.id,
                  name: person.name,
                  photoUrl: person.photo_url,
                  birthDate: person.birth_date,
                  deathDate: person.death_date,
                  isAlive: person.is_alive,
                }}
                relationshipType="grandparents"
                locale={locale}
                href={`/${locale}/profile/${person.id}`}
              />
            ))}
          </div>
        </CategorySection>

        {/* Spouses */}
        {data.spouses.length > 0 && (
          <CategorySection
            category="spouses"
            title={t.spouses}
            description={t.spousesDesc}
            count={data.spouses.length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.spouses.map((spouse) => (
                <SpouseCard
                  key={spouse.id}
                  person={{
                    id: spouse.id,
                    name: spouse.name,
                    photoUrl: spouse.photo_url,
                    birthDate: spouse.birth_date,
                    deathDate: spouse.death_date,
                    isAlive: spouse.is_alive,
                  }}
                  marriageDate={spouse.marriage_date}
                  divorceDate={spouse.divorce_date}
                  locale={locale}
                  href={`/${locale}/profile/${spouse.id}`}
                />
              ))}
            </div>
          </CategorySection>
        )}

        {/* Siblings */}
        <CategorySection
          category="siblings"
          title={t.siblings}
          description={t.siblingsDesc}
          count={data.siblings.length}
          emptyMessage={t.noSiblings}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.siblings.map((person) => (
              <PersonCard
                key={person.id}
                person={{
                  id: person.id,
                  name: person.name,
                  photoUrl: person.photo_url,
                  birthDate: person.birth_date,
                  deathDate: person.death_date,
                  isAlive: person.is_alive,
                }}
                relationshipType="siblings"
                locale={locale}
                href={`/${locale}/profile/${person.id}`}
              />
            ))}
          </div>
        </CategorySection>

        {/* Children */}
        <CategorySection
          category="children"
          title={t.children}
          description={t.childrenDesc}
          count={data.children.length}
          emptyMessage={t.noChildren}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.children.map((person) => (
              <PersonCard
                key={person.id}
                person={{
                  id: person.id,
                  name: person.name,
                  photoUrl: person.photo_url,
                  birthDate: person.birth_date,
                  deathDate: person.death_date,
                  isAlive: person.is_alive,
                }}
                relationshipType="children"
                locale={locale}
                href={`/${locale}/profile/${person.id}`}
              />
            ))}
          </div>
        </CategorySection>

        {/* Grandchildren */}
        <CategorySection
          category="grandchildren"
          title={t.grandchildren}
          description={t.grandchildrenDesc}
          count={data.grandchildren.length}
          emptyMessage={t.noGrandchildren}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.grandchildren.map((person) => (
              <PersonCard
                key={person.id}
                person={{
                  id: person.id,
                  name: person.name,
                  photoUrl: person.photo_url,
                  birthDate: person.birth_date,
                  deathDate: person.death_date,
                  isAlive: person.is_alive,
                }}
                relationshipType="grandchildren"
                locale={locale}
                href={`/${locale}/profile/${person.id}`}
              />
            ))}
          </div>
        </CategorySection>
      </div>

      {/* Tree Visualization CTA */}
      <GlassCard
        glass="tinted"
        padding="lg"
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mx-auto mb-4">
          <TreePine className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {t.visualizeTree}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t.visualizeDesc}
        </p>
        <Button asChild variant="gradient" size="lg">
          <Link href={`/${locale}/tree/${currentUserId}`}>
            {t.openTree} →
          </Link>
        </Button>
      </GlassCard>
    </div>
  );
}

/**
 * StatItem - Small stat display for summary card
 */
function StatItem({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="opacity-80">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs text-white/70 truncate">{label}</div>
    </div>
  );
}
