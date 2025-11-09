'use client';

import { useState, useEffect } from 'react';
// Removed non-existent UI dependencies
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import { RelationshipType, RelationshipLabels } from '@/types/database';
import AddRelationshipModal from './AddRelationshipModal';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
}

interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  relationship_type: RelationshipType;
  marriage_date: string | null;
  marriage_place: string | null;
  divorce_date: string | null;
  created_at: string;
  user1?: User;
  user2?: User;
}

export default function RelationshipsList({ currentUserId }: { currentUserId: string }) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRelationships();
    // Expose function to open modal from parent
    (window as any).openAddRelationship = () => setShowAddModal(true);
    return () => {
      delete (window as any).openAddRelationship;
    };
  }, []);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/relationships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const data = await response.json();
      setRelationships(data.relationships || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRelationship = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) {
      return;
    }

    try {
      const response = await fetch(`/api/relationships/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete relationship');
      }

      await fetchRelationships();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getRelatedPerson = (rel: Relationship): User | null => {
    if (rel.user1_id === currentUserId) {
      return rel.user2 || null;
    }
    return rel.user1 || null;
  };

  const getDisplayName = (user: User | null): string => {
    if (!user) return 'Unknown';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  const getRelationshipDirection = (rel: Relationship): { person: User | null; type: string; isReverse: boolean } => {
    const isUserAsUser1 = rel.user1_id === currentUserId;
    const person = getRelatedPerson(rel);
    
    if (isUserAsUser1) {
      // User is user1, so relationship is direct
      return { person, type: rel.relationship_type, isReverse: false };
    } else {
      // User is user2, so we need to reverse the relationship
      const reverseType = getReverseRelationshipType(rel.relationship_type);
      return { person, type: reverseType, isReverse: true };
    }
  };

  const getReverseRelationshipType = (type: RelationshipType): string => {
    const reverseMap: Record<RelationshipType, string> = {
      parent: 'child',
      child: 'parent',
      grandparent: 'grandchild',
      grandchild: 'grandparent',
      uncle_aunt: 'nephew_niece',
      nephew_niece: 'uncle_aunt',
      spouse: 'spouse',
      sibling: 'sibling',
      cousin: 'cousin',
    };
    return reverseMap[type] || type;
  };

  const groupRelationshipsByType = () => {
    const grouped: Record<string, Relationship[]> = {};
    
    relationships.forEach(rel => {
      const { type } = getRelationshipDirection(rel);
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(rel);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading relationships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchRelationships} 
          className="mt-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships yet</h3>
          <p className="text-gray-600 mb-4">Start building your family tree by adding relationships</p>
        </div>
      </div>
    );
  }

  const grouped = groupRelationshipsByType();

  return (
    <>
      {showAddModal && (
        <AddRelationshipModal
          currentUserId={currentUserId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchRelationships();
            setShowAddModal(false);
          }}
        />
      )}
      <div className="space-y-6">
      {Object.entries(grouped).map(([type, rels]) => {
        const label = RelationshipLabels[type as RelationshipType]?.plural || type;
        
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-lg">{label}</CardTitle>
              <CardDescription>{rels.length} {rels.length === 1 ? 'person' : 'people'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rels.map(rel => {
                  const { person } = getRelationshipDirection(rel);
                  const displayName = getDisplayName(person);
                  
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{displayName}</p>
                          {rel.marriage_date && (
                            <p className="text-sm text-gray-600">
                              Married: {new Date(rel.marriage_date).toLocaleDateString()}
                            </p>
                          )}
                          {rel.divorce_date && (
                            <p className="text-sm text-gray-600">
                              Divorced: {new Date(rel.divorce_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRelationship(rel.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </>
  );
}
