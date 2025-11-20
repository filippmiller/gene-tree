
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Image as ImageIcon, Type, Loader2 } from 'lucide-react';
import MediaUploader from './MediaUploader';
import VoiceStoryRecorder from '@/components/profile/VoiceStoryRecorder'; // We might need to adapt this
import { toast } from 'sonner';

interface AddStoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    subjectId: string;
    onSuccess?: () => void;
}

export default function AddStoryDialog({
    isOpen,
    onClose,
    subjectId,
    onSuccess
}: AddStoryDialogProps) {
    const [activeTab, setActiveTab] = useState('text');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'text'>('text');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content && !mediaUrl && activeTab !== 'audio') {
            toast.error('Please add some content');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_id: subjectId,
                    media_type: activeTab === 'photo' ? mediaType : activeTab, // 'photo' tab handles image/video
                    media_url: mediaUrl,
                    content: content,
                    visibility: 'family'
                })
            });

            if (!response.ok) throw new Error('Failed to create story');

            toast.success('Story added successfully!');
            onSuccess?.();
            onClose();

            // Reset form
            setContent('');
            setMediaUrl(null);
            setActiveTab('text');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save story');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMediaUpload = (url: string, type: 'image' | 'video') => {
        setMediaUrl(url);
        setMediaType(type);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add a Family Story</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="text" className="flex gap-2">
                            <Type className="w-4 h-4" /> Text
                        </TabsTrigger>
                        <TabsTrigger value="photo" className="flex gap-2">
                            <ImageIcon className="w-4 h-4" /> Media
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="flex gap-2">
                            <Mic className="w-4 h-4" /> Voice
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 space-y-4">
                        <TabsContent value="text" className="space-y-4">
                            <Textarea
                                placeholder="Write a memory or story..."
                                className="min-h-[150px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </TabsContent>

                        <TabsContent value="photo" className="space-y-4">
                            <MediaUploader
                                onUploadComplete={handleMediaUpload}
                                allowedTypes={['image', 'video']}
                            />
                            <Textarea
                                placeholder="Add a caption..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </TabsContent>

                        <TabsContent value="audio" className="space-y-4">
                            <div className="p-4 border rounded-lg bg-gray-50 text-center">
                                <p className="text-sm text-gray-500 mb-4">
                                    Record a voice message. It will be saved as an audio story.
                                </p>
                                {/* 
                  TODO: VoiceStoryRecorder needs to be adapted to return the URL 
                  instead of handling upload internally, OR we use it as is if it fits.
                  For now, let's assume we need to refactor it or use a simpler recorder here.
                  Actually, let's use a placeholder message if we haven't refactored it yet.
                */}
                                <p className="text-xs text-amber-600">
                                    Voice recording integration pending refactor.
                                    Please use Text or Media for now.
                                </p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || (activeTab === 'photo' && !mediaUrl)}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Share Story
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
