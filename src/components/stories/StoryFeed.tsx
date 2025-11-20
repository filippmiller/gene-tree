
'use client';

import { useEffect, useState } from 'react';
import StoryCard from './StoryCard';
import { Loader2 } from 'lucide-react';

interface StoryFeedProps {
    profileId: string;
}

export default function StoryFeed({ profileId }: StoryFeedProps) {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStories();
    }, [profileId]);

    const fetchStories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stories/profile/${profileId}`);
            if (!response.ok) throw new Error('Failed to fetch stories');
            const data = await response.json();
            setStories(data.stories || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                No stories yet. Be the first to add one!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
            ))}
        </div>
    );
}
