'use client';

/**
 * PresenceSettings
 *
 * Component for managing online presence privacy settings.
 * Allows users to toggle whether their online status is visible to family members.
 */

import { useState, useEffect, useTransition } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface PresenceSettingsProps {
  /**
   * Initial value for show_online_status
   */
  initialShowOnlineStatus?: boolean;
}

export function PresenceSettings({
  initialShowOnlineStatus = true,
}: PresenceSettingsProps) {
  const [showOnlineStatus, setShowOnlineStatus] = useState(initialShowOnlineStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current setting on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/presence/settings');
        if (response.ok) {
          const data = await response.json();
          setShowOnlineStatus(data.show_online_status ?? true);
        }
      } catch (err) {
        console.error('Failed to fetch presence settings:', err);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = () => {
    const newValue = !showOnlineStatus;
    setShowOnlineStatus(newValue);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const response = await fetch('/api/presence/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ show_online_status: newValue }),
        });

        if (!response.ok) {
          throw new Error('Failed to update settings');
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err) {
        setShowOnlineStatus(!newValue); // Revert on error
        setError('Failed to update setting. Please try again.');
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Online Presence</h2>
      <p className="text-sm text-gray-600 mb-4">
        Control whether family members can see when you&apos;re online.
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showOnlineStatus ? (
            <Eye className="w-5 h-5 text-emerald-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="font-medium text-gray-900">Show my online status</p>
            <p className="text-sm text-gray-500">
              {showOnlineStatus
                ? 'Family members can see when you\'re online'
                : 'Your online status is hidden'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showOnlineStatus}
          onClick={handleToggle}
          disabled={isPending}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showOnlineStatus ? 'bg-emerald-500' : 'bg-gray-300'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${showOnlineStatus ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
          {isPending && (
            <Loader2 className="absolute -right-6 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          Settings saved
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">What this means:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
            <span>When enabled, a green dot appears on your avatar when you&apos;re online</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
            <span>Family members can see &quot;Last seen X ago&quot; when you&apos;re offline</span>
          </li>
          <li className="flex items-start gap-2">
            <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>When disabled, your presence is completely hidden</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default PresenceSettings;
