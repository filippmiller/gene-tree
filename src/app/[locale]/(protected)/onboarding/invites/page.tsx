'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getRelationshipLabel, type RelationshipType } from '@/lib/relationships/computeRelationship';

interface Invite {
    id: string;
    first_name: string;
    last_name: string;
    relationship_type: string;
    invited_by: string;
    inviter: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    role_for_a?: string;
    role_for_b?: string;
}

export default function InvitationsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as string) || 'ru';
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const response = await fetch('/api/invites/my-pending');
                if (response.ok) {
                    const data = await response.json();
                    setInvites(data);

                    // If no invites, redirect to dashboard
                    if (data.length === 0) {
                        router.push(`/${locale}/people`);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch invites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvites();
    }, [locale, router]);

    const handleAccept = async (inviteId: string) => {
        setProcessingId(inviteId);
        try {
            const response = await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId }),
            });

            if (response.ok) {
                // Remove from list
                const remaining = invites.filter(i => i.id !== inviteId);
                setInvites(remaining);

                if (remaining.length === 0) {
                    router.push(`/${locale}/people`);
                    router.refresh();
                }
            } else {
                alert('Failed to accept invitation');
            }
        } catch (error) {
            console.error('Error accepting invite:', error);
            alert('Error accepting invitation');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (inviteId: string) => {
        if (!confirm('Вы уверены, что хотите отклонить приглашение?')) return;

        setProcessingId(inviteId);
        try {
            const response = await fetch('/api/invites/decline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId }),
            });

            if (response.ok) {
                const remaining = invites.filter(i => i.id !== inviteId);
                setInvites(remaining);

                if (remaining.length === 0) {
                    router.push(`/${locale}/people`);
                }
            }
        } catch (error) {
            console.error('Error declining invite:', error);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (invites.length === 0) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Вас пригласили в семью!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        У вас есть новые приглашения присоединиться к семейному дереву.
                    </p>
                </div>

                <div className="space-y-4">
                    {invites.map((invite) => (
                        <div key={invite.id} className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="flex-shrink-0">
                                    {invite.inviter.avatar_url ? (
                                        <img
                                            src={invite.inviter.avatar_url}
                                            alt=""
                                            className="h-12 w-12 rounded-full"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                            {invite.inviter.first_name[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {invite.inviter.first_name} {invite.inviter.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Приглашает вас как: <span className="font-medium text-gray-900">
                                            {getRelationshipLabel(invite.relationship_type as RelationshipType, locale as 'ru' | 'en')}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleAccept(invite.id)}
                                    disabled={processingId === invite.id}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processingId === invite.id ? 'Принятие...' : 'Принять'}
                                </button>
                                <button
                                    onClick={() => handleDecline(invite.id)}
                                    disabled={processingId === invite.id}
                                    className="flex-1 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
