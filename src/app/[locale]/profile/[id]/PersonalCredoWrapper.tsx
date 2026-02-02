"use client";

import { useState } from "react";
import { PersonalCredo, PersonalCredoInput } from "@/components/profile/PersonalCredo";
import { useCredo } from "@/hooks/useHonorTags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PersonalCredoWrapperProps {
  profileId: string;
  isOwnProfile: boolean;
  isDeceasedProfile: boolean;
  locale: "en" | "ru";
}

/**
 * Client-side wrapper for personal credo functionality
 */
export default function PersonalCredoWrapper({
  profileId,
  isOwnProfile,
  isDeceasedProfile,
  locale,
}: PersonalCredoWrapperProps) {
  const { credo, loading, updateCredo } = useCredo(profileId);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [lifeMotto, setLifeMotto] = useState("");
  const [personalStatement, setPersonalStatement] = useState("");

  const canEdit = isOwnProfile;

  const handleOpenEdit = () => {
    setLifeMotto(credo?.life_motto || "");
    setPersonalStatement(credo?.personal_statement || "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCredo({
        life_motto: lifeMotto,
        personal_statement: personalStatement,
      });
      setEditOpen(false);
    } catch (error) {
      console.error("Error saving credo:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null; // Don't show placeholder for credo
  }

  const hasContent =
    credo?.life_motto ||
    credo?.personal_statement ||
    credo?.memorial_quote;

  // Don't show if no content and can't edit
  if (!hasContent && !canEdit) {
    return null;
  }

  return (
    <>
      <div className="group">
        <PersonalCredo
          lifeMotto={credo?.life_motto}
          personalStatement={credo?.personal_statement}
          memorialQuote={credo?.memorial_quote}
          isOwnProfile={isOwnProfile}
          isDeceasedProfile={isDeceasedProfile}
          canEdit={canEdit}
          onEdit={handleOpenEdit}
        />
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {locale === "ru" ? "Редактировать девиз" : "Edit Life Motto"}
            </DialogTitle>
          </DialogHeader>

          <PersonalCredoInput
            lifeMotto={lifeMotto}
            personalStatement={personalStatement}
            onLifeMottoChange={setLifeMotto}
            onPersonalStatementChange={setPersonalStatement}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              {locale === "ru" ? "Отмена" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {locale === "ru" ? "Сохранить" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
