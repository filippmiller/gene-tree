export type MappedKinship = {
  relationshipCode: string; // e.g., 'parent', 'sibling', 'aunt_uncle', etc.
  specificValue: string;    // value from getGenderSpecificOptions
};

function has(str: string, re: RegExp) {
  return re.test(str);
}

/**
 * Map a Russian canonical kinship label (e.g., "тётя", "двоюродный брат")
 * to our UI relationship code and specific value.
 * Best-effort; falls back to null when not recognized.
 */
export function mapRuLabelToRelationship(label: string): MappedKinship | null {
  const l = label.trim().toLowerCase();

  // Direct
  if (has(l, /^(мама|мать)$/)) return { relationshipCode: 'parent', specificValue: 'mother' };
  if (has(l, /^(папа|отец)$/)) return { relationshipCode: 'parent', specificValue: 'father' };
  if (has(l, /^сын( |$)/))       return { relationshipCode: 'child', specificValue: 'son' };
  if (has(l, /^дочь( |$)/))      return { relationshipCode: 'child', specificValue: 'daughter' };

  // Grand*
  if (has(l, /^бабушка/))       return { relationshipCode: 'grandparent', specificValue: 'grandmother' };
  if (has(l, /^(дед|дедушка)/)) return { relationshipCode: 'grandparent', specificValue: 'grandfather' };
  if (has(l, /^внук( |$)/))     return { relationshipCode: 'grandchild', specificValue: 'grandson' };
  if (has(l, /^внучка( |$)/))   return { relationshipCode: 'grandchild', specificValue: 'granddaughter' };

  // Siblings
  if (has(l, /^(брат|родной брат)$/))   return { relationshipCode: 'sibling', specificValue: 'brother' };
  if (has(l, /^(сестра|родная сестра)$/)) return { relationshipCode: 'sibling', specificValue: 'sister' };

  // Aunt/Uncle
  if (has(l, /^тётя|тетка/)) return { relationshipCode: 'aunt_uncle', specificValue: 'aunt' };
  if (has(l, /^дядя/))       return { relationshipCode: 'aunt_uncle', specificValue: 'uncle' };

  // Nephew/Niece
  if (has(l, /^племянник/))     return { relationshipCode: 'niece_nephew', specificValue: 'nephew' };
  if (has(l, /^племянница/))    return { relationshipCode: 'niece_nephew', specificValue: 'niece' };

  // Cousins (degree heuristics)
  if (has(l, /двоюродн.*брат/))   return { relationshipCode: 'cousin', specificValue: 'cousin_m_1st' };
  if (has(l, /двоюродн.*сестр/))  return { relationshipCode: 'cousin', specificValue: 'cousin_f_1st' };
  if (has(l, /троюродн.*брат/))   return { relationshipCode: 'cousin', specificValue: 'cousin_m_2nd' };
  if (has(l, /троюродн.*сестр/))  return { relationshipCode: 'cousin', specificValue: 'cousin_f_2nd' };

  return null;
}
