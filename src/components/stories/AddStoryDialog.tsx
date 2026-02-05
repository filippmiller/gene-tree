'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
import VoiceRecorder from '@/components/voice/VoiceRecorder';
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
    const params = useParams();
    const locale = (params.locale as 'en' | 'ru') || 'en';

    const [activeTab, setActiveTab] = useState('text');
    const [content, setContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'text'>('text');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voiceStoryComplete, setVoiceStoryComplete] = useState(false);

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
            setVoiceStoryComplete(false);
        } catch {
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
                            {voiceStoryComplete ? (
                                <div className="p-4 border rounded-lg bg-green-50 text-center">
                                    <p className="text-sm text-green-700">
                                        {locale === 'ru'
                                            ? 'Голосовая история успешно сохранена!'
                                            : 'Voice story saved successfully!'}
                                    </p>
                                </div>
                            ) : (
                                <VoiceRecorder
                                    targetProfileId={subjectId}
                                    locale={locale}
                                    onComplete={() => {
                                        setVoiceStoryComplete(true);
                                        toast.success(locale === 'ru'
                                            ? 'Голосовая история сохранена!'
                                            : 'Voice story saved!');
                                        onSuccess?.();
                                    }}
                                    onCancel={() => setActiveTab('text')}
                                />
                            )}
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
