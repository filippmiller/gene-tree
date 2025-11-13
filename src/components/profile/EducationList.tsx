/**
 * EducationList Component
 * 
 * Displays a list of education entries.
 * Each entry shows:
 * - Institution name
 * - Type (school/university/etc)
 * - Dates (with precision indicators like ~)
 * - Status (graduated/attended/current)
 * - Edit/Delete buttons
 */

'use client';

import { formatEducationDates } from '@/lib/utils/date-formatter';
import { getEducationIcon } from '@/lib/utils/education-icons';

interface EducationEntry {
  id: string;
  type: string;
  status: string;
  institution_text: string;
  faculty?: string;
  major?: string;
  degree?: string;
  start_date?: string;
  start_precision: string;
  end_date?: string;
  end_precision: string;
  is_current: boolean;
  certainty: string;
}

interface Props {
  education: EducationEntry[];
  loading: boolean;
  onRefresh: () => void;
}

export default function EducationList({ education, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading education history...
      </div>
    );
  }

  if (education.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No education entries yet</p>
        <p className="text-sm">Click "Add Education" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {education.map((entry) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="text-3xl">{getEducationIcon(entry.type)}</div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {entry.institution_text}
              </h3>
              
              {entry.faculty && (
                <p className="text-gray-600 text-sm">{entry.faculty}</p>
              )}
              
              {entry.major && (
                <p className="text-gray-600 text-sm">{entry.major}</p>
              )}
              
              {entry.degree && (
                <p className="text-gray-600 text-sm">{entry.degree}</p>
              )}

              <p className="text-gray-500 text-sm mt-2">
                {formatEducationDates(entry)}
              </p>

              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {entry.status}
                </span>
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
