'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Plus, User, ZoomIn } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Photo {
  id: string;
  media_url: string;
  title?: string;
  content?: string;
  created_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
  };
  subject: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function PhotosPage() {
  const locale = useLocale();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/family');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            {locale === 'ru' ? 'Семейные фотографии' : 'Family Photos'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {locale === 'ru'
              ? 'Фотоальбом вашей семьи'
              : 'Your family photo album'}
          </p>
        </div>
        <Link href="/stories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'ru' ? 'Добавить фото' : 'Add Photo'}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {locale === 'ru' ? 'Пока нет фотографий' : 'No photos yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {locale === 'ru'
                ? 'Загрузите первую семейную фотографию!'
                : 'Upload your first family photo!'}
            </p>
            <Link href="/stories/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {locale === 'ru' ? 'Добавить фото' : 'Add Photo'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.media_url}
                alt={photo.title || 'Family photo'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {photo.subject.first_name} {photo.subject.last_name}
                  </p>
                  {photo.title && (
                    <p className="text-white/80 text-xs truncate">{photo.title}</p>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedPhoto.title ||
                    `${selectedPhoto.subject.first_name} ${selectedPhoto.subject.last_name}`}
                </DialogTitle>
              </DialogHeader>
              <div className="relative">
                <img
                  src={selectedPhoto.media_url}
                  alt={selectedPhoto.title || 'Family photo'}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              {selectedPhoto.content && (
                <p className="text-muted-foreground mt-4">{selectedPhoto.content}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {locale === 'ru' ? 'Добавил(а):' : 'Added by:'}{' '}
                  {selectedPhoto.author.first_name} {selectedPhoto.author.last_name}
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
