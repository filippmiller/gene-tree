'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Play, Pause, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef } from 'react';
import ReactionBar from '@/components/reactions/ReactionBar';
import CommentList from '@/components/comments/CommentList';
import type { ReactionCounts, ReactionType } from '@/types/reactions';

interface Story {
  id: string;
  author: {
    id?: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  media_type: 'image' | 'video' | 'audio' | 'text';
  media_url: string | null;
  content: string | null;
  created_at: string;
  // Engagement data (optional, for preloading)
  reaction_counts?: ReactionCounts;
  user_reaction?: ReactionType | null;
  comment_count?: number;
}

interface StoryCardProps {
  story: Story;
  currentUser?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  locale?: string;
  showComments?: boolean;
}

export default function StoryCard({
  story,
  currentUser,
  locale = 'ru',
  showComments = true,
}: StoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentCount] = useState(story.comment_count || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const getMediaUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `/api/media/stories/${path}`;
  };

  const dateLocale = locale === 'ru' ? ru : enUS;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={story.author.avatar_url || undefined} />
          <AvatarFallback>
            {(story.author.first_name?.[0] || '') + (story.author.last_name?.[0] || '')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {story.author.first_name} {story.author.last_name}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(story.created_at), 'd MMM yyyy', { locale: dateLocale })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {story.content && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{story.content}</p>
        )}

        {story.media_type === 'image' && story.media_url && (
          <div className="rounded-lg overflow-hidden bg-gray-100">
            <img
              src={getMediaUrl(story.media_url)}
              alt="Story media"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        )}

        {story.media_type === 'video' && story.media_url && (
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              src={getMediaUrl(story.media_url)}
              controls
              className="w-full h-auto max-h-96"
            />
          </div>
        )}

        {story.media_type === 'audio' && story.media_url && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              onClick={toggleAudio}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-0" />
            </div>
            <audio
              ref={audioRef}
              src={getMediaUrl(story.media_url)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="pt-2 border-t">
        <ReactionBar
          targetType="story"
          targetId={story.id}
          initialCounts={story.reaction_counts}
          initialUserReaction={story.user_reaction}
          size="sm"
        />
      </div>

      {/* Comments toggle and section */}
      {showComments && currentUser && (
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-gray-600 hover:text-gray-800"
            onClick={() => setCommentsExpanded(!commentsExpanded)}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {commentCount > 0 ? `${commentCount} comments` : 'Add a comment'}
            </span>
            {commentsExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {commentsExpanded && (
            <div className="mt-3">
              <CommentList
                storyId={story.id}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
