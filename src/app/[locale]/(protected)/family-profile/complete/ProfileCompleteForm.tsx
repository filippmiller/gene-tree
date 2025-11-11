'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProfile } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving Profile...' : 'Continue to Dashboard'}
    </button>
  );
}

interface ProfileData {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  maiden_name?: string | null;
  nickname?: string | null;
  gender?: string;
  birth_date?: string | null;
  birth_place?: string | null;
  phone?: string | null;
  occupation?: string | null;
  bio?: string | null;
}

interface Props {
  initialData?: ProfileData | null;
}

export default function ProfileCompleteForm({ initialData }: Props) {
  const [state, formAction] = useActionState(createProfile, null);

  return (
    <>
      {state?.error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                defaultValue={initialData?.first_name || ''}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                defaultValue={initialData?.middle_name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Michael"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                defaultValue={initialData?.last_name || ''}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maiden Name (if applicable)
              </label>
              <input
                type="text"
                name="maiden_name"
                defaultValue={initialData?.maiden_name || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                name="nickname"
                defaultValue={initialData?.nickname || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Johnny"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                defaultValue={initialData?.gender || ''}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Birth Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Birth Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="birth_date"
                defaultValue={initialData?.birth_date || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place of Birth
              </label>
              <input
                type="text"
                name="birth_place"
                defaultValue={initialData?.birth_place || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Contact & Additional */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Contact & Additional Info</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={initialData?.phone || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <input
                type="text"
                name="occupation"
                defaultValue={initialData?.occupation || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio / About Me
            </label>
            <textarea
              name="bio"
              rows={4}
              defaultValue={initialData?.bio || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us a bit about yourself..."
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <SubmitButton />
          <p className="text-xs text-gray-500 text-center mt-4">
            You can update these details later from your profile settings
          </p>
        </div>
      </form>
    </>
  );
}
