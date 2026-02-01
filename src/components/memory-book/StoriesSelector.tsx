'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Search, BookOpen, Image, Mic, Video, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SelectedStory } from '@/lib/memory-book/types';

interface StoriesSelectorProps {
  selectedStories: SelectedStory[];
  onSelectionChange: (stories: SelectedStory[]) => void;
  selectedPeopleIds?: string[]; // Filter stories by selected people
}

interface StoryFromAPI {
  id: string;
  title: string | null;
  content: string | null;
  media_type: 'image' | 'video' | 'audio' | 'text';
  media_url: string | null;
  created_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  subject: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const mediaTypeIcons = {
  image: Image,
  video: Video,
  audio: Mic,
  text: FileText,
};

export default function StoriesSelector({
  selectedStories,
  onSelectionChange,
  selectedPeopleIds,
}: StoriesSelectorProps) {
  const [stories, setStories] = useState<StoryFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      // Fetch stories - you may need to adjust this endpoint
      const response = await fetch('/api/activity/feed?limit=50');
      if (response.ok) {
        const data = await response.json();
        // Filter to only get story items
        const storyItems = (data.items || []).filter(
          (item: any) => item.type === 'story' && item.story
        );
        setStories(
          storyItems.map((item: any) => ({
            id: item.story.id,
            title: item.story.title,
            content: item.story.content,
            media_type: item.story.media_type,
            media_url: item.story.media_url,
            created_at: item.story.created_at,
            author: item.actor || { first_name: 'Unknown', last_name: '', avatar_url: null },
            subject: item.subject || { id: '', first_name: 'Unknown', last_name: '' },
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      !searchQuery ||
      story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${story.subject.first_name} ${story.subject.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesPeople =
      !selectedPeopleIds?.length ||
      selectedPeopleIds.includes(story.subject.id);

    return matchesSearch && matchesPeople;
  });

  const isSelected = (storyId: string) =>
    selectedStories.some((s) => s.id === storyId);

  const toggleStory = (story: StoryFromAPI) => {
    if (isSelected(story.id)) {
      onSelectionChange(selectedStories.filter((s) => s.id !== story.id));
    } else {
      const selectedStory: SelectedStory = {
        id: story.id,
        title: story.title,
        content: story.content,
        mediaType: story.media_type,
        mediaUrl: story.media_url,
        createdAt: story.created_at,
        author: {
          firstName: story.author.first_name,
          lastName: story.author.last_name,
        },
        subject: {
          id: story.subject.id,
          firstName: story.subject.first_name,
          lastName: story.subject.last_name,
        },
      };
      onSelectionChange([...selectedStories, selectedStory]);
    }
  };

  const removeSelected = (storyId: string) => {
    onSelectionChange(selectedStories.filter((s) => s.id !== storyId));
  };

  return (
    <div className="space-y-4">
      {/* Selected stories chips */}
      {selectedStories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg">
          {selectedStories.map((story) => (
            <div
              key={story.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-green-200 shadow-sm"
            >
              {(() => {
                const IconComponent = mediaTypeIcons[story.mediaType];
                return <IconComponent className="w-4 h-4 text-green-600" />;
              })()}
              <span className="text-sm font-medium max-w-32 truncate">
                {story.title || `Story about ${story.subject.firstName}`}
              </span>
              <button
                onClick={() => removeSelected(story.id)}
                className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stories list */}
      <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-2">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No stories found</p>
            {selectedPeopleIds?.length ? (
              <p className="text-xs mt-1">Try selecting more people</p>
            ) : null}
          </div>
        ) : (
          filteredStories.map((story) => {
            const IconComponent = mediaTypeIcons[story.media_type];
            return (
              <button
                key={story.id}
                onClick={() => toggleStory(story)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all duration-150',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset',
                  isSelected(story.id) && 'bg-green-50 hover:bg-green-100'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {story.title || `Story about ${story.subject.first_name}`}
                    </p>
                    {story.content && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                        {story.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={story.author.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {story.author.first_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-400">
                        by {story.author.first_name} {story.author.last_name}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(story.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {isSelected(story.id) && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {selectedStories.length} stories selected
      </p>
    </div>
  );
}
