"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { MessageCircle, Clock, Check, X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GlassCard,
  GlassCardContent,
} from "@/components/ui/glass-card";

export interface AssignedPrompt {
  id: string;
  prompt_id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "answered" | "declined";
  response_story_id: string | null;
  message: string | null;
  created_at: string;
  answered_at: string | null;
  prompt?: {
    id: string;
    prompt_text: string;
    prompt_text_ru: string | null;
    category: string;
  };
  from_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  to_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface AssignedPromptsListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  assignments: AssignedPrompt[];
  direction: "received" | "sent";
  onAnswer?: (assignment: AssignedPrompt) => void;
  onDecline?: (assignmentId: string) => void;
  emptyMessage?: string;
}

export function AssignedPromptsList({
  assignments,
  direction,
  onAnswer,
  onDecline,
  emptyMessage,
  className,
  ...props
}: AssignedPromptsListProps) {
  const locale = useLocale() as "en" | "ru";
  const dateLocale = locale === "ru" ? ru : enUS;

  const statusConfig = {
    pending: {
      label: { en: "Pending", ru: "Ожидает" },
      color: "bg-[#D29922]/10 text-[#D29922] dark:bg-[#D29922]/10 dark:text-[#D29922]",
      icon: Clock,
    },
    answered: {
      label: { en: "Answered", ru: "Отвечено" },
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: Check,
    },
    declined: {
      label: { en: "Declined", ru: "Отклонено" },
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      icon: X,
    },
  };

  if (assignments.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12 text-muted-foreground",
          className
        )}
        {...props}
      >
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>
          {emptyMessage ||
            (direction === "received"
              ? locale === "ru"
                ? "Нет полученных вопросов"
                : "No received prompts"
              : locale === "ru"
              ? "Нет отправленных вопросов"
              : "No sent prompts")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {assignments.map((assignment) => {
        const status = statusConfig[assignment.status];
        const StatusIcon = status.icon;
        const promptText =
          (locale === "ru" && assignment.prompt?.prompt_text_ru)
            ? assignment.prompt.prompt_text_ru
            : assignment.prompt?.prompt_text;

        const otherUser =
          direction === "received" ? assignment.from_user : assignment.to_user;

        return (
          <GlassCard
            key={assignment.id}
            glass="subtle"
            padding="md"
            className="hover:shadow-md transition-shadow"
          >
            <GlassCardContent className="space-y-3">
              {/* Header with user and status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback>
                      {otherUser?.first_name?.[0] || "?"}
                      {otherUser?.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {direction === "received"
                        ? locale === "ru"
                          ? "От:"
                          : "From:"
                        : locale === "ru"
                        ? "Кому:"
                        : "To:"}{" "}
                      {otherUser?.first_name} {otherUser?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(assignment.created_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("flex items-center gap-1", status.color)}
                >
                  <StatusIcon className="w-3 h-3" />
                  {status.label[locale]}
                </Badge>
              </div>

              {/* Prompt text */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="font-medium">{promptText}</p>
              </div>

              {/* Personal message if any */}
              {assignment.message && (
                <div className="text-sm text-muted-foreground italic">
                  "{assignment.message}"
                </div>
              )}

              {/* Actions for pending received prompts */}
              {direction === "received" && assignment.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  {onDecline && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecline(assignment.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {locale === "ru" ? "Отклонить" : "Decline"}
                    </Button>
                  )}
                  {onAnswer && (
                    <Button
                      size="sm"
                      onClick={() => onAnswer(assignment)}
                      className="flex-1 bg-[#58A6FF] hover:bg-[#58A6FF]/90 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {locale === "ru" ? "Ответить" : "Answer"}
                    </Button>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}
