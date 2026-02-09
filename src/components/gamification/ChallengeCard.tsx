"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  Camera,
  BookOpen,
  Users,
  User,
  Target,
  Clock,
  Trophy,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

type ChallengeType =
  | "photo_upload"
  | "story_write"
  | "invite_family"
  | "profile_complete"
  | "custom";

interface ChallengeCardProps {
  id: string;
  title: string;
  titleRu?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  challengeType: ChallengeType;
  targetValue: number;
  currentProgress: number;
  rewardPoints: number;
  daysRemaining: number;
  isJoined: boolean;
  isCompleted: boolean;
  participantCount: number;
  onJoin?: (id: string) => void;
  onClaim?: (id: string) => void;
  className?: string;
}

const challengeIcons: Record<ChallengeType, React.ElementType> = {
  photo_upload: Camera,
  story_write: BookOpen,
  invite_family: Users,
  profile_complete: User,
  custom: Target,
};

const challengeColors: Record<ChallengeType, string> = {
  photo_upload: "from-pink-500 to-rose-500",
  story_write: "from-[#58A6FF] to-[#58A6FF]",
  invite_family: "from-blue-500 to-cyan-500",
  profile_complete: "from-green-500 to-emerald-500",
  custom: "from-[#D29922] to-[#D29922]",
};

/**
 * Card component for displaying a family challenge
 */
export function ChallengeCard({
  id,
  title,
  titleRu,
  description,
  descriptionRu,
  challengeType,
  targetValue,
  currentProgress,
  rewardPoints,
  daysRemaining,
  isJoined,
  isCompleted,
  participantCount,
  onJoin,
  onClaim,
  className,
}: ChallengeCardProps) {
  const locale = useLocale() as "en" | "ru";
  const [isLoading, setIsLoading] = React.useState(false);

  const t = {
    join: locale === "ru" ? "Участвовать" : "Join",
    claim: locale === "ru" ? "Получить награду" : "Claim Reward",
    completed: locale === "ru" ? "Завершено!" : "Completed!",
    daysLeft: locale === "ru" ? "дней осталось" : "days left",
    dayLeft: locale === "ru" ? "день остался" : "day left",
    points: locale === "ru" ? "очков" : "points",
    participants: locale === "ru" ? "участников" : "participants",
    progress: locale === "ru" ? "Прогресс" : "Progress",
  };

  const displayTitle = (locale === "ru" && titleRu) ? titleRu : title;
  const displayDescription =
    (locale === "ru" && descriptionRu) ? descriptionRu : description;

  const Icon = challengeIcons[challengeType] || Target;
  const gradientColor = challengeColors[challengeType] || challengeColors.custom;

  const progressPercent = Math.min(100, (currentProgress / targetValue) * 100);

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsLoading(true);
    try {
      await onJoin(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!onClaim) return;
    setIsLoading(true);
    try {
      await onClaim(id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard
      glass="frosted"
      padding="none"
      className={cn(
        "overflow-hidden transition-all duration-300",
        isCompleted && "ring-2 ring-green-500/50",
        className
      )}
    >
      {/* Header with gradient */}
      <div
        className={cn(
          "relative p-4 bg-gradient-to-r",
          gradientColor
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold">{displayTitle}</h3>
              <p className="text-xs text-white/80">
                {participantCount} {t.participants}
              </p>
            </div>
          </div>

          {/* Reward badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
            <Trophy className="w-4 h-4" />
            <span>+{rewardPoints}</span>
          </div>
        </div>

        {/* Time remaining */}
        {!isCompleted && daysRemaining > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white/80">
            <Clock className="w-3 h-3" />
            <span>
              {daysRemaining} {daysRemaining === 1 ? t.dayLeft : t.daysLeft}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {displayDescription && (
          <p className="text-sm text-muted-foreground mb-4">
            {displayDescription}
          </p>
        )}

        {/* Progress section */}
        {isJoined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t.progress}</span>
              <span className="font-medium">
                {currentProgress} / {targetValue}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={cn(
                "h-2",
                isCompleted && "bg-green-100 dark:bg-green-900/30"
              )}
            />
          </div>
        )}

        {/* Action button */}
        {!isJoined && !isCompleted && (
          <Button
            onClick={handleJoin}
            disabled={isLoading}
            className={cn("w-full bg-gradient-to-r text-white", gradientColor)}
          >
            {t.join}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {isJoined && !isCompleted && (
          <div className="text-center text-sm text-muted-foreground">
            {Math.round(progressPercent)}%{" "}
            {locale === "ru" ? "выполнено" : "complete"}
          </div>
        )}

        {isCompleted && (
          <Button
            onClick={handleClaim}
            disabled={isLoading}
            variant="outline"
            className="w-full border-green-500 text-green-500 hover:bg-green-500/10"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t.claim}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}

export default ChallengeCard;
