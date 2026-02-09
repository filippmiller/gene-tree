'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Timer, Inbox, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TimeCapsuleCard from '@/components/time-capsules/TimeCapsuleCard';
import TimeCapsuleForm from '@/components/time-capsules/TimeCapsuleForm';
import TimeCapsuleViewer from '@/components/time-capsules/TimeCapsuleViewer';
import type {
  TimeCapsuleWithProfiles,
  TimeCapsuleListResponse,
} from '@/lib/time-capsules/types';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Translations {
  title: string;
  subtitle: string;
  createNew: string;
  tabSent: string;
  tabReceived: string;
  emptyState: string;
  emptyReceived: string;
  confirmDelete: string;
}

interface TimeCapsulePageClientProps {
  locale: string;
  currentUserId: string;
  currentProfile: Profile | null;
  familyMembers: Profile[];
  translations: Translations;
}

export default function TimeCapsulePageClient({
  locale,
  currentUserId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentProfile,
  familyMembers,
  translations: t,
}: TimeCapsulePageClientProps) {
  const searchParams = useSearchParams();
  const openCapsuleId = searchParams.get('open');

  // State
  const [sentCapsules, setSentCapsules] = useState<TimeCapsuleWithProfiles[]>([]);
  const [receivedCapsules, setReceivedCapsules] = useState<TimeCapsuleWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState<TimeCapsuleWithProfiles | null>(null);
  const [viewingCapsule, setViewingCapsule] = useState<TimeCapsuleWithProfiles | null>(null);
  const [deletingCapsule, setDeletingCapsule] = useState<TimeCapsuleWithProfiles | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch capsules
  const fetchCapsules = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sent capsules
      const sentRes = await fetch('/api/time-capsules?filter=sent&limit=50');
      if (sentRes.ok) {
        const sentData: TimeCapsuleListResponse = await sentRes.json();
        setSentCapsules(sentData.data);
      }

      // Fetch received capsules
      const receivedRes = await fetch('/api/time-capsules?filter=received&limit=50');
      if (receivedRes.ok) {
        const receivedData: TimeCapsuleListResponse = await receivedRes.json();
        setReceivedCapsules(receivedData.data);
      }
    } catch (error) {
      console.error('Failed to fetch time capsules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCapsules();
  }, [fetchCapsules]);

  // Handle opening capsule from URL query param
  useEffect(() => {
    if (openCapsuleId && !loading) {
      // Look in received capsules first
      const capsule = receivedCapsules.find((c) => c.id === openCapsuleId);
      if (capsule) {
        setViewingCapsule(capsule);
        setActiveTab('received');
      } else {
        // Check sent capsules
        const sentCapsule = sentCapsules.find((c) => c.id === openCapsuleId);
        if (sentCapsule && sentCapsule.delivery_status === 'delivered') {
          setViewingCapsule(sentCapsule);
          setActiveTab('sent');
        }
      }
    }
  }, [openCapsuleId, receivedCapsules, sentCapsules, loading]);

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingCapsule(null);
    fetchCapsules();
  };

  const handleEdit = (capsule: TimeCapsuleWithProfiles) => {
    setEditingCapsule(capsule);
    setFormDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCapsule) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/time-capsules/${deletingCapsule.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingCapsule(null);
        fetchCapsules();
      }
    } catch (error) {
      console.error('Failed to delete capsule:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D29922] flex items-center justify-center text-white">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {t.title}
              </h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="bg-[#D29922] hover:bg-[#E0A830] text-black"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t.createNew}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <TimeCapsuleForm
                locale={locale}
                currentUserId={currentUserId}
                familyMembers={familyMembers}
                initialData={editingCapsule || undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setFormDialogOpen(false);
                  setEditingCapsule(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'sent' | 'received')}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {t.tabSent}
              {sentCapsules.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[#D29922]/10 text-[#D29922]">
                  {sentCapsules.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              {t.tabReceived}
              {receivedCapsules.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[#58A6FF]/10 text-[#58A6FF]">
                  {receivedCapsules.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Sent Capsules */}
          <TabsContent value="sent">
            <GlassCard glass="medium" padding="lg">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : sentCapsules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Timer className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {t.emptyState}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sentCapsules.map((capsule) => (
                    <TimeCapsuleCard
                      key={capsule.id}
                      capsule={capsule}
                      locale={locale}
                      currentUserId={currentUserId}
                      onOpen={setViewingCapsule}
                      onEdit={handleEdit}
                      onDelete={setDeletingCapsule}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Received Capsules */}
          <TabsContent value="received">
            <GlassCard glass="medium" padding="lg">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : receivedCapsules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {t.emptyReceived}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {receivedCapsules.map((capsule) => (
                    <TimeCapsuleCard
                      key={capsule.id}
                      capsule={capsule}
                      locale={locale}
                      currentUserId={currentUserId}
                      onOpen={setViewingCapsule}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Viewer Dialog */}
      <TimeCapsuleViewer
        capsule={viewingCapsule}
        locale={locale}
        open={!!viewingCapsule}
        onClose={() => setViewingCapsule(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCapsule}
        onOpenChange={(o) => !o && setDeletingCapsule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'ru' ? 'Удалить капсулу?' : 'Delete Capsule?'}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDelete}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : locale === 'ru' ? (
                'Удалить'
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
