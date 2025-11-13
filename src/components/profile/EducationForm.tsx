'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

type EducationType = 'school' | 'college' | 'university' | 'vocational' | 'graduate';
type EducationStatus = 'attended' | 'graduated' | 'current' | 'dropped_out';
type DatePrecision = 'day' | 'month' | 'year' | 'unknown';
type CertaintyLevel = 'certain' | 'approximate' | 'unknown';
type VisibilityLevel = 'public' | 'family' | 'private';

interface EducationFormData {
  type: EducationType;
  status: EducationStatus;
  institution_text: string;
  faculty?: string;
  major?: string;
  degree?: string;
  grade_level?: string;
  start_date?: string;
  start_precision: DatePrecision;
  end_date?: string;
  end_precision: DatePrecision;
  is_current: boolean;
  certainty: CertaintyLevel;
  visibility: VisibilityLevel;
  notes?: string;
}

export default function EducationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<EducationFormData>({
    type: 'university',
    status: 'attended',
    institution_text: '',
    start_precision: 'year',
    end_precision: 'year',
    is_current: false,
    certainty: 'certain',
    visibility: 'public',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error: insertError } = await supabase
        .from('person_education')
        .insert({
          person_id: user.id,
          ...formData,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      logger.info('[EDUCATION] Added successfully');
      onSuccess?.();
      
      // Reset form
      setFormData({
        type: 'university',
        status: 'attended',
        institution_text: '',
        start_precision: 'year',
        end_precision: 'year',
        is_current: false,
        certainty: 'certain',
        visibility: 'public',
      });
    } catch (err: any) {
      logger.error('[EDUCATION] Error:', err);
      setError(err.message || 'Failed to add education');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900">Add Education</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Type */}
      <div>
        <Label>Type</Label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as EducationType })}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="school">School</option>
          <option value="college">College</option>
          <option value="university">University</option>
          <option value="vocational">Vocational School</option>
          <option value="graduate">Graduate School</option>
        </select>
      </div>

      {/* Institution */}
      <div>
        <Label>Institution Name *</Label>
        <Input
          value={formData.institution_text}
          onChange={(e) => setFormData({ ...formData, institution_text: e.target.value })}
          placeholder="Harvard University"
          required
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Start typing to search or enter manually
        </p>
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as EducationStatus })}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="attended">Attended</option>
          <option value="graduated">Graduated</option>
          <option value="current">Currently Studying</option>
          <option value="dropped_out">Dropped Out</option>
        </select>
      </div>

      {/* Faculty & Major (for university/college) */}
      {(formData.type === 'university' || formData.type === 'college' || formData.type === 'graduate') && (
        <>
          <div>
            <Label>Faculty / School</Label>
            <Input
              value={formData.faculty || ''}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              placeholder="School of Engineering"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Major / Specialization</Label>
            <Input
              value={formData.major || ''}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="Computer Science"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Degree</Label>
            <Input
              value={formData.degree || ''}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="Bachelor of Science"
              className="mt-1"
            />
          </div>
        </>
      )}

      {/* Grade Level (for school) */}
      {formData.type === 'school' && (
        <div>
          <Label>Grade Level</Label>
          <Input
            value={formData.grade_level || ''}
            onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
            placeholder="10th grade"
            className="mt-1"
          />
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="mt-1"
          />
          <select
            value={formData.start_precision}
            onChange={(e) => setFormData({ ...formData, start_precision: e.target.value as DatePrecision })}
            className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="day">Exact Day</option>
            <option value="month">Month Only</option>
            <option value="year">Year Only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
            className="mt-1"
          />
          <select
            value={formData.end_precision}
            onChange={(e) => setFormData({ ...formData, end_precision: e.target.value as DatePrecision })}
            disabled={formData.is_current}
            className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="day">Exact Day</option>
            <option value="month">Month Only</option>
            <option value="year">Year Only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Currently Studying */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.is_current}
          onChange={(e) => setFormData({ 
            ...formData, 
            is_current: e.target.checked,
            end_date: e.target.checked ? undefined : formData.end_date
          })}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <Label className="mb-0">Currently studying here</Label>
      </div>

      {/* Certainty */}
      <div>
        <Label>How certain are you about these dates?</Label>
        <select
          value={formData.certainty}
          onChange={(e) => setFormData({ ...formData, certainty: e.target.value as CertaintyLevel })}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="certain">Certain / Exact</option>
          <option value="approximate">Approximate / ~</option>
          <option value="unknown">Don't Remember</option>
        </select>
      </div>

      {/* Visibility */}
      <div>
        <Label>Who can see this?</Label>
        <select
          value={formData.visibility}
          onChange={(e) => setFormData({ ...formData, visibility: e.target.value as VisibilityLevel })}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="public">👁️ Public - Everyone</option>
          <option value="family">👨‍👩‍👧‍👦 Family Only</option>
          <option value="private">🔒 Only Me</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes (optional)</Label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information..."
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !formData.institution_text}
          className="flex-1"
        >
          {loading ? 'Adding...' : 'Add Education'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
