/**
 * ResidenceList Component
 * 
 * Displays a list of residence entries.
 * Shows place name, address details, and dates with precision.
 */

'use client';

import { formatResidenceDates } from '@/lib/utils/date-formatter';

interface ResidenceEntry {
  id: string;
  place_text: string;
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  start_date?: string;
  start_precision: string;
  end_date?: string;
  end_precision: string;
  is_current: boolean;
  certainty: string;
}

interface Props {
  residences: ResidenceEntry[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ResidenceList({ residences, loading }: Props) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading residence history...
      </div>
    );
  }

  if (residences.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No residence entries yet</p>
        <p className="text-sm">Click "Add Residence" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {residences.map((entry) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="text-3xl">📍</div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {entry.place_text}
              </h3>

              {/* Address details */}
              {(entry.street || entry.city || entry.region) && (
                <p className="text-gray-600 text-sm mt-1">
                  {[entry.street, entry.city, entry.region, entry.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}

              <p className="text-gray-500 text-sm mt-2">
                {formatResidenceDates(entry)}
              </p>

              <div className="flex gap-2 mt-2">
                {entry.is_current && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    Current
                  </span>
                )}
                {entry.certainty === 'approximate' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                    ~ Approximate
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-600">
                ✏️
              </button>
              <button className="text-gray-400 hover:text-red-600">
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
