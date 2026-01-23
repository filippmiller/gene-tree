'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { PhotoTagWithProfile } from '@/types/photo-tags';

interface TagMarkerProps {
  tag: PhotoTagWithProfile;
  isCurrentUser?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
  onConfirm?: (confirmed: boolean) => void;
}

export default function TagMarker({
  tag,
  isCurrentUser = false,
  canRemove = false,
  onRemove,
  onConfirm,
}: TagMarkerProps) {
  const t = useTranslations('photoTags');
  const [showTooltip, setShowTooltip] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fullName = `${tag.tagged_profile.first_name} ${tag.tagged_profile.last_name}`.trim();

  const handleConfirm = async (confirmed: boolean) => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm?.(confirmed);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="absolute group"
      style={{
        left: `${tag.x_percent}%`,
        top: `${tag.y_percent}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tag marker */}
      <div
        className={`
          w-6 h-6 rounded-full border-2 cursor-pointer transition-all
          ${tag.is_confirmed
            ? 'border-green-400 bg-green-400/30'
            : 'border-yellow-400 bg-yellow-400/30'
          }
          group-hover:scale-125
        `}
      />

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bg-white rounded-lg shadow-lg p-3 min-w-48"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          }}
        >
          {/* Arrow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />

          {/* Content */}
          <div className="flex items-start gap-3">
            {tag.tagged_profile.avatar_url ? (
              <img
                src={tag.tagged_profile.avatar_url}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                {tag.tagged_profile.first_name?.[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${tag.tagged_profile_id}`}
                className="font-medium text-gray-900 hover:underline block truncate"
              >
                {fullName}
              </Link>

              <p className="text-xs text-gray-500 mt-0.5">
                {t('taggedBy')} {tag.tagger.first_name} {tag.tagger.last_name}
              </p>

              {/* Confirmation status */}
              {tag.is_confirmed ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('confirmed')}
                </span>
              ) : (
                <span className="text-xs text-yellow-600 mt-1">
                  {t('pendingConfirmation')}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
            {/* Confirm/Deny buttons for tagged user */}
            {isCurrentUser && !tag.is_confirmed && (
              <>
                <button
                  onClick={() => handleConfirm(true)}
                  disabled={confirming}
                  className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                >
                  {t('confirmTag')}
                </button>
                <button
                  onClick={() => onRemove?.()}
                  disabled={confirming}
                  className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  {t('removeMe')}
                </button>
              </>
            )}

            {/* Remove button for tagger or tagged person */}
            {canRemove && (isCurrentUser ? tag.is_confirmed : true) && (
              <button
                onClick={onRemove}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                {t('removeTag')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
