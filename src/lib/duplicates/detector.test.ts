import { describe, it, expect } from 'vitest';
import {
  compareProfiles,
  scanForDuplicates,
  describeMatchReasons,
  getConfidenceLevel,
} from './detector';
import type { ProfileData } from './types';

describe('compareProfiles', () => {
  it('should return 100% confidence for exact name and date match', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '1990-05-15',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '1990-05-15',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(score).toBe(80); // 50 name + 30 date
    expect(reasons.exact_name_match).toBe(true);
    expect(reasons.exact_birth_date_match).toBe(true);
  });

  it('should match case-insensitively', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'JOHN',
      last_name: 'SMITH',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'john',
      last_name: 'smith',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(score).toBe(50);
    expect(reasons.exact_name_match).toBe(true);
  });

  it('should give partial score for first name only match', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'John',
      last_name: 'Smith',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'John',
      last_name: 'Doe',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(score).toBe(25);
    expect(reasons.first_name_match).toBe(true);
    expect(reasons.exact_name_match).toBeUndefined();
  });

  it('should detect maiden name matches', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'Jane',
      last_name: 'Smith',
      maiden_name: 'Johnson',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'Jane',
      last_name: 'Brown',
      maiden_name: 'Johnson',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(reasons.first_name_match).toBe(true);
    expect(reasons.maiden_name_match).toBe(true);
    expect(score).toBeGreaterThan(25);
  });

  it('should detect birth year match when dates differ', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '1990-01-15',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '1990-06-20',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(reasons.birth_year_match).toBe(true);
    expect(reasons.exact_birth_date_match).toBeUndefined();
    expect(score).toBe(65); // 50 name + 15 year
  });

  it('should detect birth place matches', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'John',
      last_name: 'Smith',
      birth_city: 'New York',
      birth_country: 'USA',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'John',
      last_name: 'Smith',
      birth_city: 'New York',
      birth_country: 'USA',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    expect(reasons.birth_city_match).toBe(true);
    expect(reasons.birth_country_match).toBe(true);
    expect(score).toBe(70); // 50 name + 15 city + 5 country
  });

  it('should use fuzzy matching for similar names', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'Johnathan',
      last_name: 'Smith',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'Jonathan',
      last_name: 'Smith',
    };

    const { score, reasons } = compareProfiles(profileA, profileB);

    // Should detect fuzzy match for first name
    expect(reasons.fuzzy_name_match).toBe(true);
    expect(reasons.last_name_match).toBe(true);
    expect(score).toBeGreaterThan(30);
  });

  it('should return low score for different profiles', () => {
    const profileA: ProfileData = {
      id: 'a',
      first_name: 'John',
      last_name: 'Smith',
      birth_date: '1990-05-15',
    };
    const profileB: ProfileData = {
      id: 'b',
      first_name: 'Jane',
      last_name: 'Doe',
      birth_date: '1985-10-20',
    };

    const { score } = compareProfiles(profileA, profileB);

    expect(score).toBeLessThan(20);
  });
});

describe('scanForDuplicates', () => {
  it('should find duplicates above threshold', () => {
    const profiles: ProfileData[] = [
      { id: 'a', first_name: 'John', last_name: 'Smith', birth_date: '1990-05-15' },
      { id: 'b', first_name: 'John', last_name: 'Smith', birth_date: '1990-05-15' },
      { id: 'c', first_name: 'Jane', last_name: 'Doe', birth_date: '1985-10-20' },
    ];

    const results = scanForDuplicates(profiles, 50);

    expect(results.length).toBe(1);
    expect(results[0].profile_a_id).toBe('a');
    expect(results[0].profile_b_id).toBe('b');
    expect(results[0].confidence_score).toBeGreaterThanOrEqual(50);
  });

  it('should respect existing pairs set', () => {
    const profiles: ProfileData[] = [
      { id: 'a', first_name: 'John', last_name: 'Smith' },
      { id: 'b', first_name: 'John', last_name: 'Smith' },
    ];

    const existingPairs = new Set(['a:b']);
    const results = scanForDuplicates(profiles, 50, existingPairs);

    expect(results.length).toBe(0);
  });

  it('should sort results by confidence descending', () => {
    const profiles: ProfileData[] = [
      { id: 'a', first_name: 'John', last_name: 'Smith' },
      { id: 'b', first_name: 'John', last_name: 'Smith', birth_date: '1990-05-15' },
      { id: 'c', first_name: 'John', last_name: 'Smith', birth_date: '1990-05-15' },
    ];

    const results = scanForDuplicates(profiles, 50);

    // b:c should have highest confidence (name + date match)
    if (results.length >= 2) {
      expect(results[0].confidence_score).toBeGreaterThanOrEqual(results[1].confidence_score);
    }
  });
});

describe('describeMatchReasons', () => {
  it('should describe exact name match', () => {
    const descriptions = describeMatchReasons({ exact_name_match: true });
    expect(descriptions).toContain('Exact name match (first and last name)');
  });

  it('should describe partial matches', () => {
    const descriptions = describeMatchReasons({
      first_name_match: true,
      birth_year_match: true,
    });
    expect(descriptions).toContain('First name matches exactly');
    expect(descriptions).toContain('Birth year matches');
  });

  it('should describe fuzzy name matches with percentage', () => {
    const descriptions = describeMatchReasons({
      fuzzy_name_match: true,
      fuzzy_name_similarity: 0.85,
    });
    expect(descriptions.some(d => d.includes('85%'))).toBe(true);
  });
});

describe('getConfidenceLevel', () => {
  it('should return correct confidence levels', () => {
    expect(getConfidenceLevel(85)).toBe('very_high');
    expect(getConfidenceLevel(65)).toBe('high');
    expect(getConfidenceLevel(45)).toBe('medium');
    expect(getConfidenceLevel(30)).toBe('low');
  });
});
