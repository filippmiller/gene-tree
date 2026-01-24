'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AskElderForm from '@/components/elder-questions/AskElderForm';
import QuestionList from '@/components/elder-questions/QuestionList';

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  birth_date: string | null;
}

interface ElderQuestionsClientProps {
  familyMembers: FamilyMember[];
  currentUserId: string;
}

export default function ElderQuestionsClient({
  familyMembers,
  currentUserId,
}: ElderQuestionsClientProps) {
  const [selectedElder, setSelectedElder] = useState<FamilyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleAskSuccess = () => {
    setShowForm(false);
    setSelectedElder(null);
    setRefreshKey((k) => k + 1);
  };

  // Filter out current user from the list of elders
  const availableElders = familyMembers.filter((m) => m.id !== currentUserId);

  return (
    <>
      {/* Select Elder to Ask */}
      {!showForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select a Family Member to Ask</h2>
            {availableElders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No family members found. Add family members to ask them questions.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableElders.map((member) => {
                  const age = calculateAge(member.birth_date);
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedElder(member);
                        setShowForm(true);
                      }}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left"
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold">
                          {member.first_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        {age !== null && (
                          <p className="text-sm text-gray-500">Age {age}</p>
                        )}
                      </div>
                      <span className="text-2xl">📜</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ask Form */}
      {showForm && selectedElder && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <AskElderForm
              elderId={selectedElder.id}
              elderName={[selectedElder.first_name, selectedElder.last_name].filter(Boolean).join(' ') || '?'}
              onSuccess={handleAskSuccess}
              onCancel={() => {
                setShowForm(false);
                setSelectedElder(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Question List */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Questions & Answers</h2>
          <QuestionList key={refreshKey} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </>
  );
}
