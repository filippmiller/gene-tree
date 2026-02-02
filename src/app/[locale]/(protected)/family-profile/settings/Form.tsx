"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile } from './actions';
import type { UserProfile } from './types';
import DigestPreferences from '@/components/digest/DigestPreferences';
import { PresenceSettings } from '@/components/presence';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300">
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  );
}

export default function SettingsForm({ initial }: { initial: UserProfile }) {
  const [state, formAction] = useFormState(updateProfile, null);

  return (
    <div className="space-y-8">
      {/* Profile Information Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{state.error}</div>
          )}
          {state?.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">Changes saved</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input name="first_name" defaultValue={initial?.first_name || ''} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input name="last_name" defaultValue={initial?.last_name || ''} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input name="middle_name" defaultValue={initial?.middle_name || ''} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" defaultValue={initial?.gender || ''} className="w-full px-3 py-2 border rounded">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
              <input type="date" name="birth_date" defaultValue={initial?.birth_date || ''} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
              <input name="birth_place" defaultValue={initial?.birth_place || ''} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" defaultValue={initial?.phone || ''} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input name="occupation" defaultValue={initial?.occupation || ''} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea name="bio" rows={4} defaultValue={initial?.bio || ''} className="w-full px-3 py-2 border rounded" />
          </div>

          <SubmitBtn />
        </form>
      </div>

      {/* Online Presence Settings */}
      <PresenceSettings initialShowOnlineStatus={(initial as { show_online_status?: boolean })?.show_online_status ?? true} />

      {/* Email Preferences Section */}
      <DigestPreferences />
    </div>
  );
}
