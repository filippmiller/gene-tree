'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { PhotoTagWithProfile, AddPhotoTagRequest } from '@/types/photo-tags';
import TagMarker from './TagMarker';

interface PhotoTagOverlayProps {
  photoId: string;
  photoUrl: string;
  photoAlt?: string;
  tags: PhotoTagWithProfile[];
  canTag?: boolean;
  currentUserId?: string;
  onTagAdded?: (tag: PhotoTagWithProfile) => void;
  onTagRemoved?: (tagId: string) => void;
  onTagConfirmed?: (tag: PhotoTagWithProfile) => void;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default function PhotoTagOverlay({
  photoId,
  photoUrl,
  photoAlt = 'Photo',
  tags,
  canTag = true,
  currentUserId,
  onTagAdded,
  onTagRemoved,
  onTagConfirmed,
}: PhotoTagOverlayProps) {
  const t = useTranslations('photoTags');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isTagMode, setIsTagMode] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTags, setShowTags] = useState(true);

  // Fetch family members for tagging
  const fetchFamilyMembers = useCallback(async () => {
    if (familyMembers.length > 0) return;
    setLoadingMembers(true);
    try {
      const res = await fetch('/api/relatives?include_self=true');
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data.relatives || []);
      }
    } catch (err) {
      console.error('Failed to fetch family members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [familyMembers.length]);

  useEffect(() => {
    if (showSearch && familyMembers.length === 0) {
      fetchFamilyMembers();
    }
  }, [showSearch, familyMembers.length, fetchFamilyMembers]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPosition({ x, y });
    setShowSearch(true);
    setSearchQuery('');
  };

  const handleSelectPerson = async (person: FamilyMember) => {
    if (!pendingPosition || saving) return;

    // Check if person is already tagged
    if (tags.some(tag => tag.tagged_profile_id === person.id)) {
      alert(t('alreadyTagged'));
      return;
    }

    setSaving(true);
    try {
      const body: AddPhotoTagRequest = {
        tagged_profile_id: person.id,
        x_percent: pendingPosition.x,
        y_percent: pendingPosition.y,
      };

      const res = await fetch(`/api/photos/${photoId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        onTagAdded?.(data.tag);
        setPendingPosition(null);
        setShowSearch(false);
        setIsTagMode(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/photos/${photoId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onTagRemoved?.(tagId);
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const handleConfirmTag = async (tagId: string, isConfirmed: boolean) => {
    try {
      const res = await fetch(`/api/photos/${photoId}/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_confirmed: isConfirmed }),
      });

      if (res.ok) {
        const data = await res.json();
        onTagConfirmed?.(data.tag);
      }
    } catch (err) {
      console.error('Failed to confirm tag:', err);
    }
  };

  const cancelTagging = () => {
    setPendingPosition(null);
    setShowSearch(false);
    setIsTagMode(false);
  };

  const filteredMembers = familyMembers.filter(m => {
    if (!searchQuery) return true;
    const fullName = [m.first_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative" ref={containerRef}>
      {/* Photo with overlay */}
      <div
        className={`relative ${isTagMode ? 'cursor-crosshair' : ''}`}
        onClick={handleImageClick}
      >
        <img
          ref={imageRef}
          src={photoUrl}
          alt={photoAlt}
          className="w-full h-auto"
        />

        {/* Tag markers */}
        {showTags && tags.map(tag => (
          <TagMarker
            key={tag.id}
            tag={tag}
            isCurrentUser={tag.tagged_profile_id === currentUserId}
            canRemove={tag.tagged_by === currentUserId || tag.tagged_profile_id === currentUserId}
            onRemove={() => handleRemoveTag(tag.id)}
            onConfirm={(confirmed) => handleConfirmTag(tag.id, confirmed)}
          />
        ))}

        {/* Pending tag position */}
        {pendingPosition && (
          <div
            className="absolute w-4 h-4 -ml-2 -mt-2 bg-blue-500 rounded-full animate-pulse border-2 border-white"
            style={{
              left: `${pendingPosition.x}%`,
              top: `${pendingPosition.y}%`,
            }}
          />
        )}
      </div>

      {/* Tag mode controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        {/* Toggle tags visibility */}
        <button
          onClick={() => setShowTags(!showTags)}
          className="bg-black/50 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          {showTags ? t('hideTags') : t('showTags')}
          {tags.length > 0 && ` (${tags.length})`}
        </button>

        {/* Tag button */}
        {canTag && (
          <button
            onClick={() => isTagMode ? cancelTagging() : setIsTagMode(true)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              isTagMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isTagMode ? t('cancelTagging') : t('tagPeople')}
          </button>
        )}
      </div>

      {/* Person search modal */}
      {showSearch && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm max-h-80 overflow-hidden">
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder={t('searchFamily')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto max-h-48">
              {loadingMembers ? (
                <div className="p-4 text-center text-gray-500">
                  {t('loading')}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {t('noResults')}
                </div>
              ) : (
                <ul>
                  {filteredMembers.map(member => (
                    <li key={member.id}>
                      <button
                        onClick={() => handleSelectPerson(member)}
                        disabled={saving || tags.some(t => t.tagged_profile_id === member.id)}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {member.first_name?.[0]}
                          </div>
                        )}
                        <span className="text-sm">
                          {member.first_name} {member.last_name}
                        </span>
                        {tags.some(t => t.tagged_profile_id === member.id) && (
                          <span className="ml-auto text-xs text-gray-400">{t('tagged')}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={cancelTagging}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
