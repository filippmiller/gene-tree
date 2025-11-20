
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Play, Pause } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface Story {
    id: string;
    author: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
    media_type: 'image' | 'video' | 'audio' | 'text';
    media_url: string | null;
    content: string | null;
    created_at: string;
}

export default function StoryCard({ story }: { story: Story }) {
    const [isPlaying, setIsPlaying] = useState(false);
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

    // Helper to get full storage URL (assuming private bucket needs signed URL or proxy)
    // For now, let's assume we have a public URL or a proxy route. 
    // Since bucket is private, we technically need to sign it.
    // BUT, for simplicity in this iteration, let's assume we can access it via a helper or it's signed.
    // Actually, the backend should probably sign it or we use a component that handles it.
    // Let's use a placeholder logic: /api/storage/stories/ + path
    const getMediaUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        // Use the secure proxy route to access private bucket files
        return `/api/media/stories/${path}`;
    };

    return (
        <div className="bg-white rounded-lg border p-4 space-y-3 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={story.author.avatar_url || undefined} />
                    <AvatarFallback>
                        {(story.author.first_name[0] || '') + (story.author.last_name[0] || '')}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">
                        {story.author.first_name} {story.author.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {format(new Date(story.created_at), 'd MMM yyyy', { locale: ru })}
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
                            <div className="h-full bg-blue-500 w-0" /> {/* Progress bar placeholder */}
                        </div>
                        <audio
                            ref={audioRef}
                            src={getMediaUrl(story.media_url)}
                            onEnded={() => setIsPlaying(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
