/**
 * QuickAddMenu.tsx
 *
 * Quick-add buttons that appear around a person card in the tree view.
 * Allows users to quickly add relatives directly from the visualization.
 *
 * Buttons:
 * - Top: Add Parent
 * - Bottom: Add Child
 * - Left: Add Sibling
 * - Right: Add Spouse
 *
 * Usage: Rendered inside PersonCard when selected/hovered
 */

'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Users, Heart, Baby } from 'lucide-react';

export type QuickAddType = 'parent' | 'child' | 'spouse' | 'sibling';

interface QuickAddMenuProps {
  personId: string;
  personName: string;
  onAdd?: (type: QuickAddType) => void;
  visible: boolean;
}

/**
 * QuickAddButton - Individual add button with icon and tooltip
 */
function QuickAddButton({
  buttonType,
  position,
  onClick,
  label,
  icon: Icon,
}: {
  buttonType: QuickAddType;
  position: string;
  onClick: () => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        absolute ${position}
        w-7 h-7 rounded-full
        bg-green-500 hover:bg-green-600
        text-white shadow-lg
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        group
        z-20
      `}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
      {/* Tooltip */}
      <span className={`
        absolute whitespace-nowrap
        px-2 py-1 rounded text-xs
        bg-gray-900 text-white
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        ${buttonType === 'parent' ? 'bottom-full mb-1' : ''}
        ${buttonType === 'child' ? 'top-full mt-1' : ''}
        ${buttonType === 'sibling' ? 'right-full mr-1' : ''}
        ${buttonType === 'spouse' ? 'left-full ml-1' : ''}
      `}>
        {label}
      </span>
    </button>
  );
}

/**
 * QuickAddMenu - Container for all quick-add buttons
 */
export function QuickAddMenu({ personId, onAdd, visible }: QuickAddMenuProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const handleAdd = (type: QuickAddType) => {
    if (onAdd) {
      onAdd(type);
    } else {
      // Default behavior: navigate to add relative page
      const url = `/${locale}/people/new?relatedTo=${personId}&relationType=${type}`;
      router.push(url);
    }
  };

  if (!visible) return null;

  // Labels based on locale
  const labels = {
    parent: locale === 'ru' ? 'Добавить родителя' : 'Add Parent',
    child: locale === 'ru' ? 'Добавить ребёнка' : 'Add Child',
    spouse: locale === 'ru' ? 'Добавить супруга' : 'Add Spouse',
    sibling: locale === 'ru' ? 'Добавить брата/сестру' : 'Add Sibling',
  };

  return (
    <>
      {/* Parent - Top center */}
      <QuickAddButton
        buttonType="parent"
        position="-top-4 left-1/2 -translate-x-1/2"
        onClick={() => handleAdd('parent')}
        label={labels.parent}
        icon={Users}
      />

      {/* Child - Bottom center */}
      <QuickAddButton
        buttonType="child"
        position="-bottom-4 left-1/2 -translate-x-1/2"
        onClick={() => handleAdd('child')}
        label={labels.child}
        icon={Baby}
      />

      {/* Sibling - Left center */}
      <QuickAddButton
        buttonType="sibling"
        position="top-1/2 -left-4 -translate-y-1/2"
        onClick={() => handleAdd('sibling')}
        label={labels.sibling}
        icon={Plus}
      />

      {/* Spouse - Right center */}
      <QuickAddButton
        buttonType="spouse"
        position="top-1/2 -right-4 -translate-y-1/2"
        onClick={() => handleAdd('spouse')}
        label={labels.spouse}
        icon={Heart}
      />
    </>
  );
}

export default QuickAddMenu;
