'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Plus, Calendar, User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface Story {
  id: string;
  title: string;
  content: string;
  media_type: string;
  media_url?: string;
  created_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  subject: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function StoriesPage() {
  const locale = useLocale();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories/family');
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = locale === 'ru' ? ru : enUS;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {locale === 'ru' ? 'Семейные истории' : 'Family Stories'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {locale === 'ru'
              ? 'Истории и воспоминания вашей семьи'
              : 'Stories and memories from your family'}
          </p>
        </div>
        <Link href="/stories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'ru' ? 'Добавить историю' : 'Add Story'}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stories.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {locale === 'ru' ? 'Пока нет историй' : 'No stories yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {locale === 'ru'
                ? 'Будьте первым, кто добавит семейную историю!'
                : 'Be the first to add a family story!'}
            </p>
            <Link href="/stories/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {locale === 'ru' ? 'Добавить историю' : 'Add Story'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {story.author.avatar_url ? (
                      <img
                        src={story.author.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {story.author.first_name} {story.author.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(story.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                {story.title && (
                  <CardTitle className="text-xl mt-3">{story.title}</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {story.media_url && story.media_type === 'photo' && (
                  <img
                    src={story.media_url}
                    alt={story.title || 'Story image'}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}
                <p className="text-foreground whitespace-pre-wrap">
                  {story.content}
                </p>
                {story.subject && story.subject.id !== story.author.id && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {locale === 'ru' ? 'О:' : 'About:'}{' '}
                    <Link
                      href={`/profile/${story.subject.id}`}
                      className="text-primary hover:underline"
                    >
                      {story.subject.first_name} {story.subject.last_name}
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
