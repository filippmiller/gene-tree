import kinshipConfig from './kinship-config.json';

export type Gender = 'male' | 'female' | 'nonbinary' | 'unknown';
export type Halfness = 'full' | 'half' | 'adoptive' | 'foster';
export type Lineage = 'maternal' | 'paternal' | 'both' | 'unknown';

export interface RelationshipQualifiers {
  halfness?: Halfness;
  lineage?: Lineage;
  cousin_degree?: number;
  cousin_removed?: number;
  level?: number;
}

export interface RelationshipInput {
  code: string; // parent, child, sibling, aunt_uncle, niece_nephew, cousin, grandparent, grandchild
  gender: Gender;
  qualifiers?: RelationshipQualifiers;
}

/**
 * Generate relationship label based on type, gender, and qualifiers
 * Following kinship-blood-v1 dictionary rules
 */
export function generateKinshipLabel(
  input: RelationshipInput,
  locale: 'en' | 'ru' = 'ru'
): string {
  const { code, gender, qualifiers = {} } = input;
  const maps = kinshipConfig.maps[locale];

  switch (code) {
    case 'parent':
      return gender === 'male' ? maps.parent_m : 
             gender === 'female' ? maps.parent_f : 'родитель';

    case 'child':
      return gender === 'male' ? maps.child_m : 
             gender === 'female' ? maps.child_f : 'ребёнок';

    case 'grandparent':
      return gender === 'male' ? maps.grandparent_m : 
             gender === 'female' ? maps.grandparent_f : 'прародитель';

    case 'grandchild':
      return gender === 'male' ? maps.grandchild_m : 
             gender === 'female' ? maps.grandchild_f : 'внук/внучка';

    case 'sibling':
      return generateSiblingLabel(gender, qualifiers, maps);

    case 'aunt_uncle':
      return generateAuntUncleLabel(gender, qualifiers, maps);

    case 'niece_nephew':
      return generateNephewNieceLabel(gender, qualifiers, maps);

    case 'cousin':
      return generateCousinLabel(gender, qualifiers, maps);

    default:
      return code;
  }
}

function generateSiblingLabel(
  gender: Gender,
  qualifiers: RelationshipQualifiers,
  maps: any
): string {
  const { halfness = 'full', lineage } = qualifiers;
  const base = gender === 'male' ? maps.sibling_m : maps.sibling_f;

  if (halfness === 'full') {
    return base;
  }

  if (halfness === 'half') {
    const prefix = lineage === 'paternal' 
      ? (gender === 'male' ? maps.half_prefix_paternal_m : maps.half_prefix_paternal_f)
      : (gender === 'male' ? maps.half_prefix_maternal_m : maps.half_prefix_maternal_f);
    return `${prefix} ${base}`;
  }

  if (halfness === 'adoptive') {
    return `приёмный ${base}`;
  }

  if (halfness === 'foster') {
    return `сводный ${base}`;
  }

  return base;
}

function generateAuntUncleLabel(
  gender: Gender,
  qualifiers: RelationshipQualifiers,
  maps: any
): string {
  const { level = 0 } = qualifiers;
  const baseNoun = gender === 'male' ? maps.uncle_m : maps.uncle_f;
  
  if (level === 0) {
    return baseNoun; // родной дядя/тётя
  }

  const prefix = gender === 'male' 
    ? maps.uncle_prefix_m[level] || `${level}-юродный`
    : maps.uncle_prefix_f[level] || `${level}-юродная`;
  
  return `${prefix} ${baseNoun}`.trim();
}

function generateNephewNieceLabel(
  gender: Gender,
  qualifiers: RelationshipQualifiers,
  maps: any
): string {
  const { level = 0 } = qualifiers;
  const baseNoun = gender === 'male' ? maps.nephew_m : maps.nephew_f;
  
  if (level === 0) {
    return baseNoun; // родной племянник/племянница
  }

  const prefix = gender === 'male'
    ? maps.nephew_prefix_m[level] || `${level}-юродный`
    : maps.nephew_prefix_f[level] || `${level}-юродная`;
  
  return `${prefix} ${baseNoun}`.trim();
}

function generateCousinLabel(
  gender: Gender,
  qualifiers: RelationshipQualifiers,
  maps: any
): string {
  const { cousin_degree = 1, cousin_removed = 0 } = qualifiers;
  
  const adj = gender === 'male'
    ? maps.cousin_degree_adj_m[cousin_degree - 1] || `${cousin_degree}-юродный`
    : maps.cousin_degree_adj_f[cousin_degree - 1] || `${cousin_degree}-юродная`;
  
  const noun = gender === 'male' ? maps.sibling_m : maps.sibling_f;
  const removedSuffix = maps.removed_suffix[cousin_removed] || '';
  
  return `${adj} ${noun}${removedSuffix}`;
}

/**
 * Get simple relationship options for UI dropdowns
 */
export function getBloodRelationshipOptions(locale: 'en' | 'ru' = 'ru') {
  return [
    { code: 'parent', label: locale === 'ru' ? 'Родитель' : 'Parent', category: 'direct' },
    { code: 'child', label: locale === 'ru' ? 'Ребёнок' : 'Child', category: 'direct' },
    { code: 'spouse', label: locale === 'ru' ? 'Супруг(а)' : 'Spouse', category: 'direct' },
    { code: 'sibling', label: locale === 'ru' ? 'Брат/Сестра' : 'Sibling', category: 'direct' },
    { code: 'grandparent', label: locale === 'ru' ? 'Дед/Бабушка' : 'Grandparent', category: 'direct' },
    { code: 'grandchild', label: locale === 'ru' ? 'Внук/Внучка' : 'Grandchild', category: 'direct' },
    { code: 'aunt_uncle', label: locale === 'ru' ? 'Дядя/Тётя' : 'Aunt/Uncle', category: 'extended' },
    { code: 'niece_nephew', label: locale === 'ru' ? 'Племянник/Племянница' : 'Nephew/Niece', category: 'extended' },
    { code: 'cousin', label: locale === 'ru' ? 'Двоюродный(ая)' : 'Cousin', category: 'extended' },
  ];
}

/**
 * Get specific gender options for a given relationship code
 */
export function getGenderSpecificOptions(code: string) {
  switch (code) {
    case 'parent':
      return [
        { value: 'mother', label: 'Мама', gender: 'female' as Gender, qualifiers: {} },
        { value: 'father', label: 'Папа', gender: 'male' as Gender, qualifiers: {} },
      ];
    
    case 'child':
      return [
        { value: 'son', label: 'Сын', gender: 'male' as Gender, qualifiers: {} },
        { value: 'daughter', label: 'Дочь', gender: 'female' as Gender, qualifiers: {} },
      ];

    case 'spouse':
      return [
        { value: 'husband', label: 'Муж', gender: 'male' as Gender, qualifiers: {} },
        { value: 'wife', label: 'Жена', gender: 'female' as Gender, qualifiers: {} },
        { value: 'partner', label: 'Партнёр', gender: 'unknown' as Gender, qualifiers: {} },
      ];
    
    case 'sibling':
      return [
        { value: 'brother', label: 'Брат (родной)', gender: 'male' as Gender, qualifiers: { halfness: 'full' as Halfness } },
        { value: 'sister', label: 'Сестра (родная)', gender: 'female' as Gender, qualifiers: { halfness: 'full' as Halfness } },
        { value: 'half_brother_p', label: 'Единокровный брат', gender: 'male' as Gender, qualifiers: { halfness: 'half' as Halfness, lineage: 'paternal' as Lineage } },
        { value: 'half_sister_p', label: 'Единокровная сестра', gender: 'female' as Gender, qualifiers: { halfness: 'half' as Halfness, lineage: 'paternal' as Lineage } },
        { value: 'half_brother_m', label: 'Единоутробный брат', gender: 'male' as Gender, qualifiers: { halfness: 'half' as Halfness, lineage: 'maternal' as Lineage } },
        { value: 'half_sister_m', label: 'Единоутробная сестра', gender: 'female' as Gender, qualifiers: { halfness: 'half' as Halfness, lineage: 'maternal' as Lineage } },
      ];
    
    case 'grandparent':
      return [
        { value: 'grandfather', label: 'Дедушка', gender: 'male' as Gender, qualifiers: {} },
        { value: 'grandmother', label: 'Бабушка', gender: 'female' as Gender, qualifiers: {} },
      ];
    
    case 'grandchild':
      return [
        { value: 'grandson', label: 'Внук', gender: 'male' as Gender, qualifiers: {} },
        { value: 'granddaughter', label: 'Внучка', gender: 'female' as Gender, qualifiers: {} },
      ];
    
    case 'aunt_uncle':
      return [
        { value: 'uncle', label: 'Дядя', gender: 'male' as Gender, qualifiers: { level: 0 } },
        { value: 'aunt', label: 'Тётя', gender: 'female' as Gender, qualifiers: { level: 0 } },
        { value: 'uncle_2nd', label: 'Двоюродный дядя', gender: 'male' as Gender, qualifiers: { level: 1 } },
        { value: 'aunt_2nd', label: 'Двоюродная тётя', gender: 'female' as Gender, qualifiers: { level: 1 } },
      ];
    
    case 'niece_nephew':
      return [
        { value: 'nephew', label: 'Племянник', gender: 'male' as Gender, qualifiers: { level: 0 } },
        { value: 'niece', label: 'Племянница', gender: 'female' as Gender, qualifiers: { level: 0 } },
        { value: 'nephew_2nd', label: 'Двоюродный племянник', gender: 'male' as Gender, qualifiers: { level: 1 } },
        { value: 'niece_2nd', label: 'Двоюродная племянница', gender: 'female' as Gender, qualifiers: { level: 1 } },
      ];
    
    case 'cousin':
      return [
        { value: 'cousin_m_1st', label: 'Двоюродный брат', gender: 'male' as Gender, qualifiers: { cousin_degree: 1, cousin_removed: 0 } },
        { value: 'cousin_f_1st', label: 'Двоюродная сестра', gender: 'female' as Gender, qualifiers: { cousin_degree: 1, cousin_removed: 0 } },
        { value: 'cousin_m_2nd', label: 'Троюродный брат', gender: 'male' as Gender, qualifiers: { cousin_degree: 2, cousin_removed: 0 } },
        { value: 'cousin_f_2nd', label: 'Троюродная сестра', gender: 'female' as Gender, qualifiers: { cousin_degree: 2, cousin_removed: 0 } },
      ];
    
    default:
      return [];
  }
}
