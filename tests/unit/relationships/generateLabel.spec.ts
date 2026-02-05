import { describe, it, expect } from 'vitest';
import {
  generateKinshipLabel,
  getBloodRelationshipOptions,
  getGenderSpecificOptions,
  type Gender,
  type Halfness,
  type Lineage
} from '@/lib/relationships/generateLabel';

describe('generateKinshipLabel', () => {
  describe('direct relationships - Russian', () => {
    it('should label parent correctly', () => {
      expect(generateKinshipLabel({ code: 'parent', gender: 'male' }, 'ru')).toBe('отец');
      expect(generateKinshipLabel({ code: 'parent', gender: 'female' }, 'ru')).toBe('мать');
      expect(generateKinshipLabel({ code: 'parent', gender: 'unknown' }, 'ru')).toBe('родитель');
    });

    it('should label child correctly', () => {
      expect(generateKinshipLabel({ code: 'child', gender: 'male' }, 'ru')).toBe('сын');
      expect(generateKinshipLabel({ code: 'child', gender: 'female' }, 'ru')).toBe('дочь');
      expect(generateKinshipLabel({ code: 'child', gender: 'unknown' }, 'ru')).toBe('ребёнок');
    });

    it('should label grandparent correctly', () => {
      expect(generateKinshipLabel({ code: 'grandparent', gender: 'male' }, 'ru')).toBe('дед');
      expect(generateKinshipLabel({ code: 'grandparent', gender: 'female' }, 'ru')).toBe('бабушка');
    });

    it('should label grandchild correctly', () => {
      expect(generateKinshipLabel({ code: 'grandchild', gender: 'male' }, 'ru')).toBe('внук');
      expect(generateKinshipLabel({ code: 'grandchild', gender: 'female' }, 'ru')).toBe('внучка');
    });
  });

  describe('direct relationships - English', () => {
    it('should label parent correctly', () => {
      expect(generateKinshipLabel({ code: 'parent', gender: 'male' }, 'en')).toBe('father');
      expect(generateKinshipLabel({ code: 'parent', gender: 'female' }, 'en')).toBe('mother');
    });

    it('should label child correctly', () => {
      expect(generateKinshipLabel({ code: 'child', gender: 'male' }, 'en')).toBe('son');
      expect(generateKinshipLabel({ code: 'child', gender: 'female' }, 'en')).toBe('daughter');
    });

    it('should label grandparent correctly', () => {
      expect(generateKinshipLabel({ code: 'grandparent', gender: 'male' }, 'en')).toBe('grandfather');
      expect(generateKinshipLabel({ code: 'grandparent', gender: 'female' }, 'en')).toBe('grandmother');
    });

    it('should label grandchild correctly', () => {
      expect(generateKinshipLabel({ code: 'grandchild', gender: 'male' }, 'en')).toBe('grandson');
      expect(generateKinshipLabel({ code: 'grandchild', gender: 'female' }, 'en')).toBe('granddaughter');
    });
  });

  describe('sibling relationships - Russian', () => {
    it('should label full siblings correctly', () => {
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male',
        qualifiers: { halfness: 'full' }
      }, 'ru')).toBe('брат');

      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'female',
        qualifiers: { halfness: 'full' }
      }, 'ru')).toBe('сестра');
    });

    it('should label half-siblings (paternal) correctly', () => {
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male',
        qualifiers: { halfness: 'half', lineage: 'paternal' }
      }, 'ru')).toBe('единокровный брат');

      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'female',
        qualifiers: { halfness: 'half', lineage: 'paternal' }
      }, 'ru')).toBe('единокровная сестра');
    });

    it('should label half-siblings (maternal) correctly', () => {
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male',
        qualifiers: { halfness: 'half', lineage: 'maternal' }
      }, 'ru')).toBe('единоутробный брат');

      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'female',
        qualifiers: { halfness: 'half', lineage: 'maternal' }
      }, 'ru')).toBe('единоутробная сестра');
    });

    it('should label adoptive siblings correctly', () => {
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male',
        qualifiers: { halfness: 'adoptive' }
      }, 'ru')).toBe('приёмный брат');
    });

    it('should label foster siblings correctly', () => {
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male',
        qualifiers: { halfness: 'foster' }
      }, 'ru')).toBe('сводный брат');
    });
  });

  describe('aunt/uncle relationships - Russian', () => {
    it('should label direct uncle/aunt correctly', () => {
      expect(generateKinshipLabel({
        code: 'aunt_uncle',
        gender: 'male',
        qualifiers: { level: 0 }
      }, 'ru')).toBe('дядя');

      expect(generateKinshipLabel({
        code: 'aunt_uncle',
        gender: 'female',
        qualifiers: { level: 0 }
      }, 'ru')).toBe('тётя');
    });

    it('should label second-degree uncle/aunt correctly', () => {
      expect(generateKinshipLabel({
        code: 'aunt_uncle',
        gender: 'male',
        qualifiers: { level: 1 }
      }, 'ru')).toBe('двоюродный дядя');

      expect(generateKinshipLabel({
        code: 'aunt_uncle',
        gender: 'female',
        qualifiers: { level: 1 }
      }, 'ru')).toBe('двоюродная тётя');
    });
  });

  describe('nephew/niece relationships - Russian', () => {
    it('should label direct nephew/niece correctly', () => {
      expect(generateKinshipLabel({
        code: 'niece_nephew',
        gender: 'male',
        qualifiers: { level: 0 }
      }, 'ru')).toBe('племянник');

      expect(generateKinshipLabel({
        code: 'niece_nephew',
        gender: 'female',
        qualifiers: { level: 0 }
      }, 'ru')).toBe('племянница');
    });

    it('should label second-degree nephew/niece correctly', () => {
      expect(generateKinshipLabel({
        code: 'niece_nephew',
        gender: 'male',
        qualifiers: { level: 1 }
      }, 'ru')).toBe('двоюродный племянник');
    });
  });

  describe('cousin relationships - Russian', () => {
    it('should label first cousins correctly', () => {
      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'male',
        qualifiers: { cousin_degree: 1, cousin_removed: 0 }
      }, 'ru')).toBe('двоюродный брат');

      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'female',
        qualifiers: { cousin_degree: 1, cousin_removed: 0 }
      }, 'ru')).toBe('двоюродная сестра');
    });

    it('should label second cousins correctly', () => {
      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'male',
        qualifiers: { cousin_degree: 2, cousin_removed: 0 }
      }, 'ru')).toBe('троюродный брат');

      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'female',
        qualifiers: { cousin_degree: 2, cousin_removed: 0 }
      }, 'ru')).toBe('троюродная сестра');
    });

    it('should label third cousins correctly', () => {
      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'male',
        qualifiers: { cousin_degree: 3, cousin_removed: 0 }
      }, 'ru')).toBe('четвероюродный брат');
    });

    it('should label cousins once removed correctly', () => {
      expect(generateKinshipLabel({
        code: 'cousin',
        gender: 'male',
        qualifiers: { cousin_degree: 1, cousin_removed: 1 }
      }, 'ru')).toBe('двоюродный брат (один раз в стороне)');
    });
  });

  describe('default behavior', () => {
    it('should return code for unknown relationship types', () => {
      expect(generateKinshipLabel({
        code: 'unknown_relationship',
        gender: 'male'
      }, 'ru')).toBe('unknown_relationship');
    });

    it('should default to Russian locale', () => {
      expect(generateKinshipLabel({ code: 'parent', gender: 'male' })).toBe('отец');
    });

    it('should handle missing qualifiers gracefully', () => {
      // Sibling without halfness should default to full
      expect(generateKinshipLabel({
        code: 'sibling',
        gender: 'male'
      }, 'ru')).toBe('брат');
    });
  });
});

describe('getBloodRelationshipOptions', () => {
  it('should return all relationship types in Russian', () => {
    const options = getBloodRelationshipOptions('ru');

    expect(options).toHaveLength(9);
    expect(options.find(o => o.code === 'parent')?.label).toBe('Родитель');
    expect(options.find(o => o.code === 'child')?.label).toBe('Ребёнок');
    expect(options.find(o => o.code === 'spouse')?.label).toBe('Супруг(а)');
    expect(options.find(o => o.code === 'sibling')?.label).toBe('Брат/Сестра');
    expect(options.find(o => o.code === 'grandparent')?.label).toBe('Дед/Бабушка');
    expect(options.find(o => o.code === 'grandchild')?.label).toBe('Внук/Внучка');
    expect(options.find(o => o.code === 'aunt_uncle')?.label).toBe('Дядя/Тётя');
    expect(options.find(o => o.code === 'niece_nephew')?.label).toBe('Племянник/Племянница');
    expect(options.find(o => o.code === 'cousin')?.label).toBe('Двоюродный(ая)');
  });

  it('should return all relationship types in English', () => {
    const options = getBloodRelationshipOptions('en');

    expect(options).toHaveLength(9);
    expect(options.find(o => o.code === 'parent')?.label).toBe('Parent');
    expect(options.find(o => o.code === 'child')?.label).toBe('Child');
    expect(options.find(o => o.code === 'spouse')?.label).toBe('Spouse');
    expect(options.find(o => o.code === 'sibling')?.label).toBe('Sibling');
    expect(options.find(o => o.code === 'grandparent')?.label).toBe('Grandparent');
    expect(options.find(o => o.code === 'grandchild')?.label).toBe('Grandchild');
    expect(options.find(o => o.code === 'aunt_uncle')?.label).toBe('Aunt/Uncle');
    expect(options.find(o => o.code === 'niece_nephew')?.label).toBe('Nephew/Niece');
    expect(options.find(o => o.code === 'cousin')?.label).toBe('Cousin');
  });

  it('should categorize relationships correctly', () => {
    const options = getBloodRelationshipOptions('en');

    const directRelations = options.filter(o => o.category === 'direct');
    const extendedRelations = options.filter(o => o.category === 'extended');

    expect(directRelations).toHaveLength(6);
    expect(extendedRelations).toHaveLength(3);
  });
});

describe('getGenderSpecificOptions', () => {
  describe('parent options', () => {
    it('should return mother and father in Russian', () => {
      const options = getGenderSpecificOptions('parent', 'ru');

      expect(options).toHaveLength(2);
      expect(options.find(o => o.value === 'mother')?.label).toBe('Мама');
      expect(options.find(o => o.value === 'father')?.label).toBe('Папа');
    });

    it('should return mother and father in English', () => {
      const options = getGenderSpecificOptions('parent', 'en');

      expect(options).toHaveLength(2);
      expect(options.find(o => o.value === 'mother')?.label).toBe('Mother');
      expect(options.find(o => o.value === 'father')?.label).toBe('Father');
    });

    it('should have correct gender values', () => {
      const options = getGenderSpecificOptions('parent', 'en');

      expect(options.find(o => o.value === 'mother')?.gender).toBe('female');
      expect(options.find(o => o.value === 'father')?.gender).toBe('male');
    });
  });

  describe('child options', () => {
    it('should return son and daughter', () => {
      const options = getGenderSpecificOptions('child', 'ru');

      expect(options).toHaveLength(2);
      expect(options.find(o => o.value === 'son')?.label).toBe('Сын');
      expect(options.find(o => o.value === 'daughter')?.label).toBe('Дочь');
    });
  });

  describe('spouse options', () => {
    it('should include gender-neutral partner option', () => {
      const options = getGenderSpecificOptions('spouse', 'ru');

      expect(options).toHaveLength(3);
      expect(options.find(o => o.value === 'husband')?.label).toBe('Муж');
      expect(options.find(o => o.value === 'wife')?.label).toBe('Жена');
      expect(options.find(o => o.value === 'partner')?.label).toBe('Партнёр');
      expect(options.find(o => o.value === 'partner')?.gender).toBe('unknown');
    });
  });

  describe('sibling options', () => {
    it('should include all sibling variants', () => {
      const options = getGenderSpecificOptions('sibling', 'ru');

      expect(options).toHaveLength(6);

      // Full siblings
      expect(options.find(o => o.value === 'brother')?.label).toBe('Брат (родной)');
      expect(options.find(o => o.value === 'sister')?.label).toBe('Сестра (родная)');

      // Paternal half-siblings
      expect(options.find(o => o.value === 'half_brother_p')?.label).toBe('Единокровный брат');
      expect(options.find(o => o.value === 'half_sister_p')?.label).toBe('Единокровная сестра');

      // Maternal half-siblings
      expect(options.find(o => o.value === 'half_brother_m')?.label).toBe('Единоутробный брат');
      expect(options.find(o => o.value === 'half_sister_m')?.label).toBe('Единоутробная сестра');
    });

    it('should have correct qualifiers for half-siblings', () => {
      const options = getGenderSpecificOptions('sibling', 'en');

      const halfBrotherP = options.find(o => o.value === 'half_brother_p');
      expect((halfBrotherP?.qualifiers as { halfness?: string })?.halfness).toBe('half');
      expect((halfBrotherP?.qualifiers as { lineage?: string })?.lineage).toBe('paternal');

      const halfSisterM = options.find(o => o.value === 'half_sister_m');
      expect((halfSisterM?.qualifiers as { halfness?: string })?.halfness).toBe('half');
      expect((halfSisterM?.qualifiers as { lineage?: string })?.lineage).toBe('maternal');
    });
  });

  describe('grandparent options', () => {
    it('should return grandfather and grandmother', () => {
      const options = getGenderSpecificOptions('grandparent', 'ru');

      expect(options).toHaveLength(2);
      expect(options.find(o => o.value === 'grandfather')?.label).toBe('Дедушка');
      expect(options.find(o => o.value === 'grandmother')?.label).toBe('Бабушка');
    });
  });

  describe('grandchild options', () => {
    it('should return grandson and granddaughter', () => {
      const options = getGenderSpecificOptions('grandchild', 'ru');

      expect(options).toHaveLength(2);
      expect(options.find(o => o.value === 'grandson')?.label).toBe('Внук');
      expect(options.find(o => o.value === 'granddaughter')?.label).toBe('Внучка');
    });
  });

  describe('aunt/uncle options', () => {
    it('should include direct and second-degree options', () => {
      const options = getGenderSpecificOptions('aunt_uncle', 'ru');

      expect(options).toHaveLength(4);
      expect(options.find(o => o.value === 'uncle')?.label).toBe('Дядя');
      expect(options.find(o => o.value === 'aunt')?.label).toBe('Тётя');
      expect(options.find(o => o.value === 'uncle_2nd')?.label).toBe('Двоюродный дядя');
      expect(options.find(o => o.value === 'aunt_2nd')?.label).toBe('Двоюродная тётя');
    });

    it('should have correct level qualifiers', () => {
      const options = getGenderSpecificOptions('aunt_uncle', 'en');

      expect((options.find(o => o.value === 'uncle')?.qualifiers as { level?: number })?.level).toBe(0);
      expect((options.find(o => o.value === 'uncle_2nd')?.qualifiers as { level?: number })?.level).toBe(1);
    });
  });

  describe('nephew/niece options', () => {
    it('should include direct and second-degree options', () => {
      const options = getGenderSpecificOptions('niece_nephew', 'ru');

      expect(options).toHaveLength(4);
      expect(options.find(o => o.value === 'nephew')?.label).toBe('Племянник');
      expect(options.find(o => o.value === 'niece')?.label).toBe('Племянница');
      expect(options.find(o => o.value === 'nephew_2nd')?.label).toBe('Двоюродный племянник');
      expect(options.find(o => o.value === 'niece_2nd')?.label).toBe('Двоюродная племянница');
    });
  });

  describe('cousin options', () => {
    it('should include first and second cousins', () => {
      const options = getGenderSpecificOptions('cousin', 'ru');

      expect(options).toHaveLength(4);
      expect(options.find(o => o.value === 'cousin_m_1st')?.label).toBe('Двоюродный брат');
      expect(options.find(o => o.value === 'cousin_f_1st')?.label).toBe('Двоюродная сестра');
      expect(options.find(o => o.value === 'cousin_m_2nd')?.label).toBe('Троюродный брат');
      expect(options.find(o => o.value === 'cousin_f_2nd')?.label).toBe('Троюродная сестра');
    });

    it('should have correct cousin_degree qualifiers', () => {
      const options = getGenderSpecificOptions('cousin', 'en');

      expect((options.find(o => o.value === 'cousin_m_1st')?.qualifiers as { cousin_degree?: number })?.cousin_degree).toBe(1);
      expect((options.find(o => o.value === 'cousin_m_2nd')?.qualifiers as { cousin_degree?: number })?.cousin_degree).toBe(2);
    });
  });

  describe('unknown code', () => {
    it('should return empty array for unknown relationship codes', () => {
      const options = getGenderSpecificOptions('unknown_code', 'en');
      expect(options).toEqual([]);
    });
  });
});
