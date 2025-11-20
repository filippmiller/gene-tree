
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MediaUploaderProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    onUploadStart?: () => void;
    onError?: (error: string) => void;
    allowedTypes?: ('image' | 'video')[];
}

export default function MediaUploader({
    onUploadComplete,
    onUploadStart,
    onError,
    allowedTypes = ['image', 'video']
}: MediaUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('image/') ? 'image' : 'video';

        if (!allowedTypes.includes(type as any)) {
            onError?.(`Format ${type} not allowed`);
            return;
        }

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setMediaType(type as 'image' | 'video');

        // Upload immediately or wait? 
        // Let's upload immediately to get the URL, but show progress
        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);
            onUploadStart?.();

            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${mediaType}s/${fileName}`; // images/xyz.jpg or videos/xyz.mp4

            const { error: uploadError } = await supabase.storage
                .from('stories')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL? No, it's a private bucket. We store the path.
            // But for preview we use the objectUrl.
            // The backend expects the path in the bucket.

            onUploadComplete(filePath, mediaType as 'image' | 'video');
        } catch (err: any) {
            console.error('Upload failed:', err);
            onError?.(err.message);
            setPreviewUrl(null);
            setMediaType(null);
        } finally {
            setUploading(false);
        }
    };

    const clearMedia = () => {
        setPreviewUrl(null);
        setMediaType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            {!previewUrl ? (
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <div className="flex gap-2">
                            {allowedTypes.includes('image') && <ImageIcon className="w-8 h-8" />}
                            {allowedTypes.includes('video') && <Film className="w-8 h-8" />}
                        </div>
                        <p className="text-sm font-medium">Click to upload media</p>
                        <p className="text-xs text-gray-400">
                            {allowedTypes.join(', ')} up to 50MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-lg overflow-hidden bg-black/5 border">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                        onClick={clearMedia}
                    >
                        <X className="w-4 h-4" />
                    </Button>

                    {mediaType === 'image' ? (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-64 object-contain"
                        />
                    ) : (
                        <video
                            src={previewUrl}
                            controls
                            className="w-full h-64 object-contain"
                        />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                            Uploading...
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={allowedTypes.map(t => `${t}/*`).join(',')}
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    );
}
