'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AddStoryDialog from '@/components/stories/AddStoryDialog';
import StoryFeed from '@/components/stories/StoryFeed';
// import VoiceStoryRecorder from '@/components/profile/VoiceStoryRecorder'; // Removed in favor of unified dialog

interface PersonProfileDialogProps {
    personId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PersonProfileDialog({
    personId,
    isOpen,
    onClose,
}: PersonProfileDialogProps) {
    const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);

    const [person, setPerson] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchPersonDetails = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPerson(data);
        } catch {
            toast.error('Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && personId) {
            fetchPersonDetails(personId);
        } else {
            setPerson(null);
        }
    }, [isOpen, personId]);

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Профиль</DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : person ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={person.avatar_url} />
                                <AvatarFallback className="text-2xl">
                                    {(person.first_name?.[0] || '') + (person.last_name?.[0] || '')}
                                </AvatarFallback>
                            </Avatar>

                            <div className="text-center">
                                <h2 className="text-xl font-bold">
                                    {person.first_name} {person.last_name}
                                </h2>
                                {person.maiden_name && (
                                    <p className="text-sm text-gray-500">({person.maiden_name})</p>
                                )}
                            </div>

                            <div className="w-full space-y-3 mt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-gray-500">Дата рождения:</span>
                                    <span>
                                        {person.birth_date
                                            ? format(new Date(person.birth_date), 'd MMMM yyyy', { locale: ru })
                                            : 'Не указана'}
                                    </span>

                                    <span className="text-gray-500">Пол:</span>
                                    <span>
                                        {person.gender === 'male' ? 'Мужской' : person.gender === 'female' ? 'Женский' : 'Не указан'}
                                    </span>

                                    {person.birth_place && (
                                        <>
                                            <span className="text-gray-500">Место рождения:</span>
                                            <span>{person.birth_place}</span>
                                        </>
                                    )}
                                </div>

                                {/* Stories Section */}
                                <div className="pt-4 border-t w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium">Истории</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsStoryDialogOpen(true)}
                                        >
                                            + Добавить
                                        </Button>
                                    </div>
                                    {/* StoryFeed */}
                                    <StoryFeed profileId={person.id} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Информация не найдена
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {person && (
                <AddStoryDialog
                    isOpen={isStoryDialogOpen}
                    onClose={() => setIsStoryDialogOpen(false)}
                    subjectId={person.id}
                    onSuccess={() => {
                        // Refresh stories?
                        toast.success('История добавлена');
                    }}
                />
            )}
        </>
    );
}
