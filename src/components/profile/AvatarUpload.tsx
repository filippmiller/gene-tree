'use client';

import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  profileId: string;
  userId: string;
  currentAvatar: string | null;
}

export default function AvatarUpload({ profileId, userId, currentAvatar }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const supabase = createClient();

  // Update preview when currentAvatar changes
  useEffect(() => {
    setPreview(currentAvatar);
  }, [currentAvatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('Файл слишком большой (макс 25 МБ)');
      return;
    }

    setUploading(true);

    try {
      // Upload via API (server-side with service role)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileId', profileId);

      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setPreview(data.url + '?t=' + Date.now());
      
      // Reload page to fetch updated profile data from database
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Удалить фотографию?')) return;

    try {
      await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      setPreview(null);
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  return (
    <div className="flex items-start gap-6">
      {/* Preview */}
      <div className="relative">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <Upload className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="flex-1">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? 'Загрузка...' : 'Загрузить фото'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <p className="text-sm text-gray-500 mt-2">
          JPG, PNG, WebP, HEIC. Макс 25 МБ.
        </p>
      </div>
    </div>
  );
}
