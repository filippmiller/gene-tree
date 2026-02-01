/**
 * Biography Generator Tests
 *
 * Unit tests for the biography generation logic.
 */

import { generateBiography, EnrichedProfileData } from './generator';

describe('generateBiography', () => {
  const mockProfile = {
    id: 'test-id-123',
    first_name: 'John',
    middle_name: 'William',
    last_name: 'Smith',
    maiden_name: null,
    nickname: 'Johnny',
    birth_date: '1950-05-15',
    birth_place: 'Boston',
    birth_city: 'Boston',
    birth_country: 'USA',
    death_date: null,
    death_place: null,
    is_living: true,
    gender: 'male' as const,
    bio: 'A dedicated family man and engineer who loved building things.',
    avatar_url: null,
    current_avatar_id: null,
    occupation: 'Engineer',
    phone: null,
    current_city: 'New York',
    current_country: 'USA',
    current_address: null,
    preferred_locale: 'en',
    privacy_settings: null,
    role: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockEnrichedData: EnrichedProfileData = {
    profile: mockProfile,
    education: [
      {
        id: 'edu-1',
        user_id: 'test-id-123',
        institution_name: 'MIT',
        institution_type: 'university',
        degree: 'Bachelor of Science',
        field_of_study: 'Mechanical Engineering',
        start_year: 1968,
        end_year: 1972,
        is_current: false,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    employment: [
      {
        id: 'emp-1',
        user_id: 'test-id-123',
        company_name: 'Acme Corp',
        position: 'Senior Engineer',
        employment_type: 'full-time',
        location: 'Boston',
        start_date: '1975-01-01',
        end_date: '2010-12-31',
        is_current: false,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    residences: [],
    relationships: [
      {
        id: 'rel-1',
        user1_id: 'test-id-123',
        user2_id: 'spouse-id',
        relationship_type: 'spouse',
        type_id: null,
        cousin_degree: null,
        cousin_removed: 0,
        halfness: null,
        lineage: null,
        in_law: false,
        is_ex: false,
        qualifiers: {},
        source: {},
        marriage_date: '1975-06-20',
        marriage_place: 'Boston',
        divorce_date: null,
        notes: null,
        verification_status: null,
        verified_by: null,
        created_by: null,
        created_from_invitation_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    relatedProfiles: new Map([
      ['spouse-id', { first_name: 'Jane', last_name: 'Smith', gender: 'female' }],
    ]),
    voiceStoriesCount: 2,
    photosCount: 10,
  };

  it('generates a biography with all sections in English', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    expect(result.profileId).toBe('test-id-123');
    expect(result.fullName).toBe('John William Smith');
    expect(result.locale).toBe('en');
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.completenessScore).toBeGreaterThan(0);
  });

  it('generates a biography with all sections in Russian', () => {
    const result = generateBiography(mockEnrichedData, 'ru');

    expect(result.locale).toBe('ru');
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it('includes introduction section with name and occupation', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    const intro = result.sections.find((s) => s.id === 'introduction');
    expect(intro).toBeDefined();
    expect(intro?.content).toContain('John William Smith');
    expect(intro?.content).toContain('Engineer');
  });

  it('includes early life section with birth information', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    const earlyLife = result.sections.find((s) => s.id === 'early_life');
    expect(earlyLife).toBeDefined();
    expect(earlyLife?.content).toContain('Boston');
  });

  it('includes education section', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    const education = result.sections.find((s) => s.id === 'education');
    expect(education).toBeDefined();
    expect(education?.content).toContain('MIT');
    expect(education?.content).toContain('Mechanical Engineering');
  });

  it('includes career section', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    const career = result.sections.find((s) => s.id === 'career');
    expect(career).toBeDefined();
    expect(career?.content).toContain('Acme Corp');
    expect(career?.content).toContain('Senior Engineer');
  });

  it('includes family section with spouse', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    const family = result.sections.find((s) => s.id === 'family');
    expect(family).toBeDefined();
    expect(family?.content).toContain('Jane Smith');
  });

  it('identifies missing fields for incomplete profiles', () => {
    const incompleteData: EnrichedProfileData = {
      ...mockEnrichedData,
      profile: {
        ...mockProfile,
        bio: null,
        occupation: null,
      },
      education: [],
      employment: [],
    };

    const result = generateBiography(incompleteData, 'en');

    expect(result.missingFields.length).toBeGreaterThan(0);
    const fieldNames = result.missingFields.map((f) => f.field);
    expect(fieldNames).toContain('bio');
    expect(fieldNames).toContain('occupation');
  });

  it('calculates completeness score correctly', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    // With name, birth date, birth place, bio, occupation, education, employment, relationships, and photos
    // the score should be high
    expect(result.completenessScore).toBeGreaterThan(50);
  });

  it('excludes empty sections', () => {
    const result = generateBiography(mockEnrichedData, 'en');

    result.sections.forEach((section) => {
      expect(section.isEmpty).toBe(false);
      expect(section.content.trim()).not.toBe('');
    });
  });

  it('generates legacy section for deceased persons', () => {
    const deceasedData: EnrichedProfileData = {
      ...mockEnrichedData,
      profile: {
        ...mockProfile,
        death_date: '2020-03-15',
        death_place: 'New York',
        is_living: false,
      },
    };

    const result = generateBiography(deceasedData, 'en');

    const legacy = result.sections.find((s) => s.id === 'legacy');
    expect(legacy).toBeDefined();
    expect(legacy?.content).toContain('2020');
    expect(legacy?.content).toContain('age of 69');
  });

  it('handles profiles with minimal data', () => {
    const minimalData: EnrichedProfileData = {
      profile: {
        ...mockProfile,
        middle_name: null,
        nickname: null,
        birth_date: null,
        birth_place: null,
        bio: null,
        occupation: null,
        current_city: null,
      },
      education: [],
      employment: [],
      residences: [],
      relationships: [],
      relatedProfiles: new Map(),
      voiceStoriesCount: 0,
      photosCount: 0,
    };

    const result = generateBiography(minimalData, 'en');

    expect(result.profileId).toBe('test-id-123');
    expect(result.fullName).toBe('John Smith');
    expect(result.missingFields.length).toBeGreaterThan(0);
  });
});
