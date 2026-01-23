'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MediaVisibility, Photo, MediaType, SignedUploadResponse } from '@/types/media';
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react';

interface Props {
  profileId: string;
}

interface PhotoWithUrl extends Photo {
  url: string | null;
}

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'signed-url' | 'uploading' | 'committing' | 'done' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per media design

export default function ProfilePhotosSection({ profileId }: Props) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const visibility: MediaVisibility = 'family';
  const mediaType: MediaType = 'portrait';

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('target_profile_id', profileId)
        .eq('bucket', 'media')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProfilePhotos] Failed to load photos', error);
        return;
      }

      const basePhotos = (data || []) as Photo[];

      const withUrls: PhotoWithUrl[] = await Promise.all(
        basePhotos.map(async (p) => {
          let url: string | null = null;
          if (p.bucket === 'media') {
            const { data: signed } = await supabase
              .storage
              .from('media')
              .createSignedUrl(p.path, 3600);
            url = signed?.signedUrl ?? null;
          }
          return { ...(p as Photo), url };
        })
      );

      setPhotos(withUrls);
    } finally {
      setLoading(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      alert('Пожалуйста, выберите изображения');
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Файл ${file.name} слишком большой (макс 25 МБ)`);
        continue;
      }

      const uploadId = crypto.randomUUID();
      setUploads((prev) => [...prev, { id: uploadId, file, status: 'pending' }]);

      try {
        // 1) Signed upload
        setUploads((prev) => prev.map((u) => u.id === uploadId ? { ...u, status: 'signed-url' } : u));

        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const body = {
          target_profile_id: profileId,
          type: mediaType,
          visibility,
          file_ext: ext,
          content_type: file.type,
          size: file.size,
        };

        const signedRes = await fetch('/api/media/signed-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!signedRes.ok) {
          const err = await signedRes.json().catch(() => ({}));
          throw new Error(err.error || 'Не удалось создать URL для загрузки');
        }

        const signed: SignedUploadResponse = await signedRes.json();

        // 2) Upload to signed URL via Supabase client
        setUploads((prev) => prev.map((u) => u.id === uploadId ? { ...u, status: 'uploading' } : u));

        const { error: uploadError } = await supabase.storage
          .from(signed.bucket)
          .uploadToSignedUrl(signed.path, signed.token, file);

        if (uploadError) {
          throw uploadError;
        }

        // 3) Commit
        setUploads((prev) => prev.map((u) => u.id === uploadId ? { ...u, status: 'committing' } : u));

        const commitRes = await fetch('/api/media/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: signed.photoId }),
        });

        if (!commitRes.ok) {
          const err = await commitRes.json().catch(() => ({}));
          throw new Error(err.error || 'Не удалось завершить загрузку');
        }

        setUploads((prev) => prev.map((u) => u.id === uploadId ? { ...u, status: 'done' } : u));
      } catch (error: any) {
        console.error('[ProfilePhotos] Upload error', error);
        setUploads((prev) => prev.map((u) => u.id === uploadId ? { ...u, status: 'error', error: error?.message || 'Ошибка' } : u));
      }
    }

    // Reload list after batch
    await loadPhotos();
  }

  return (
    <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Мои фотографии</h2>
          <p className="text-sm text-gray-600">
            Личные фотографии, которые увидят ваши родственники на странице профиля.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
          <Upload className="w-4 h-4" />
          Добавить фото
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
        </label>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
              <span className="truncate max-w-[200px]">{u.file.name}</span>
              <span>
                {u.status === 'pending' && 'Ожидание'}
                {u.status === 'signed-url' && 'Подготовка'}
                {u.status === 'uploading' && 'Загрузка...'}
                {u.status === 'committing' && 'Сохранение...'}
                {u.status === 'done' && 'Готово'}
                {u.status === 'error' && `Ошибка: ${u.error ?? ''}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Gallery */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка фотографий...
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
          <ImageIcon className="w-10 h-10 mb-3 text-gray-300" />
          Пока нет ни одной фотографии. Добавьте первые снимки о себе.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="relative group overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.caption || 'Фото профиля'}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              {photo.caption && (
                <figcaption className="absolute bottom-0 inset-x-0 bg-black/50 text-[11px] text-white px-2 py-1 truncate">
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
