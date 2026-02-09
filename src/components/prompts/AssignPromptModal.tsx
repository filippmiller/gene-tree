"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Send, Loader2, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type StoryPrompt, categoryConfig } from "./PromptCard";

export interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  relationship_type?: string;
}

export interface AssignPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: StoryPrompt | null;
  familyMembers: FamilyMember[];
  onAssign: (promptId: string, toUserId: string, message?: string) => Promise<void>;
}

export function AssignPromptModal({
  isOpen,
  onClose,
  prompt,
  familyMembers,
  onAssign,
}: AssignPromptModalProps) {
  const locale = useLocale() as "en" | "ru";
  const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedMember(null);
      setMessage("");
      setSearchQuery("");
      setError(null);
    }
  }, [isOpen]);

  // Filter family members
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return familyMembers;
    const query = searchQuery.toLowerCase();
    return familyMembers.filter(
      (m) =>
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query)
    );
  }, [familyMembers, searchQuery]);

  const handleSubmit = async () => {
    if (!prompt || !selectedMember) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAssign(prompt.id, selectedMember, message || undefined);
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError(
        locale === "ru"
          ? "Не удалось отправить вопрос"
          : "Failed to send prompt"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!prompt) return null;

  const promptText =
    (locale === "ru" && prompt.prompt_text_ru)
      ? prompt.prompt_text_ru
      : prompt.prompt_text;

  const category = categoryConfig[prompt.category];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#58A6FF]" />
            {locale === "ru" ? "Отправить вопрос" : "Send Prompt"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ru"
              ? "Выберите родственника, которому хотите задать этот вопрос"
              : "Choose a family member to ask this question"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt preview */}
          <div className="p-4 rounded-lg bg-[#58A6FF]/5 dark:bg-[#58A6FF]/5 border border-[#58A6FF]/20 dark:border-[#58A6FF]/20">
            <span
              className={cn(
                "inline-block text-xs px-2 py-0.5 rounded mb-2",
                category?.color || "bg-gray-100 text-gray-700"
              )}
            >
              {category?.label[locale] || prompt.category}
            </span>
            <p className="font-medium">{promptText}</p>
          </div>

          {/* Family member search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === "ru" ? "Выберите получателя" : "Select Recipient"}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={locale === "ru" ? "Поиск..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Family members list */}
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-1">
            {filteredMembers.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-sm">
                {locale === "ru" ? "Никого не найдено" : "No members found"}
              </p>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md transition-colors",
                    selectedMember === member.id
                      ? "bg-[#58A6FF]/10 dark:bg-[#58A6FF]/10 border border-[#58A6FF]/30 dark:border-[#58A6FF]/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.first_name[0]}
                      {member.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.relationship_type && (
                      <p className="text-xs text-muted-foreground">
                        {member.relationship_type}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Optional message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === "ru"
                ? "Личное сообщение (необязательно)"
                : "Personal Message (optional)"}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                locale === "ru"
                  ? "Добавьте личное сообщение..."
                  : "Add a personal message..."
              }
              rows={2}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {locale === "ru" ? "Отмена" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMember || isSubmitting}
            className="bg-[#58A6FF] hover:bg-[#58A6FF]/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {locale === "ru" ? "Отправка..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {locale === "ru" ? "Отправить" : "Send"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
