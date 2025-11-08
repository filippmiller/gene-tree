/**
 * Computes the relationship type between the inviter and a new relative
 * based on an intermediate person's relationship.
 * 
 * Example: If I add "sister of my mother", this returns "aunt"
 */

export type DirectRelationship = 
  | 'parent'
  | 'child'
  | 'sibling'
  | 'spouse'
  | 'grandparent'
  | 'grandchild';

export type IndirectRelationship =
  | 'aunt'
  | 'uncle'
  | 'niece'
  | 'nephew'
  | 'cousin'
  | 'great-grandparent'
  | 'great-grandchild';

// In-laws (родственники через брак)
export type InLawRelationship =
  | 'mother-in-law' // тёща (mother of wife) or свекровь (mother of husband)
  | 'father-in-law' // тесть (father of wife) or свёкор (father of husband)
  | 'son-in-law' // зять
  | 'daughter-in-law' // невестка, сноха
  | 'brother-in-law' // деверь (brother of husband) or шурин (brother of wife) or зять (husband of sister)
  | 'sister-in-law' // золовка (sister of husband) or свояченица (sister of wife) or невестка (wife of brother)
  | 'co-brother-in-law' // свояк (husband of wife's sister)
  | 'co-sister-in-law' // между жёнами братьев
  | 'stepfather' // отчим
  | 'stepmother' // мачеха
  | 'stepson' // пасынок
  | 'stepdaughter' // падчерица
  | 'co-parent-in-law'; // сват/сватья

// Godparents
export type SpiritualRelationship =
  | 'godfather' // крёстный отец
  | 'godmother' // крёстная мать
  | 'godson' // крестник
  | 'goddaughter' // крестница
  | 'co-godparent'; // кум/кума

export type RelationshipType = DirectRelationship | IndirectRelationship | InLawRelationship | SpiritualRelationship;

// Specific Russian in-law terms (more precise than generic brother-in-law)
export type SpecificRussianInLaw =
  | 'svekr' // свёкор (father of husband)
  | 'svekrov' // свекровь (mother of husband)
  | 'test' // тесть (father of wife)
  | 'teshcha' // тёща (mother of wife)
  | 'dever' // деверь (brother of husband)
  | 'zolovka' // золовка (sister of husband)
  | 'shurin' // шурин (brother of wife)
  | 'svoyachenitsa' // свояченица (sister of wife)
  | 'svoyak' // свояк (husband of wife's sister)
  | 'nevestka' // невестка (wife of brother or wife of son)
  | 'zat' // зять (husband of daughter or husband of sister)
  | 'snokha'; // сноха (wife of son, same as nevestka)

interface RelationshipComputationInput {
  intermediatePersonRelationship: RelationshipType; // e.g., "mother"
  newPersonRelationshipToIntermediate: RelationshipType; // e.g., "sibling"
  gender?: 'male' | 'female'; // Optional gender for more precise relationships
}

/**
 * Relationship computation rules
 * Format: [intermediate, new_to_intermediate] → result
 */
const RELATIONSHIP_RULES: Record<string, RelationshipType> = {
  // Parent's sibling = aunt/uncle
  'parent-sibling': 'aunt', // Will use gender to choose aunt/uncle
  'mother-sibling': 'aunt',
  'father-sibling': 'uncle',
  
  // Parent's parent = grandparent
  'parent-parent': 'grandparent',
  'mother-parent': 'grandparent',
  'father-parent': 'grandparent',
  
  // Sibling's child = niece/nephew
  'sibling-child': 'niece', // Will use gender to choose niece/nephew
  
  // Aunt/Uncle's child = cousin
  'aunt-child': 'cousin',
  'uncle-child': 'cousin',
  
  // Grandparent's parent = great-grandparent
  'grandparent-parent': 'great-grandparent',
  
  // Grandchild's child = great-grandchild
  'grandchild-child': 'great-grandchild',
  
  // Child's child = grandchild
  'child-child': 'grandchild',
};

/**
 * Computes the relationship between inviter and new person
 * based on intermediate person's relationship
 */
export function computeRelationship(input: RelationshipComputationInput): RelationshipType {
  const { intermediatePersonRelationship, newPersonRelationshipToIntermediate, gender } = input;
  
  const key = `${intermediatePersonRelationship}-${newPersonRelationshipToIntermediate}`;
  let result = RELATIONSHIP_RULES[key];
  
  // Handle generic 'parent' case
  if (!result && intermediatePersonRelationship === 'parent') {
    const genericKey = `parent-${newPersonRelationshipToIntermediate}`;
    result = RELATIONSHIP_RULES[genericKey];
  }
  
  // Apply gender-specific rules
  if (result === 'aunt' && newPersonRelationshipToIntermediate === 'sibling') {
    if (gender === 'male') result = 'uncle' as RelationshipType;
    if (gender === 'female') result = 'aunt';
  }
  
  if (result === 'niece' && newPersonRelationshipToIntermediate === 'child') {
    if (gender === 'male') result = 'nephew' as RelationshipType;
    if (gender === 'female') result = 'niece';
  }
  
  // Fallback: if no rule found, return the direct relationship to intermediate
  return result || newPersonRelationshipToIntermediate;
}

/**
 * Get human-readable relationship label
 */
export function getRelationshipLabel(
  relationship: RelationshipType,
  locale: 'en' | 'ru' = 'en'
): string {
  const labels: Record<RelationshipType, { en: string; ru: string }> = {
    // Direct relationships
    parent: { en: 'Parent', ru: 'Родитель' },
    child: { en: 'Child', ru: 'Ребёнок' },
    sibling: { en: 'Sibling', ru: 'Брат/Сестра' },
    spouse: { en: 'Spouse', ru: 'Супруг(а)' },
    grandparent: { en: 'Grandparent', ru: 'Бабушка/Дедушка' },
    grandchild: { en: 'Grandchild', ru: 'Внук/Внучка' },
    
    // Indirect relationships
    aunt: { en: 'Aunt', ru: 'Тётя' },
    uncle: { en: 'Uncle', ru: 'Дядя' },
    niece: { en: 'Niece', ru: 'Племянница' },
    nephew: { en: 'Nephew', ru: 'Племянник' },
    cousin: { en: 'Cousin', ru: 'Двоюродный брат/сестра' },
    'great-grandparent': { en: 'Great-Grandparent', ru: 'Прабабушка/Прадедушка' },
    'great-grandchild': { en: 'Great-Grandchild', ru: 'Правнук/Правнучка' },
    
    // In-laws
    'mother-in-law': { en: 'Mother-in-law', ru: 'Тёща/Свекровь' },
    'father-in-law': { en: 'Father-in-law', ru: 'Тесть/Свёкор' },
    'son-in-law': { en: 'Son-in-law', ru: 'Зять' },
    'daughter-in-law': { en: 'Daughter-in-law', ru: 'Невестка/Сноха' },
    'brother-in-law': { en: 'Brother-in-law', ru: 'Деверь/Шурин/Зять' },
    'sister-in-law': { en: 'Sister-in-law', ru: 'Золовка/Свояченица' },
    'co-brother-in-law': { en: 'Co-brother-in-law', ru: 'Свояк' },
    'co-sister-in-law': { en: 'Co-sister-in-law', ru: 'Свояченица' },
    'stepfather': { en: 'Stepfather', ru: 'Отчим' },
    'stepmother': { en: 'Stepmother', ru: 'Мачеха' },
    'stepson': { en: 'Stepson', ru: 'Пасынок' },
    'stepdaughter': { en: 'Stepdaughter', ru: 'Падчерица' },
    'co-parent-in-law': { en: 'Co-parent-in-law', ru: 'Сват/Сватья' },
    
    // Spiritual relationships
    'godfather': { en: 'Godfather', ru: 'Крёстный отец' },
    'godmother': { en: 'Godmother', ru: 'Крёстная мать' },
    'godson': { en: 'Godson', ru: 'Крестник' },
    'goddaughter': { en: 'Goddaughter', ru: 'Крестница' },
    'co-godparent': { en: 'Co-godparent', ru: 'Кум/Кума' },
  };
  
  return labels[relationship]?.[locale] || relationship;
}

/**
 * Get list of direct relationship options for UI
 */
export function getDirectRelationshipOptions(locale: 'en' | 'ru' = 'en') {
  const options: DirectRelationship[] = ['parent', 'child', 'sibling', 'spouse', 'grandparent', 'grandchild'];
  return options.map(rel => ({
    value: rel,
    label: getRelationshipLabel(rel, locale),
  }));
}

/**
 * Get more specific relationship options (for direct relatives)
 */
export function getSpecificRelationshipOptions(locale: 'en' | 'ru' = 'en') {
  const specific = [
    // Blood relatives
    { value: 'mother', label: { en: 'Mother', ru: 'Мама' }, category: 'blood' },
    { value: 'father', label: { en: 'Father', ru: 'Папа' }, category: 'blood' },
    { value: 'son', label: { en: 'Son', ru: 'Сын' }, category: 'blood' },
    { value: 'daughter', label: { en: 'Daughter', ru: 'Дочь' }, category: 'blood' },
    { value: 'brother', label: { en: 'Brother', ru: 'Брат' }, category: 'blood' },
    { value: 'sister', label: { en: 'Sister', ru: 'Сестра' }, category: 'blood' },
    { value: 'grandmother', label: { en: 'Grandmother', ru: 'Бабушка' }, category: 'blood' },
    { value: 'grandfather', label: { en: 'Grandfather', ru: 'Дедушка' }, category: 'blood' },
    { value: 'grandson', label: { en: 'Grandson', ru: 'Внук' }, category: 'blood' },
    { value: 'granddaughter', label: { en: 'Granddaughter', ru: 'Внучка' }, category: 'blood' },
    
    // Spouses
    { value: 'husband', label: { en: 'Husband', ru: 'Муж' }, category: 'spouse' },
    { value: 'wife', label: { en: 'Wife', ru: 'Жена' }, category: 'spouse' },
    
    // In-laws (spouse's parents)
    { value: 'svekr', label: { en: "Husband's father", ru: 'Свёкор' }, category: 'in-law' },
    { value: 'svekrov', label: { en: "Husband's mother", ru: 'Свекровь' }, category: 'in-law' },
    { value: 'test', label: { en: "Wife's father", ru: 'Тесть' }, category: 'in-law' },
    { value: 'teshcha', label: { en: "Wife's mother", ru: 'Тёща' }, category: 'in-law' },
    
    // In-laws (spouse's siblings)
    { value: 'dever', label: { en: "Husband's brother", ru: 'Деверь' }, category: 'in-law' },
    { value: 'zolovka', label: { en: "Husband's sister", ru: 'Золовка' }, category: 'in-law' },
    { value: 'shurin', label: { en: "Wife's brother", ru: 'Шурин' }, category: 'in-law' },
    { value: 'svoyachenitsa', label: { en: "Wife's sister", ru: 'Свояченица' }, category: 'in-law' },
    
    // In-laws (children's spouses)
    { value: 'zat', label: { en: 'Son-in-law', ru: 'Зять' }, category: 'in-law' },
    { value: 'nevestka', label: { en: 'Daughter-in-law', ru: 'Невестка' }, category: 'in-law' },
    { value: 'snokha', label: { en: "Son's wife", ru: 'Сноха' }, category: 'in-law' },
    
    // In-laws (sibling's spouses)
    { value: 'svoyak', label: { en: "Wife's sister's husband", ru: 'Свояк' }, category: 'in-law' },
    
    // Step-relatives
    { value: 'stepfather', label: { en: 'Stepfather', ru: 'Отчим' }, category: 'step' },
    { value: 'stepmother', label: { en: 'Stepmother', ru: 'Мачеха' }, category: 'step' },
    { value: 'stepson', label: { en: 'Stepson', ru: 'Пасынок' }, category: 'step' },
    { value: 'stepdaughter', label: { en: 'Stepdaughter', ru: 'Падчерица' }, category: 'step' },
    
    // Godparents
    { value: 'godfather', label: { en: 'Godfather', ru: 'Крёстный отец' }, category: 'spiritual' },
    { value: 'godmother', label: { en: 'Godmother', ru: 'Крёстная мать' }, category: 'spiritual' },
    { value: 'godson', label: { en: 'Godson', ru: 'Крестник' }, category: 'spiritual' },
    { value: 'goddaughter', label: { en: 'Goddaughter', ru: 'Крестница' }, category: 'spiritual' },
  ];
  
  return specific.map(opt => ({
    value: opt.value,
    label: opt.label[locale],
    category: opt.category,
  }));
}
