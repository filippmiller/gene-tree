'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RelationshipPathResult } from '@/types/relationship-path';
import { describeRelationship, getDegreesOfSeparation } from '@/types/relationship-path';
import PathVisualization from './PathVisualization';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface RelationshipPathFinderProps {
  familyMembers: FamilyMember[];
  currentUserId?: string;
  className?: string;
}

export default function RelationshipPathFinder({
  familyMembers,
  currentUserId,
  className = '',
}: RelationshipPathFinderProps) {
  const t = useTranslations('relationshipPath');
  const [person1, setPerson1] = useState<string>(currentUserId || '');
  const [person2, setPerson2] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RelationshipPathResult | null>(null);

  const handleSearch = async () => {
    if (!person1 || !person2) {
      setError(t('selectBothPeople'));
      return;
    }

    if (person1 === person2) {
      setError(t('samePerson'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/relationship-path?person1=${person1}&person2=${person2}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to find relationship');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getName = (id: string) => {
    const member = familyMembers.find((m) => m.id === id);
    return member
      ? [member.first_name, member.last_name].filter(Boolean).join(' ') || '?'
      : '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
        <p className="text-gray-600 mb-6">{t('description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Person 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('person1')}
            </label>
            <select
              value={person1}
              onChange={(e) => setPerson1(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('selectPerson')}</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Person 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('person2')}
            </label>
            <select
              value={person2}
              onChange={(e) => setPerson2(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('selectPerson')}</option>
              {familyMembers
                .filter((m) => m.id !== person1)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-4">{error}</p>
        )}

        <button
          onClick={handleSearch}
          disabled={loading || !person1 || !person2}
          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? t('searching') : t('findConnection')}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {result.found ? (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔗</div>
                <h3 className="text-lg font-semibold">
                  {getName(person1)} {t('and')} {getName(person2)}
                </h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {describeRelationship(result.path)}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {getDegreesOfSeparation(result.path_length)}
                </p>
              </div>

              <PathVisualization path={result.path} />
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤔</div>
              <h3 className="text-lg font-semibold text-gray-700">
                {t('noConnectionFound')}
              </h3>
              <p className="text-gray-500 mt-2">
                {t('noConnectionDescription')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
