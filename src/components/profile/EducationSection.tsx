/**
 * EducationSection Component
 * 
 * Displays user's education history with ability to add/edit/delete entries.
 * - Shows list of education records
 * - "Add Education" button opens form modal
 * - Each entry can be edited or deleted
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import EducationForm from './EducationForm';
import EducationList from './EducationList';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

interface Props {
  userId: string;
}

export default function EducationSection({ userId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [education, setEducation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducation();
  }, [userId]);

  const fetchEducation = async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('person_education')
        .select('*')
        .eq('person_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEducation(data || []);
    } catch (err) {
      logger.error('[EDUCATION-SECTION] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchEducation(); // Refresh list
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎓 Education</h2>
          <p className="text-sm text-gray-600 mt-1">
            Schools, colleges, and universities you attended
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Education'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <EducationForm onSuccess={handleSuccess} />
        </div>
      )}

      <EducationList
        education={education}
        loading={loading}
      />
    </section>
  );
}
