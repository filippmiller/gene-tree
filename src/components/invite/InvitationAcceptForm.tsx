'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  invitation: any;
  locale: string;
}

export default function InvitationAcceptForm({ invitation, locale }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editable fields
  const [firstName, setFirstName] = useState(invitation.first_name);
  const [lastName, setLastName] = useState(invitation.last_name);
  const [dateOfBirth, setDateOfBirth] = useState(invitation.date_of_birth || '');

  /**
   * Accept invitation - creates user account and relationship
   */
  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.invitation_token,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось принять приглашение');
      }

      // Redirect to magic link page for zero-friction auth
      // The magic link will authenticate and redirect to the app
      const redirectUrl = invitation.email
        ? `/${locale}/magic-link?email=${encodeURIComponent(invitation.email)}&redirect=${encodeURIComponent(`/${locale}/app`)}`
        : `/${locale}/magic-link?redirect=${encodeURIComponent(`/${locale}/app`)}`;

      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reject invitation - marks as rejected
   */
  const handleReject = async () => {
    if (!confirm('Вы уверены, что хотите отклонить приглашение?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.invitation_token,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось отклонить приглашение');
      }

      // Show success message
      alert('Приглашение отклонено');
      router.push(`/${locale}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {mode === 'view' ? (
        // View mode - Confirm or Edit
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Подтвердите ваши данные
          </h3>

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Обработка...' : '✓ Подтвердить и продолжить'}
            </button>
            
            <button
              onClick={() => setMode('edit')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              ✏️ Исправить
            </button>
          </div>

          <button
            onClick={handleReject}
            disabled={loading}
            className="w-full px-6 py-2 text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
          >
            Отклонить приглашение
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        // Edit mode - Update information
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Исправьте данные
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата рождения (необязательно)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAccept}
              disabled={loading || !firstName || !lastName}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить и продолжить'}
            </button>
            
            <button
              onClick={() => setMode('view')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Отмена
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        После подтверждения мы отправим вам магическую ссылку на email для моментального входа - без пароля!
      </div>
    </div>
  );
}
