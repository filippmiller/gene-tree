/**
 * Types for "How Are We Related?" feature
 */

export interface PathStep {
  profileId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  relationshipType: string | null;
  direction: 'up' | 'down' | 'lateral' | null;
}

export interface RelationshipPathResult {
  found: boolean;
  pathLength: number;
  path: PathStep[];
  relationshipLabel: string;
  relationshipDescription: string;
  degreeOfSeparation: string;
  category: 'direct' | 'extended' | 'cousin' | 'in-law' | 'other';
}

// Backward compatibility - old PathNode type
export interface PathNode {
  profile_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  relationship_to_next: string | null;
}

// API Request/Response types
export interface FindRelationshipPathRequest {
  person1_id: string;
  person2_id: string;
  locale?: 'en' | 'ru';
  max_depth?: number;
}

export interface FindRelationshipPathResponse {
  success: boolean;
  result?: RelationshipPathResult;
  error?: string;
}

// Helper function to get relationship label with locale
export function getRelationshipLabel(type: string | null, locale: 'en' | 'ru' = 'en'): string {
  if (!type) return '';

  const labels: Record<string, { en: string; ru: string }> = {
    parent: { en: 'Parent', ru: 'Родитель' },
    child: { en: 'Child', ru: 'Ребёнок' },
    spouse: { en: 'Spouse', ru: 'Супруг(а)' },
    sibling: { en: 'Sibling', ru: 'Брат/сестра' },
    grandparent: { en: 'Grandparent', ru: 'Бабушка/дедушка' },
    grandchild: { en: 'Grandchild', ru: 'Внук/внучка' },
    aunt: { en: 'Aunt', ru: 'Тётя' },
    uncle: { en: 'Uncle', ru: 'Дядя' },
    aunt_uncle: { en: 'Aunt/Uncle', ru: 'Дядя/тётя' },
    niece: { en: 'Niece', ru: 'Племянница' },
    nephew: { en: 'Nephew', ru: 'Племянник' },
    niece_nephew: { en: 'Niece/Nephew', ru: 'Племянник/племянница' },
    cousin: { en: 'Cousin', ru: 'Двоюродный брат/сестра' },
    'great-grandparent': { en: 'Great-grandparent', ru: 'Прабабушка/прадедушка' },
    'great-grandchild': { en: 'Great-grandchild', ru: 'Правнук/правнучка' },
    step_parent: { en: 'Step-parent', ru: 'Приёмный родитель' },
    step_child: { en: 'Step-child', ru: 'Приёмный ребёнок' },
    step_sibling: { en: 'Step-sibling', ru: 'Сводный брат/сестра' },
    in_law: { en: 'In-law', ru: 'Свойственник' },
    other: { en: 'Related', ru: 'Родственник' },
  };

  return labels[type]?.[locale] || type;
}

export function getRelationshipArrow(type: string | null): string {
  if (!type) return '';

  // Directional relationships
  const upward = ['parent', 'grandparent', 'great-grandparent', 'aunt', 'uncle', 'aunt_uncle'];
  const downward = ['child', 'grandchild', 'great-grandchild', 'niece', 'nephew', 'niece_nephew'];
  const lateral = ['sibling', 'spouse', 'cousin', 'step_sibling'];

  if (upward.includes(type)) return '\u2191'; // up arrow
  if (downward.includes(type)) return '\u2193'; // down arrow
  if (lateral.includes(type)) return '\u2194'; // left-right arrow

  return '\u2192'; // right arrow
}

export function describeRelationship(path: PathStep[], locale: 'en' | 'ru' = 'en'): string {
  if (path.length === 0) return locale === 'ru' ? 'Связь не найдена' : 'No connection found';
  if (path.length === 1) return locale === 'ru' ? 'Это вы' : 'Same person';
  if (path.length === 2) {
    const rel = path[0].relationshipType;
    return getRelationshipLabel(rel, locale);
  }

  // For longer paths, describe the full connection
  const steps: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    if (path[i].relationshipType) {
      steps.push(getRelationshipLabel(path[i].relationshipType, locale));
    }
  }

  if (steps.length === 0) return locale === 'ru' ? 'Связаны' : 'Connected';
  if (steps.length === 1) return steps[0];
  if (steps.length === 2) {
    const connector = locale === 'ru' ? ' -> ' : "'s ";
    return `${steps[0]}${connector}${steps[1]}`;
  }

  return steps.join(' \u2192 ');
}

export function getDegreesOfSeparation(pathLength: number | null, locale: 'en' | 'ru' = 'en'): string {
  if (pathLength === null) return locale === 'ru' ? 'Не связаны' : 'Not connected';
  if (pathLength === 0) return locale === 'ru' ? 'Это вы' : 'Same person';
  if (pathLength === 1) return locale === 'ru' ? 'Прямое родство' : 'Directly connected';

  if (locale === 'ru') {
    return `${pathLength}-я степень родства`;
  }

  if (pathLength === 2) return '2nd degree';
  if (pathLength === 3) return '3rd degree';
  return `${pathLength}th degree`;
}

export function formatPathForDisplay(path: PathStep[], _locale: 'en' | 'ru' = 'en'): string {
  if (path.length === 0) return '';

  return path
    .map((node, i) => {
      const name = `${node.firstName} ${node.lastName}`.trim() || '?';
      if (i === path.length - 1) return name;
      const arrow = getRelationshipArrow(node.relationshipType);
      return `${name} ${arrow}`;
    })
    .join(' ');
}

/**
 * Get category color class for styling
 */
export function getCategoryColor(category: RelationshipPathResult['category']): string {
  const colors: Record<typeof category, string> = {
    direct: 'from-emerald-500 to-green-600',
    extended: 'from-blue-500 to-indigo-600',
    cousin: 'from-purple-500 to-violet-600',
    'in-law': 'from-amber-500 to-orange-600',
    other: 'from-gray-500 to-slate-600',
  };
  return colors[category] || colors.other;
}
