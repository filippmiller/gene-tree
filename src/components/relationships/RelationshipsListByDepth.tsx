/**
 * RelationshipsListByDepth.tsx
 * 
 * Миссия: Отображение родственников с ПРАВИЛЬНОЙ классификацией по глубине
 * 
 * Использует: /api/relationships-depth (с SQL функциями depth)
 * 
 * Разделы:
 * - Parents (depth=1)
 * - Grandparents (depth=2)
 * - Children (depth=1)
 * - Grandchildren (depth=2)
 * - Siblings
 * - Spouses
 * 
 * Исправляет проблему: дедушки больше НЕ попадают в Parents
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  const locale = params.locale as string || 'en';
  const [data, setData] = useState<RelationshipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRelationships();
  }, [currentUserId]);

  /**
   * fetchRelationships - загрузка данных через ВРЕМЕННЫЙ API
   * 
   * API: /api/relationships-temp (читает напрямую из pending_relatives)
   * Возвращает: {parents, grandparents, children, grandchildren, siblings, spouses}
   */
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
      console.error('[RELATIONSHIPS] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * formatLifespan - форматирование дат жизни
   * Примеры: "(1932–2001)", "(род. 1956)", "(1936–...)"
   */
  const formatLifespan = (person: Person): string => {
    const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
    const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;

    if (birthYear && deathYear) {
      return `(${birthYear}–${deathYear})`;
    } else if (birthYear && !person.is_alive) {
      return `(${birthYear}–...)`;
    } else if (birthYear) {
      return `(род. ${birthYear})`;
    }
    return '';
  };

  /**
   * getInitials - получение инициалов для аватара
   */
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * PersonCard - карточка человека
   */
  const PersonCard = ({ person }: { person: Person }) => (
    <Link
      href={`/${locale}/tree/${person.id}`}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(person.name)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{person.name}</div>
          <div className="text-sm text-gray-500">{formatLifespan(person)}</div>
          {!person.is_alive && (
            <div className="text-xs text-gray-400 mt-1">✝ Усопший</div>
          )}
        </div>
      </div>
    </Link>
  );

  /**
   * SpouseCard - карточка супруга с датами брака
   */
  const SpouseCard = ({ spouse }: { spouse: Spouse }) => (
    <Link
      href={`/${locale}/tree/${spouse.id}`}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {spouse.photo_url ? (
            <img
              src={spouse.photo_url}
              alt={spouse.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(spouse.name)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{spouse.name}</div>
          <div className="text-sm text-gray-500">
            {formatLifespan(spouse)}
          </div>
          {spouse.marriage_date && (
            <div className="text-xs text-gray-400 mt-1">
              💍 Брак: {new Date(spouse.marriage_date).getFullYear()}
              {spouse.divorce_date && ` – ${new Date(spouse.divorce_date).getFullYear()}`}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  /**
   * RelationshipSection - секция для категории родственников
   */
  const RelationshipSection = ({
    title,
    description,
    people,
    icon,
    emptyMessage,
  }: {
    title: string;
    description: string;
    people: Person[];
    icon: string;
    emptyMessage: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {people.length}
        </span>
      </div>

      {people.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка родственников...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-500 text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-bold text-red-900">Ошибка загрузки</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchRelationships}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Нет данных</h3>
        <p className="text-gray-600">
          Добавьте родственников, чтобы построить ваше семейное дерево
        </p>
      </div>
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
    <div>
      {/* Summary card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Ваша семья</h2>
        <p className="text-blue-100 mb-4">
          Всего родственников: {totalCount}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{data.parents.length}</div>
            <div className="text-sm text-blue-100">Родители</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.grandparents.length}</div>
            <div className="text-sm text-blue-100">Бабушки/Дедушки</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.children.length}</div>
            <div className="text-sm text-blue-100">Дети</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.grandchildren.length}</div>
            <div className="text-sm text-blue-100">Внуки</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.siblings.length}</div>
            <div className="text-sm text-blue-100">Братья/Сёстры</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.spouses.length}</div>
            <div className="text-sm text-blue-100">Супруги</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Parents */}
        <RelationshipSection
          title="Родители"
          description="Depth = 1 (один шаг вверх)"
          people={data.parents}
          icon="👨‍👩"
          emptyMessage="Нет родителей в системе"
        />

        {/* Grandparents */}
        <RelationshipSection
          title="Бабушки и Дедушки"
          description="Depth = 2 (два шага вверх)"
          people={data.grandparents}
          icon="👴👵"
          emptyMessage="Нет бабушек и дедушек в системе"
        />

        {/* Spouses */}
        {data.spouses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💑</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Супруги</h2>
                <p className="text-sm text-gray-500">Браки и партнёрства</p>
              </div>
              <span className="ml-auto bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                {data.spouses.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.spouses.map((spouse) => (
                <SpouseCard key={spouse.id} spouse={spouse} />
              ))}
            </div>
          </div>
        )}

        {/* Siblings */}
        <RelationshipSection
          title="Братья и Сёстры"
          description="Люди с общими родителями"
          people={data.siblings}
          icon="👫"
          emptyMessage="Нет братьев и сестёр в системе"
        />

        {/* Children */}
        <RelationshipSection
          title="Дети"
          description="Depth = 1 (один шаг вниз)"
          people={data.children}
          icon="👶"
          emptyMessage="Нет детей в системе"
        />

        {/* Grandchildren */}
        <RelationshipSection
          title="Внуки"
          description="Depth = 2 (два шага вниз)"
          people={data.grandchildren}
          icon="👦👧"
          emptyMessage="Нет внуков в системе"
        />
      </div>

      {/* Link to tree visualization */}
      <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 text-center border border-purple-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Визуализировать дерево
        </h3>
        <p className="text-gray-600 mb-6">
          Посмотрите на ваше семейное дерево в графическом виде
        </p>
        <Link
          href={`/${locale}/tree/${currentUserId}`}
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        >
          Открыть семейное дерево →
        </Link>
      </div>
    </div>
  );
}
