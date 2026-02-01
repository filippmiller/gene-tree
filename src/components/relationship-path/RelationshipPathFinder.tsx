'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Search, Users, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { RelationshipPathResult } from '@/types/relationship-path';
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
  /** Initial person1 selection (defaults to currentUserId) */
  initialPerson1?: string;
  /** Initial person2 selection */
  initialPerson2?: string;
  /** Compact mode for embedding in other components */
  compact?: boolean;
}

export default function RelationshipPathFinder({
  familyMembers,
  currentUserId,
  className = '',
  initialPerson1,
  initialPerson2,
  compact = false,
}: RelationshipPathFinderProps) {
  const t = useTranslations('relationshipPath');
  const locale = useLocale() as 'en' | 'ru';

  const [person1, setPerson1] = useState<string>(initialPerson1 || currentUserId || '');
  const [person2, setPerson2] = useState<string>(initialPerson2 || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RelationshipPathResult | null>(null);
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  // Filter family members based on search
  const filteredMembers1 = useMemo(() => {
    if (!searchQuery1.trim()) return familyMembers;
    const query = searchQuery1.toLowerCase();
    return familyMembers.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(query)
    );
  }, [familyMembers, searchQuery1]);

  const filteredMembers2 = useMemo(() => {
    if (!searchQuery2.trim()) return familyMembers.filter(m => m.id !== person1);
    const query = searchQuery2.toLowerCase();
    return familyMembers
      .filter(m => m.id !== person1)
      .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(query));
  }, [familyMembers, searchQuery2, person1]);

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
        `/api/relationship-path?person1=${person1}&person2=${person2}&locale=${locale}`
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

  const getSelectedMember = (id: string) => {
    return familyMembers.find(m => m.id === id);
  };

  const getName = (member: FamilyMember | undefined) => {
    if (!member) return '';
    return [member.first_name, member.last_name].filter(Boolean).join(' ') || '?';
  };

  const getInitials = (member: FamilyMember | undefined) => {
    if (!member) return '?';
    return `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || '?';
  };

  const selectedMember1 = getSelectedMember(person1);
  const selectedMember2 = getSelectedMember(person2);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Form */}
      <GlassCard glass="medium" padding={compact ? 'md' : 'lg'}>
        {!compact && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Person 1 Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('person1')}
            </label>
            <div className="relative">
              {selectedMember1 ? (
                <button
                  onClick={() => {
                    setPerson1('');
                    setSearchQuery1('');
                    setShowDropdown1(true);
                    setResult(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    {selectedMember1.avatar_url && (
                      <AvatarImage src={selectedMember1.avatar_url} alt={getName(selectedMember1)} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-violet-400 to-violet-600 text-white text-sm font-medium">
                      {getInitials(selectedMember1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {getName(selectedMember1)}
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery1}
                    onChange={e => {
                      setSearchQuery1(e.target.value);
                      setShowDropdown1(true);
                    }}
                    onFocus={() => setShowDropdown1(true)}
                    onBlur={() => setTimeout(() => setShowDropdown1(false), 200)}
                    placeholder={t('selectPerson')}
                    className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              )}

              {/* Dropdown */}
              {showDropdown1 && !selectedMember1 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredMembers1.length > 0 ? (
                    filteredMembers1.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setPerson1(member.id);
                          setSearchQuery1('');
                          setShowDropdown1(false);
                          setResult(null);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Avatar className="w-8 h-8">
                          {member.avatar_url && (
                            <AvatarImage src={member.avatar_url} alt={getName(member)} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-medium">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900 dark:text-white truncate">
                          {getName(member)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {locale === 'ru' ? 'Никого не найдено' : 'No one found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Person 2 Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('person2')}
            </label>
            <div className="relative">
              {selectedMember2 ? (
                <button
                  onClick={() => {
                    setPerson2('');
                    setSearchQuery2('');
                    setShowDropdown2(true);
                    setResult(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    {selectedMember2.avatar_url && (
                      <AvatarImage src={selectedMember2.avatar_url} alt={getName(selectedMember2)} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-medium">
                      {getInitials(selectedMember2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {getName(selectedMember2)}
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery2}
                    onChange={e => {
                      setSearchQuery2(e.target.value);
                      setShowDropdown2(true);
                    }}
                    onFocus={() => setShowDropdown2(true)}
                    onBlur={() => setTimeout(() => setShowDropdown2(false), 200)}
                    placeholder={t('selectPerson')}
                    className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              )}

              {/* Dropdown */}
              {showDropdown2 && !selectedMember2 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredMembers2.length > 0 ? (
                    filteredMembers2.map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setPerson2(member.id);
                          setSearchQuery2('');
                          setShowDropdown2(false);
                          setResult(null);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Avatar className="w-8 h-8">
                          {member.avatar_url && (
                            <AvatarImage src={member.avatar_url} alt={getName(member)} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-medium">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900 dark:text-white truncate">
                          {getName(member)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {locale === 'ru' ? 'Никого не найдено' : 'No one found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Search button */}
        <div className="mt-6">
          <Button
            onClick={handleSearch}
            disabled={loading || !person1 || !person2}
            variant="gradient"
            size="lg"
            className="w-full"
            loading={loading}
            leftIcon={!loading ? <Search className="w-5 h-5" /> : undefined}
          >
            {loading ? t('searching') : t('findConnection')}
          </Button>
        </div>
      </GlassCard>

      {/* Results */}
      {result && (
        <GlassCard glass="medium" padding={compact ? 'md' : 'lg'}>
          {result.found ? (
            <div className="space-y-6">
              {/* Connection header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                  <span>{getName(selectedMember1)}</span>
                  <span className="text-violet-500">{t('and')}</span>
                  <span>{getName(selectedMember2)}</span>
                </div>
              </div>

              {/* Path visualization */}
              <PathVisualization
                result={result}
                locale={locale}
                showExport={!compact}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {t('noConnectionFound')}
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {t('noConnectionDescription')}
              </p>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
