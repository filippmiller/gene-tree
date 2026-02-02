'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Eye, Users, Heart } from 'lucide-react';
import {
  describeMatchReasons,
  getConfidenceBadgeVariant,
  getConfidenceLevel,
} from '@/lib/duplicates/detector';
import type { PotentialDuplicate, ProfileData } from '@/lib/duplicates/types';

interface DuplicateCardProps {
  duplicate: PotentialDuplicate;
  onMerge: (duplicateId: string, keepProfileId: string, mergeProfileId: string) => Promise<void>;
  onDismiss: (duplicateId: string) => Promise<void>;
  onViewDetails?: () => void;
  isLoading?: boolean;
  showDeceasedBadge?: boolean;
  sharedRelativesCount?: number;
}

function ProfileCard({
  profile,
  isSelected,
  onSelect,
  disabled,
}: {
  profile: ProfileData;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
          Keep
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || ''} alt={fullName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-semibold text-lg truncate">{fullName}</h4>
            {profile.maiden_name && (
              <p className="text-sm text-muted-foreground">
                Maiden name: {profile.maiden_name}
              </p>
            )}
            {profile.nickname && (
              <p className="text-sm text-muted-foreground">
                Nickname: {profile.nickname}
              </p>
            )}
          </div>

          <div className="grid gap-1 text-sm">
            {profile.birth_date && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Born:</span>
                <span>{new Date(profile.birth_date).toLocaleDateString()}</span>
              </div>
            )}
            {(profile.birth_city || profile.birth_country) && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Birthplace:</span>
                <span>
                  {[profile.birth_city, profile.birth_country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {profile.occupation && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Occupation:</span>
                <span className="truncate">{profile.occupation}</span>
              </div>
            )}
            {profile.gender && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Gender:</span>
                <span className="capitalize">{profile.gender}</span>
              </div>
            )}
            {profile.is_living === false && (
              <Badge variant="outline" size="sm" className="w-fit">
                Deceased
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchReasonsDisplay({ reasons }: { reasons: PotentialDuplicate['match_reasons'] }) {
  const descriptions = describeMatchReasons(reasons);

  return (
    <div className="space-y-1">
      {descriptions.map((desc, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <svg
            className="h-4 w-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{desc}</span>
        </div>
      ))}
    </div>
  );
}

export function DuplicateCard({
  duplicate,
  onMerge,
  onDismiss,
  onViewDetails,
  isLoading = false,
  showDeceasedBadge = false,
  sharedRelativesCount,
}: DuplicateCardProps) {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const confidenceLevel = getConfidenceLevel(duplicate.confidence_score);
  const badgeVariant = getConfidenceBadgeVariant(duplicate.confidence_score);

  const handleMerge = async () => {
    if (!selectedProfile) return;

    const mergeProfileId =
      selectedProfile === duplicate.profile_a_id
        ? duplicate.profile_b_id
        : duplicate.profile_a_id;

    setIsMerging(true);
    try {
      await onMerge(duplicate.id, selectedProfile, mergeProfileId);
    } finally {
      setIsMerging(false);
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await onDismiss(duplicate.id);
    } finally {
      setIsDismissing(false);
    }
  };

  const disabled = isLoading || isMerging || isDismissing;

  if (!duplicate.profile_a || !duplicate.profile_b) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Profile data not available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation="raised" className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Potential Duplicate</CardTitle>
            {showDeceasedBadge && (
              <Badge variant="secondary" size="sm" className="gap-1">
                <Heart className="h-3 w-3" />
                Memorial
              </Badge>
            )}
            {sharedRelativesCount !== undefined && sharedRelativesCount > 0 && (
              <Badge variant="outline" size="sm" className="gap-1">
                <Users className="h-3 w-3" />
                {sharedRelativesCount} shared relative{sharedRelativesCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant} size="lg">
              {duplicate.confidence_score}% Match
            </Badge>
            <Badge variant="outline" size="sm" className="capitalize">
              {confidenceLevel.replace('_', ' ')} confidence
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Match reasons */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-sm text-muted-foreground">Why we think these are duplicates:</h4>
          <MatchReasonsDisplay reasons={duplicate.match_reasons} />
        </div>

        {/* Side by side profiles */}
        <div className="grid md:grid-cols-2 gap-4">
          <ProfileCard
            profile={duplicate.profile_a}
            isSelected={selectedProfile === duplicate.profile_a_id}
            onSelect={() => setSelectedProfile(duplicate.profile_a_id)}
            disabled={disabled}
          />
          <ProfileCard
            profile={duplicate.profile_b}
            isSelected={selectedProfile === duplicate.profile_b_id}
            onSelect={() => setSelectedProfile(duplicate.profile_b_id)}
            disabled={disabled}
          />
        </div>

        {/* Instructions */}
        {!selectedProfile && (
          <p className="text-sm text-muted-foreground text-center">
            Click on the profile you want to keep. The other profile will be merged into it.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              disabled={disabled}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          )}
          <div className={cn("flex items-center gap-3", !onViewDetails && "ml-auto")}>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={disabled}
              loading={isDismissing}
            >
              Not a Duplicate
            </Button>
            <Button
              variant="default"
              onClick={handleMerge}
              disabled={disabled || !selectedProfile}
              loading={isMerging}
            >
              {selectedProfile ? 'Merge Profiles' : 'Select a Profile to Keep'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
