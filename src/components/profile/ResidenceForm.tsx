'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import { logger } from '@/lib/logger';

type DatePrecision = 'day' | 'month' | 'year' | 'unknown';
type CertaintyLevel = 'certain' | 'approximate' | 'unknown';
type VisibilityLevel = 'public' | 'family' | 'private';

interface ResidenceFormData {
  place_text: string;
  country?: string;
  region?: string;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
  apartment?: string;
  postal_code?: string;
  start_date?: string;
  start_precision: DatePrecision;
  end_date?: string;
  end_precision: DatePrecision;
  is_current: boolean;
  certainty: CertaintyLevel;
  visibility: VisibilityLevel;
  notes?: string;
}

export default function ResidenceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<ResidenceFormData>({
    place_text: '',
    start_precision: 'year',
    end_precision: 'year',
    is_current: false,
    certainty: 'certain',
    visibility: 'family', // More private by default
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
        .from('person_residence')
        .insert({
          person_id: user.id,
          ...formData,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      logger.info('[RESIDENCE] Added successfully');
      onSuccess?.();
      
      // Reset form
      setFormData({
        place_text: '',
        start_precision: 'year',
        end_precision: 'year',
        is_current: false,
        certainty: 'certain',
        visibility: 'family',
      });
    } catch (err: any) {
      logger.error('[RESIDENCE] Error:', err);
      setError(err.message || 'Failed to add residence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900">Add Place of Residence</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Place Name (Simple input) */}
      <div>
        <Label>Place Name / Summary *</Label>
        <Input
          value={formData.place_text}
          onChange={(e) => setFormData({ ...formData, place_text: e.target.value })}
          placeholder="New York City, USA"
          required
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Quick name for this location (e.g. "Lived in Moscow" or full address)
        </p>
      </div>

      {/* Detailed Address */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Detailed Address (optional)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Country</Label>
            <Input
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="United States"
              className="mt-1"
            />
          </div>

          <div>
            <Label>State / Oblast / Region</Label>
            <Input
              value={formData.region || ''}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="California"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Los Angeles"
              className="mt-1"
            />
          </div>

          <div>
            <Label>District / County</Label>
            <Input
              value={formData.district || ''}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="Hollywood"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Street Address</Label>
          <Input
            value={formData.street || ''}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            placeholder="123 Main Street"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Building</Label>
            <Input
              value={formData.building || ''}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              placeholder="5A"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Apartment</Label>
            <Input
              value={formData.apartment || ''}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              placeholder="23"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Postal Code</Label>
            <Input
              value={formData.postal_code || ''}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="90028"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Moved In</Label>
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
          <Label>Moved Out</Label>
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

      {/* Currently Living */}
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
        <Label className="mb-0">Currently living here</Label>
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
          placeholder="Any additional information about this residence..."
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !formData.place_text}
          className="flex-1"
        >
          {loading ? 'Adding...' : 'Add Residence'}
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
