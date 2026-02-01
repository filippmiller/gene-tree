'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectedPerson } from '@/lib/memory-book/types';

interface PeopleSelectorProps {
  selectedPeople: SelectedPerson[];
  onSelectionChange: (people: SelectedPerson[]) => void;
}

interface PersonFromAPI {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_living: boolean;
  bio: string | null;
  occupation: string | null;
  birth_place: string | null;
}

export default function PeopleSelector({
  selectedPeople,
  onSelectionChange,
}: PeopleSelectorProps) {
  const [people, setPeople] = useState<PersonFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setPeople(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPeople = people.filter((person) => {
    const fullName = `${person.first_name} ${person.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const isSelected = (personId: string) =>
    selectedPeople.some((p) => p.id === personId);

  const togglePerson = (person: PersonFromAPI) => {
    if (isSelected(person.id)) {
      onSelectionChange(selectedPeople.filter((p) => p.id !== person.id));
    } else {
      const selectedPerson: SelectedPerson = {
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        avatarUrl: person.avatar_url,
        birthDate: person.birth_date,
        deathDate: person.death_date,
        isLiving: person.is_living,
        bio: person.bio,
        occupation: person.occupation,
        birthPlace: person.birth_place,
      };
      onSelectionChange([...selectedPeople, selectedPerson]);
    }
  };

  const removeSelected = (personId: string) => {
    onSelectionChange(selectedPeople.filter((p) => p.id !== personId));
  };

  return (
    <div className="space-y-4">
      {/* Selected people chips */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          {selectedPeople.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200 shadow-sm"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={person.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {person.firstName[0]}
                  {person.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {person.firstName} {person.lastName}
              </span>
              <button
                onClick={() => removeSelected(person.id)}
                className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search family members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* People list */}
      <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-2">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </>
        ) : filteredPeople.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No family members found</p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <button
              key={person.id}
              onClick={() => togglePerson(person)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                isSelected(person.id) && 'bg-blue-50 hover:bg-blue-100'
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={person.avatar_url || undefined} />
                <AvatarFallback>
                  {person.first_name[0]}
                  {person.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">
                  {person.first_name} {person.last_name}
                </p>
                {person.occupation && (
                  <p className="text-xs text-gray-500">{person.occupation}</p>
                )}
              </div>
              {isSelected(person.id) && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {selectedPeople.length} people selected
      </p>
    </div>
  );
}
