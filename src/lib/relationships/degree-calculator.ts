/**
 * Degree Calculator - Compute human-readable relationship descriptions
 *
 * Handles:
 * - Direct relationships (parent, child, sibling, spouse)
 * - Cousin degrees (1st, 2nd, 3rd cousin)
 * - Removal levels (once removed, twice removed)
 * - Extended relationships (aunt/uncle, niece/nephew)
 * - Localization (English and Russian)
 */

import type { PathStep } from './path-finder';

export interface RelationshipDegree {
  /** Short label like "2nd cousin once removed" */
  label: string;
  /** Full description like "Your father's sister's grandson" */
  description: string;
  /** Numeric degree of separation */
  degree: number;
  /** Category: direct, extended, cousin */
  category: 'direct' | 'extended' | 'cousin' | 'in-law' | 'other';
}

/**
 * Calculate the relationship degree from a path of relationships
 */
export function calculateRelationshipDegree(
  path: PathStep[],
  locale: 'en' | 'ru' = 'en'
): RelationshipDegree {
  if (path.length === 0) {
    return {
      label: locale === 'ru' ? 'Связь не найдена' : 'No connection',
      description: '',
      degree: -1,
      category: 'other',
    };
  }

  if (path.length === 1) {
    return {
      label: locale === 'ru' ? 'Это вы' : 'Same person',
      description: '',
      degree: 0,
      category: 'direct',
    };
  }

  // Extract relationship chain
  const relationships = path
    .slice(0, -1)
    .map(p => p.relationshipType)
    .filter((r): r is string => r !== null);

  if (relationships.length === 0) {
    return {
      label: locale === 'ru' ? 'Связь' : 'Connected',
      description: '',
      degree: path.length - 1,
      category: 'other',
    };
  }

  // Single-step relationships
  if (relationships.length === 1) {
    return getSingleRelationshipDegree(relationships[0], locale);
  }

  // Multi-step relationships - need to compute
  return computeCompositeRelationship(relationships, locale);
}

/**
 * Get degree for single-step relationship
 */
function getSingleRelationshipDegree(
  relType: string,
  locale: 'en' | 'ru'
): RelationshipDegree {
  const labels: Record<string, { en: string; ru: string; category: RelationshipDegree['category'] }> = {
    parent: { en: 'Parent', ru: 'Родитель', category: 'direct' },
    child: { en: 'Child', ru: 'Ребёнок', category: 'direct' },
    sibling: { en: 'Sibling', ru: 'Брат/сестра', category: 'direct' },
    spouse: { en: 'Spouse', ru: 'Супруг(а)', category: 'direct' },
    grandparent: { en: 'Grandparent', ru: 'Бабушка/дедушка', category: 'direct' },
    grandchild: { en: 'Grandchild', ru: 'Внук/внучка', category: 'direct' },
    'great-grandparent': { en: 'Great-grandparent', ru: 'Прабабушка/прадедушка', category: 'direct' },
    'great-grandchild': { en: 'Great-grandchild', ru: 'Правнук/правнучка', category: 'direct' },
    aunt: { en: 'Aunt', ru: 'Тётя', category: 'extended' },
    uncle: { en: 'Uncle', ru: 'Дядя', category: 'extended' },
    aunt_uncle: { en: 'Aunt/Uncle', ru: 'Дядя/тётя', category: 'extended' },
    niece: { en: 'Niece', ru: 'Племянница', category: 'extended' },
    nephew: { en: 'Nephew', ru: 'Племянник', category: 'extended' },
    niece_nephew: { en: 'Niece/Nephew', ru: 'Племянник/племянница', category: 'extended' },
    cousin: { en: 'Cousin', ru: 'Двоюродный брат/сестра', category: 'cousin' },
  };

  const info = labels[relType];
  if (info) {
    return {
      label: info[locale],
      description: '',
      degree: 1,
      category: info.category,
    };
  }

  return {
    label: relType,
    description: '',
    degree: 1,
    category: 'other',
  };
}

/**
 * Compute relationship from chain of relationships
 * Uses generational math to determine cousin degree and removal
 */
function computeCompositeRelationship(
  relationships: string[],
  locale: 'en' | 'ru'
): RelationshipDegree {
  // Classify each relationship (for future use in description building)
  // Currently we use pattern analysis instead

  // Build description path
  const descriptionParts: string[] = [];
  for (const rel of relationships) {
    descriptionParts.push(getRelationshipPossessive(rel, locale));
  }

  const description = descriptionParts.join(' ');

  // Analyze the pattern to determine relationship type
  const pattern = analyzeRelationshipPattern(relationships);

  if (pattern.type === 'direct-line') {
    // Direct ancestor or descendant
    return getDirectLineRelationship(pattern.steps, locale);
  }

  if (pattern.type === 'sibling-line') {
    // Through siblings - aunts/uncles/cousins/niblings
    return getSiblingLineRelationship(pattern, locale);
  }

  if (pattern.type === 'spouse-line') {
    // In-law relationships
    return getInLawRelationship(pattern, locale);
  }

  // Generic calculation based on path length
  return {
    label: locale === 'ru' ? `Родственник (${relationships.length} колено)` : `Relative (${relationships.length} steps)`,
    description,
    degree: relationships.length,
    category: 'other',
  };
}

/**
 * Get the generational step for a relationship
 * +1 = up one generation, -1 = down one generation, 0 = same generation
 */
function getGenerationStep(relType: string): number {
  const steps: Record<string, number> = {
    parent: 1,
    child: -1,
    grandparent: 2,
    grandchild: -2,
    'great-grandparent': 3,
    'great-grandchild': -3,
    sibling: 0,
    spouse: 0,
    cousin: 0,
    aunt: 1,
    uncle: 1,
    aunt_uncle: 1,
    niece: -1,
    nephew: -1,
    niece_nephew: -1,
  };

  return steps[relType] ?? 0;
}

/**
 * Get possessive form for description
 */
function getRelationshipPossessive(relType: string, locale: 'en' | 'ru'): string {
  const forms: Record<string, { en: string; ru: string }> = {
    parent: { en: "parent's", ru: 'родителя' },
    child: { en: "child's", ru: 'ребёнка' },
    sibling: { en: "sibling's", ru: 'брата/сестры' },
    spouse: { en: "spouse's", ru: 'супруга(и)' },
    grandparent: { en: "grandparent's", ru: 'бабушки/дедушки' },
    grandchild: { en: "grandchild's", ru: 'внука/внучки' },
    aunt: { en: "aunt's", ru: 'тёти' },
    uncle: { en: "uncle's", ru: 'дяди' },
    aunt_uncle: { en: "aunt/uncle's", ru: 'дяди/тёти' },
    niece: { en: "niece's", ru: 'племянницы' },
    nephew: { en: "nephew's", ru: 'племянника' },
    niece_nephew: { en: "niece/nephew's", ru: 'племянника/племянницы' },
    cousin: { en: "cousin's", ru: 'кузена/кузины' },
  };

  return forms[relType]?.[locale] || relType;
}

interface RelationshipPattern {
  type: 'direct-line' | 'sibling-line' | 'spouse-line' | 'complex';
  steps: number;
  upSteps: number;
  downSteps: number;
  hasSibling: boolean;
  hasSpouse: boolean;
}

/**
 * Analyze the pattern of relationships
 */
function analyzeRelationshipPattern(relationships: string[]): RelationshipPattern {
  let upSteps = 0;
  let downSteps = 0;
  let hasSibling = false;
  let hasSpouse = false;

  for (const rel of relationships) {
    if (rel === 'sibling') {
      hasSibling = true;
    } else if (rel === 'spouse') {
      hasSpouse = true;
    } else if (['parent', 'grandparent', 'great-grandparent'].includes(rel)) {
      upSteps += getGenerationStep(rel);
    } else if (['child', 'grandchild', 'great-grandchild'].includes(rel)) {
      downSteps += Math.abs(getGenerationStep(rel));
    } else if (['aunt', 'uncle', 'aunt_uncle'].includes(rel)) {
      upSteps += 1;
      hasSibling = true; // aunt/uncle implies parent's sibling
    } else if (['niece', 'nephew', 'niece_nephew'].includes(rel)) {
      downSteps += 1;
      hasSibling = true; // niece/nephew implies sibling's child
    }
  }

  if (!hasSibling && !hasSpouse) {
    return { type: 'direct-line', steps: upSteps - downSteps, upSteps, downSteps, hasSibling, hasSpouse };
  }

  if (hasSibling && !hasSpouse) {
    return { type: 'sibling-line', steps: upSteps - downSteps, upSteps, downSteps, hasSibling, hasSpouse };
  }

  if (hasSpouse) {
    return { type: 'spouse-line', steps: upSteps - downSteps, upSteps, downSteps, hasSibling, hasSpouse };
  }

  return { type: 'complex', steps: 0, upSteps, downSteps, hasSibling, hasSpouse };
}

/**
 * Get direct line relationship (ancestor/descendant)
 */
function getDirectLineRelationship(steps: number, locale: 'en' | 'ru'): RelationshipDegree {
  if (steps === 0) {
    return { label: locale === 'ru' ? 'Брат/сестра' : 'Sibling', description: '', degree: 1, category: 'direct' };
  }

  const absSteps = Math.abs(steps);
  const isAncestor = steps > 0;

  if (absSteps === 1) {
    return {
      label: isAncestor
        ? (locale === 'ru' ? 'Родитель' : 'Parent')
        : (locale === 'ru' ? 'Ребёнок' : 'Child'),
      description: '',
      degree: 1,
      category: 'direct',
    };
  }

  if (absSteps === 2) {
    return {
      label: isAncestor
        ? (locale === 'ru' ? 'Бабушка/дедушка' : 'Grandparent')
        : (locale === 'ru' ? 'Внук/внучка' : 'Grandchild'),
      description: '',
      degree: 2,
      category: 'direct',
    };
  }

  // Great-grandparent/great-grandchild and beyond
  const greatPrefix = absSteps - 2;
  if (locale === 'ru') {
    const prefix = greatPrefix === 1 ? 'Пра' : `Пра${'пра'.repeat(greatPrefix - 1)}`;
    return {
      label: isAncestor ? `${prefix}бабушка/дедушка` : `${prefix}внук/внучка`,
      description: '',
      degree: absSteps,
      category: 'direct',
    };
  } else {
    const prefix = 'Great-'.repeat(greatPrefix);
    return {
      label: isAncestor ? `${prefix}grandparent` : `${prefix}grandchild`,
      description: '',
      degree: absSteps,
      category: 'direct',
    };
  }
}

/**
 * Get sibling-line relationship (aunt/uncle/cousin/niece/nephew)
 */
function getSiblingLineRelationship(
  pattern: RelationshipPattern,
  locale: 'en' | 'ru'
): RelationshipDegree {
  const { upSteps, downSteps } = pattern;

  // Aunt/Uncle: up 1+, then sibling, no down
  if (upSteps > 0 && downSteps === 0) {
    const level = upSteps - 1; // 0 = direct aunt/uncle, 1 = great-aunt, etc.

    if (level === 0) {
      return {
        label: locale === 'ru' ? 'Дядя/тётя' : 'Aunt/Uncle',
        description: '',
        degree: 2,
        category: 'extended',
      };
    }

    if (locale === 'ru') {
      const prefix = level === 1 ? 'Двоюродный' : `${level + 1}-юродный`;
      return {
        label: `${prefix} дядя/тётя`,
        description: '',
        degree: level + 2,
        category: 'extended',
      };
    } else {
      const ordinal = getOrdinal(level, locale);
      return {
        label: level === 1 ? 'Great-aunt/uncle' : `${ordinal} great-aunt/uncle`,
        description: '',
        degree: level + 2,
        category: 'extended',
      };
    }
  }

  // Niece/Nephew: sibling, then down
  if (upSteps === 0 && downSteps > 0) {
    const level = downSteps - 1;

    if (level === 0) {
      return {
        label: locale === 'ru' ? 'Племянник/племянница' : 'Niece/Nephew',
        description: '',
        degree: 2,
        category: 'extended',
      };
    }

    if (locale === 'ru') {
      const prefix = level === 1 ? 'Внучатый' : `${level + 1}-внучатый`;
      return {
        label: `${prefix} племянник/племянница`,
        description: '',
        degree: level + 2,
        category: 'extended',
      };
    } else {
      const ordinal = getOrdinal(level, locale);
      return {
        label: level === 1 ? 'Grand-niece/nephew' : `${ordinal} grand-niece/nephew`,
        description: '',
        degree: level + 2,
        category: 'extended',
      };
    }
  }

  // Cousin: up and down from common ancestor
  if (upSteps > 0 && downSteps > 0) {
    const minSteps = Math.min(upSteps, downSteps);
    const cousinDegree = minSteps; // 1 = first cousin, 2 = second cousin, etc.
    const removal = Math.abs(upSteps - downSteps);

    return getCousinRelationship(cousinDegree, removal, locale);
  }

  return {
    label: locale === 'ru' ? 'Родственник' : 'Relative',
    description: '',
    degree: upSteps + downSteps + 1,
    category: 'extended',
  };
}

/**
 * Get cousin relationship with degree and removal
 */
function getCousinRelationship(
  degree: number,
  removal: number,
  locale: 'en' | 'ru'
): RelationshipDegree {
  const ordinal = getOrdinal(degree, locale);

  if (locale === 'ru') {
    const degreeWords: Record<number, string> = {
      1: 'Двоюродный',
      2: 'Троюродный',
      3: 'Четвероюродный',
      4: 'Пятиюродный',
      5: 'Шестиюродный',
    };

    const base = degreeWords[degree] || `${degree}-юродный`;
    const removedText = removal > 0
      ? ` (${removal === 1 ? 'раз' : removal} в стороне)`
      : '';

    return {
      label: `${base} брат/сестра${removedText}`,
      description: '',
      degree: degree + removal + 1,
      category: 'cousin',
    };
  } else {
    const removedText = removal > 0
      ? ` ${getRemovalText(removal, locale)}`
      : '';

    return {
      label: `${ordinal} cousin${removedText}`,
      description: '',
      degree: degree + removal + 1,
      category: 'cousin',
    };
  }
}

/**
 * Get ordinal text (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number, locale: 'en' | 'ru'): string {
  if (locale === 'ru') {
    const ordinals: Record<number, string> = {
      1: '1-й',
      2: '2-й',
      3: '3-й',
      4: '4-й',
      5: '5-й',
    };
    return ordinals[n] || `${n}-й`;
  }

  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${n}${suffix}`;
}

/**
 * Get removal text (once removed, twice removed, etc.)
 */
function getRemovalText(removal: number, locale: 'en' | 'ru'): string {
  if (locale === 'ru') {
    return removal === 1 ? '(раз в стороне)' : `(${removal} раза в стороне)`;
  }

  const words: Record<number, string> = {
    1: 'once removed',
    2: 'twice removed',
    3: 'thrice removed',
  };

  return words[removal] || `${removal}x removed`;
}

/**
 * Get in-law relationship
 */
function getInLawRelationship(
  pattern: RelationshipPattern,
  locale: 'en' | 'ru'
): RelationshipDegree {
  // This is simplified - real in-law calculation is complex
  return {
    label: locale === 'ru' ? 'Свойственник' : 'In-law',
    description: '',
    degree: pattern.upSteps + pattern.downSteps + 1,
    category: 'in-law',
  };
}

/**
 * Calculate degree description from path length
 */
export function getDegreesOfSeparation(pathLength: number, locale: 'en' | 'ru' = 'en'): string {
  if (pathLength === 0) {
    return locale === 'ru' ? 'Это вы' : 'Same person';
  }
  if (pathLength === 1) {
    return locale === 'ru' ? 'Прямое родство' : 'Directly related';
  }

  if (locale === 'ru') {
    const ordinals: Record<number, string> = {
      2: '2-я степень родства',
      3: '3-я степень родства',
      4: '4-я степень родства',
      5: '5-я степень родства',
    };
    return ordinals[pathLength] || `${pathLength}-я степень родства`;
  } else {
    if (pathLength === 2) return '2nd degree';
    if (pathLength === 3) return '3rd degree';
    return `${pathLength}th degree`;
  }
}
