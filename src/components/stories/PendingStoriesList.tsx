'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { Check, X, Image as ImageIcon, Video, Mic, FileText } from 'lucide-react';

interface PendingStory {
    id: string;
    author_id: string;
    subject_id: string;
    media_type: 'image' | 'video' | 'audio' | 'text';
    media_url: string | null;
    content: string | null;
    title: string | null;
    created_at: string;
    author: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
}

export default function PendingStoriesList() {
    const [stories, setStories] = useState<PendingStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPendingStories = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stories/pending');
            if (!response.ok) throw new Error('Failed to fetch pending stories');
            const data = await response.json();
            setStories(data.stories || []);
        } catch (error) {
            console.error('Error fetching pending stories:', error);
            toast.error('Не удалось загрузить ожидающие истории');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingStories();
    }, []);

    const handleApprove = async (storyId: string) => {
        setProcessingId(storyId);
        try {
            const response = await fetch(`/api/stories/${storyId}/approve`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to approve story');

            toast.success('История одобрена');
            // Remove from list
            setStories(prev => prev.filter(s => s.id !== storyId));
        } catch (error) {
            console.error('Error approving story:', error);
            toast.error('Не удалось одобрить историю');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (storyId: string) => {
        setProcessingId(storyId);
        try {
            const response = await fetch(`/api/stories/${storyId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Отклонено' }),
            });

            if (!response.ok) throw new Error('Failed to reject story');

            toast.success('История отклонена');
            // Remove from list
            setStories(prev => prev.filter(s => s.id !== storyId));
        } catch (error) {
            console.error('Error rejecting story:', error);
            toast.error('Не удалось отклонить историю');
        } finally {
            setProcessingId(null);
        }
    };

    const getMediaIcon = (type: string) => {
        switch (type) {
            case 'image': return <ImageIcon className="w-4 h-4" />;
            case 'video': return <Video className="w-4 h-4" />;
            case 'audio': return <Mic className="w-4 h-4" />;
            case 'text': return <FileText className="w-4 h-4" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Нет историй, ожидающих одобрения</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {stories.map((story) => (
                <Card key={story.id} className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Author Avatar */}
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={story.author.avatar_url || undefined} />
                            <AvatarFallback>
                                {(story.author.first_name[0] || '') + (story.author.last_name[0] || '')}
                            </AvatarFallback>
                        </Avatar>

                        {/* Story Content */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                    {story.author.first_name} {story.author.last_name}
                                </p>
                                <span className="text-xs text-gray-500">
                                    {format(new Date(story.created_at), 'd MMM yyyy', { locale: ru })}
                                </span>
                                <div className="flex items-center gap-1 text-gray-500">
                                    {getMediaIcon(story.media_type)}
                                    <span className="text-xs capitalize">{story.media_type}</span>
                                </div>
                            </div>

                            {story.title && (
                                <p className="text-sm font-medium">{story.title}</p>
                            )}

                            {story.content && (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                                    {story.content}
                                </p>
                            )}

                            {/* Preview for media */}
                            {story.media_type === 'image' && story.media_url && (
                                <div className="rounded overflow-hidden bg-gray-100 max-w-xs">
                                    <img
                                        src={`/api/media/stories/${story.media_url}`}
                                        alt="Story preview"
                                        className="w-full h-32 object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(story.id)}
                                disabled={processingId === story.id}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Одобрить
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleReject(story.id)}
                                disabled={processingId === story.id}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Отклонить
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
