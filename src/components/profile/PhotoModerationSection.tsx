'use client';

import { useState, useEffect } from 'react';
import { Check, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PendingPhoto {
  id: string;
  bucket: string;
  path: string;
  type: string;
  caption?: string;
  created_at: string;
  url: string | null;
  uploader?: {
    email: string;
  };
}

interface Props {
  profileId: string;
}

export default function PhotoModerationSection({ profileId }: Props) {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingPhotos = async () => {
    try {
      const res = await fetch(`/api/media/pending?profileId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('[MODERATION] Failed to fetch pending photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPhotos();
  }, [profileId]);

  const handleApprove = async (photoId: string) => {
    setProcessing(photoId);
    try {
      const res = await fetch('/api/media/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        alert('Фото одобрено!');
      } else {
        const err = await res.json();
        alert('Ошибка: ' + err.error);
      }
    } catch (error) {
      console.error('[MODERATION] Approve error:', error);
      alert('Ошибка при одобрении');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (photoId: string) => {
    const reason = prompt('Причина отклонения (необязательно):');
    
    setProcessing(photoId);
    try {
      const res = await fetch('/api/media/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, reason }),
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        alert('Фото отклонено');
      } else {
        const err = await res.json();
        alert('Ошибка: ' + err.error);
      }
    } catch (error) {
      console.error('[MODERATION] Reject error:', error);
      alert('Ошибка при отклонении');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Загрузка...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Нет предложенных фото</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        У вас <strong>{photos.length}</strong> {photos.length === 1 ? 'предложенное фото' : 'предложенных фото'} для модерации
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Image */}
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.caption || 'Предложенное фото'}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-300" />
              </div>
            )}

            {/* Info */}
            <div className="p-4">
              {photo.caption && (
                <p className="text-sm text-gray-700 mb-2">{photo.caption}</p>
              )}
              
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>
                  <strong>Загружено:</strong> {photo.uploader?.email || 'Неизвестно'}
                </p>
                <p>
                  <strong>Тип:</strong> {photo.type}
                </p>
                <p>
                  <strong>Дата:</strong> {new Date(photo.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(photo.id)}
                  disabled={processing === photo.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Одобрить
                </button>

                <button
                  onClick={() => handleReject(photo.id)}
                  disabled={processing === photo.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
