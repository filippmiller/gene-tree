'use client';

import { useState } from 'react';
import { Plus, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import MilestoneTimeline from '@/components/milestones/MilestoneTimeline';
import MilestoneForm from '@/components/milestones/MilestoneForm';
import { type MilestoneWithProfile } from '@/lib/milestones/types';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface Translations {
  title: string;
  subtitle: string;
  addMilestone: string;
}

interface MilestonesPageClientProps {
  locale: string;
  currentUserId: string;
  currentProfile: Profile | null;
  familyMembers: Profile[];
  translations: Translations;
}

export default function MilestonesPageClient({
  locale,
  currentUserId,
  currentProfile,
  familyMembers,
  translations: t,
}: MilestonesPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingMilestone(null);
    setRefreshKey(prev => prev + 1); // Trigger timeline refresh
  };

  const handleEdit = (milestone: MilestoneWithProfile) => {
    // For now, we'll just open the form - full edit functionality would need more work
    setEditingMilestone(milestone);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
              <PartyPopper className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {t.title}
              </h1>
              <p className="text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t.addMilestone}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <MilestoneForm
                locale={locale}
                currentUserId={currentUserId}
                familyMembers={familyMembers}
                onSuccess={handleSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Timeline */}
        <GlassCard glass="medium" padding="lg">
          <MilestoneTimeline
            key={refreshKey}
            locale={locale}
            currentUserId={currentUserId}
            onEdit={handleEdit}
          />
        </GlassCard>
      </div>
    </div>
  );
}
