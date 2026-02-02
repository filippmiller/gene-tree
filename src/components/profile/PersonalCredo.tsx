"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Quote, Pencil, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PersonalCredoProps
  extends React.HTMLAttributes<HTMLDivElement> {
  lifeMotto?: string | null;
  personalStatement?: string | null;
  memorialQuote?: string | null;
  isOwnProfile?: boolean;
  isDeceasedProfile?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  showExpanded?: boolean;
}

/**
 * PersonalCredo Component
 *
 * Displays the life motto and personal statement for a profile.
 * Special memorial styling for deceased profiles.
 *
 * Character limits:
 * - Life Motto: 150 characters (always visible)
 * - Personal Statement: 500 characters (expandable)
 * - Memorial Quote: unlimited (for deceased, added by family)
 */
export function PersonalCredo({
  lifeMotto,
  personalStatement,
  memorialQuote,
  isOwnProfile = false,
  isDeceasedProfile = false,
  canEdit = false,
  onEdit,
  showExpanded = false,
  className,
  ...props
}: PersonalCredoProps) {
  const locale = useLocale() as "en" | "ru";
  const [expanded, setExpanded] = React.useState(showExpanded);

  // For deceased, prefer memorial quote, then life motto
  const displayQuote = isDeceasedProfile
    ? memorialQuote || lifeMotto
    : lifeMotto;

  const hasContent = displayQuote || personalStatement;
  const hasExpandableContent = personalStatement && personalStatement.length > 0;

  if (!hasContent && !canEdit) {
    return null;
  }

  const emptyText = isOwnProfile
    ? locale === "ru"
      ? "Добавьте ваш жизненный девиз"
      : "Add your life motto"
    : null;

  return (
    <div
      className={cn(
        "relative",
        isDeceasedProfile && "py-4",
        className
      )}
      {...props}
    >
      {/* Memorial candle icon for deceased */}
      {isDeceasedProfile && displayQuote && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-30">
          <Flame className="w-4 h-4 text-amber-500" />
        </div>
      )}

      {displayQuote ? (
        <blockquote
          className={cn(
            "relative",
            isDeceasedProfile
              ? "text-gray-600 dark:text-gray-400"
              : "text-foreground"
          )}
        >
          {/* Decorative opening quote */}
          <span
            className={cn(
              "absolute -left-2 -top-2 text-4xl font-serif leading-none opacity-20",
              isDeceasedProfile
                ? "text-gray-400"
                : "text-primary"
            )}
          >
            &laquo;
          </span>

          {/* Quote text */}
          <p
            className={cn(
              "pl-4 pr-6 italic",
              isDeceasedProfile
                ? "text-lg leading-relaxed"
                : "text-base leading-relaxed"
            )}
          >
            {displayQuote}
          </p>

          {/* Decorative closing quote */}
          <span
            className={cn(
              "absolute -right-1 bottom-0 text-4xl font-serif leading-none opacity-20",
              isDeceasedProfile
                ? "text-gray-400"
                : "text-primary"
            )}
          >
            &raquo;
          </span>

          {/* Edit button */}
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-2 -top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </blockquote>
      ) : canEdit ? (
        <button
          onClick={onEdit}
          className={cn(
            "w-full py-4 px-4 rounded-lg border-2 border-dashed",
            "text-muted-foreground hover:text-foreground",
            "hover:border-primary/50 hover:bg-primary/5",
            "transition-all duration-200",
            "flex items-center justify-center gap-2"
          )}
        >
          <Quote className="w-4 h-4" />
          <span className="text-sm">{emptyText}</span>
        </button>
      ) : null}

      {/* Expandable personal statement */}
      {hasExpandableContent && !isDeceasedProfile && (
        <div className="mt-3">
          {expanded ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {personalStatement}
              </p>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-primary hover:underline"
              >
                {locale === "ru" ? "Свернуть" : "Show less"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-primary hover:underline"
            >
              {locale === "ru" ? "Подробнее о себе..." : "More about me..."}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PersonalCredoInput Component
 *
 * Input component for editing life motto and personal statement.
 */
export interface PersonalCredoInputProps {
  lifeMotto: string;
  personalStatement: string;
  onLifeMottoChange: (value: string) => void;
  onPersonalStatementChange: (value: string) => void;
  className?: string;
}

export function PersonalCredoInput({
  lifeMotto,
  personalStatement,
  onLifeMottoChange,
  onPersonalStatementChange,
  className,
}: PersonalCredoInputProps) {
  const locale = useLocale() as "en" | "ru";

  const mottoLimit = 150;
  const statementLimit = 500;

  const mottoLabel = locale === "ru" ? "Мой девиз" : "Life Motto";
  const mottoPlaceholder =
    locale === "ru"
      ? "Краткое высказывание, которое вас характеризует..."
      : "A brief saying that characterizes you...";
  const mottoHint =
    locale === "ru"
      ? "Ваш жизненный девиз или любимая цитата (до 150 символов)"
      : "Your life motto or favorite quote (up to 150 characters)";

  const statementLabel = locale === "ru" ? "О себе" : "About Me";
  const statementPlaceholder =
    locale === "ru"
      ? "Расскажите о себе подробнее..."
      : "Tell more about yourself...";
  const statementHint =
    locale === "ru"
      ? "Расширенная биография (до 500 символов)"
      : "Extended biography (up to 500 characters)";

  const promptSuggestions = locale === "ru"
    ? [
        "Что бы вы хотели, чтобы ваши правнуки знали о вас?",
        "Какой главный урок вы вынесли из жизни?",
        "Что для вас значит семья?",
      ]
    : [
        "What would you want your great-grandchildren to know about you?",
        "What is the main lesson you learned from life?",
        "What does family mean to you?",
      ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Life Motto */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{mottoLabel}</label>
        <div className="relative">
          <textarea
            value={lifeMotto}
            onChange={(e) => onLifeMottoChange(e.target.value.slice(0, mottoLimit))}
            placeholder={mottoPlaceholder}
            className={cn(
              "w-full min-h-[80px] p-3 rounded-lg border",
              "bg-background resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "placeholder:text-muted-foreground/50"
            )}
            maxLength={mottoLimit}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {lifeMotto.length}/{mottoLimit}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{mottoHint}</p>
      </div>

      {/* Personal Statement */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{statementLabel}</label>
        <div className="relative">
          <textarea
            value={personalStatement}
            onChange={(e) =>
              onPersonalStatementChange(e.target.value.slice(0, statementLimit))
            }
            placeholder={statementPlaceholder}
            className={cn(
              "w-full min-h-[120px] p-3 rounded-lg border",
              "bg-background resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "placeholder:text-muted-foreground/50"
            )}
            maxLength={statementLimit}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {personalStatement.length}/{statementLimit}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{statementHint}</p>
      </div>

      {/* Writing prompts */}
      <div className="pt-2 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {locale === "ru" ? "Подсказки для вдохновения:" : "Writing prompts:"}
        </p>
        <ul className="space-y-1">
          {promptSuggestions.map((prompt, idx) => (
            <li
              key={idx}
              className="text-xs text-muted-foreground italic pl-3 border-l-2 border-primary/20"
            >
              {prompt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
