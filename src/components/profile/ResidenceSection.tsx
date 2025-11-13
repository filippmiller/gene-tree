/**
 * ResidenceSection Component
 * 
 * Displays user's residence history with ability to add/edit/delete entries.
 * Similar to EducationSection but for places of residence.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ResidenceForm from './ResidenceForm';
import ResidenceList from './ResidenceList';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

interface Props {
  userId: string;
}

export default function ResidenceSection({ userId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [residences, setResidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidences();
  }, [userId]);

  const fetchResidences = async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('person_residence')
        .select('*')
        .eq('person_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setResidences(data || []);
    } catch (err) {
      logger.error('[RESIDENCE-SECTION] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchResidences(); // Refresh list
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏠 Places of Residence</h2>
          <p className="text-sm text-gray-600 mt-1">
            Where you've lived throughout your life
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Residence'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ResidenceForm onSuccess={handleSuccess} />
        </div>
      )}

      <ResidenceList
        residences={residences}
        loading={loading}
        onRefresh={fetchResidences}
      />
    </section>
  );
}
