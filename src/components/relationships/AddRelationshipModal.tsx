'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RelationshipType } from '@/types/database';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
}

interface AddRelationshipModalProps {
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'uncle_aunt', label: 'Uncle/Aunt' },
  { value: 'nephew_niece', label: 'Nephew/Niece' },
  { value: 'cousin', label: 'Cousin' },
];

export default function AddRelationshipModal({
  currentUserId,
  onClose,
  onSuccess,
}: AddRelationshipModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('parent');
  const [marriageDate, setMarriageDate] = useState('');
  const [marriagePlace, setMarriagePlace] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // Filter out current user
      const filteredUsers = (data.users || []).filter((u: UserProfile) => u.id !== currentUserId);
      setUsers(filteredUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('Please select a person');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body: any = {
        user2_id: selectedUserId,
        relationship_type: relationshipType,
      };

      if (relationshipType === 'spouse' && marriageDate) {
        body.marriage_date = marriageDate;
      }
      if (relationshipType === 'spouse' && marriagePlace) {
        body.marriage_place = marriagePlace;
      }

      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create relationship');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || user.email.toLowerCase().includes(query);
  });

  const getDisplayName = (user: UserProfile) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.email;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle>Add Family Relationship</CardTitle>
          <CardDescription>Select a person and define your relationship</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Users */}
            <div className="space-y-2">
              <Label>Search for a person</Label>
              <Input
                type="text"
                placeholder="Type name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* User List */}
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading users...</div>
            ) : (
              <div className="space-y-2">
                <Label>Select person</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-600">
                      {searchQuery ? 'No users found' : 'No other users available'}
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                          selectedUserId === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{getDisplayName(user)}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Relationship Type */}
            <div className="space-y-2">
              <Label htmlFor="relationship_type">Relationship Type</Label>
              <select
                id="relationship_type"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {RELATIONSHIP_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                {relationshipType === 'parent' && 'You are the parent of this person'}
                {relationshipType === 'child' && 'You are the child of this person'}
                {relationshipType === 'spouse' && 'You are married to this person'}
                {relationshipType === 'sibling' && 'You are siblings with this person'}
              </p>
            </div>

            {/* Marriage Details (only for spouse) */}
            {relationshipType === 'spouse' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="marriage_date">Marriage Date (optional)</Label>
                  <Input
                    id="marriage_date"
                    type="date"
                    value={marriageDate}
                    onChange={(e) => setMarriageDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marriage_place">Marriage Place (optional)</Label>
                  <Input
                    id="marriage_place"
                    type="text"
                    placeholder="City, Country"
                    value={marriagePlace}
                    onChange={(e) => setMarriagePlace(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={!selectedUserId || submitting}
                className="flex-1"
              >
                {submitting ? 'Adding...' : 'Add Relationship'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
