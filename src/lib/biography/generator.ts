/**
 * Biography Generator
 *
 * Generates Wikipedia-style life narratives from profile data.
 * Uses template-based generation with conditional sections.
 */

import {
  BiographySection,
  BiographySectionId,
  EnrichedProfileData,
  GeneratedBiography,
  Locale,
  MissingField,
} from './types';
import {
  sectionTitles,
  missingFieldLabels,
  getSectionTemplates,
  genderWords,
  getArticle,
  pluralize,
} from './templates';

/**
 * Format a date for display
 */
function formatDate(dateStr: string | null, locale: Locale): string | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format year only
 */
function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return date.getFullYear().toString();
  } catch {
    return dateStr;
  }
}

/**
 * Calculate age from birth and optional death date
 */
function calculateAge(birthDate: string | null, deathDate?: string | null): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Build the life span description
 */
function buildLifeSpan(
  birthDate: string | null,
  deathDate: string | null,
  isLiving: boolean | null,
  locale: Locale
): string {
  const birthYear = formatYear(birthDate);
  const deathYear = formatYear(deathDate);

  if (birthYear && deathYear) {
    return `(${birthYear} - ${deathYear})`;
  } else if (birthYear && !isLiving && deathDate) {
    return `(${birthYear} - ${formatYear(deathDate)})`;
  } else if (birthYear) {
    const prefix = locale === 'ru' ? 'род.' : 'born';
    return `(${prefix} ${birthYear})`;
  }

  return '';
}

/**
 * Get gender-specific pronouns
 */
function getGenderPronouns(
  gender: string | null,
  locale: Locale
): Record<string, string> {
  const genderKey = gender === 'male' || gender === 'female' ? gender : 'other';
  return genderWords[locale][genderKey] || genderWords[locale]['other'];
}

/**
 * Process template string with variables
 */
function processTemplate(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  let result = template;

  // Process conditional blocks: {{?var}}content{{/var}}
  const conditionalRegex = /\{\{\?(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(conditionalRegex, (_, varName, content) => {
    const value = variables[varName];
    if (value && value.trim()) {
      return processTemplate(content, variables);
    }
    return '';
  });

  // Process negated conditional blocks: {{^var}}content{{/var}}
  const negatedRegex = /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(negatedRegex, (_, varName, content) => {
    const value = variables[varName];
    if (!value || !value.trim()) {
      return processTemplate(content, variables);
    }
    return '';
  });

  // Process simple variables: {{var}}
  const variableRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(variableRegex, (_, varName) => {
    return variables[varName] ?? '';
  });

  return result.trim();
}

/**
 * Generate the introduction section
 */
function generateIntroduction(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const variables: Record<string, string | null | undefined> = {
    fullName,
    nickname: profile.nickname,
    lifeSpan: buildLifeSpan(
      profile.birth_date,
      profile.death_date,
      profile.is_living,
      locale
    ),
    occupation: profile.occupation,
    bio: profile.bio,
    aAn: profile.occupation ? getArticle(profile.occupation) : 'a',
    genderPronounSubject: pronouns.subject,
    genderPronounObject: pronouns.object,
    genderPronounPossessive: pronouns.possessive,
    occupationVerb: locale === 'ru' ? (profile.gender === 'female' ? 'была' : 'был') : 'was',
  };

  const templates = getSectionTemplates('introduction', locale);
  const content = templates
    .map((t) => processTemplate(t, variables))
    .filter(Boolean)
    .join(' ');

  return {
    id: 'introduction',
    title: sectionTitles.introduction[locale],
    content,
    isEmpty: !content.trim(),
  };
}

/**
 * Generate the early life section
 */
function generateEarlyLife(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const birthPlace = profile.birth_place || profile.birth_city;

  const variables: Record<string, string | null | undefined> = {
    fullName,
    birth_date: formatDate(profile.birth_date, locale),
    birth_place: birthPlace,
    maiden_name: profile.maiden_name,
    genderPronounSubject: pronouns.subject,
    genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
  };

  const templates = getSectionTemplates('early_life', locale);
  const content = templates
    .map((t) => processTemplate(t, variables))
    .filter(Boolean)
    .join(' ');

  return {
    id: 'early_life',
    title: sectionTitles.early_life[locale],
    content,
    isEmpty: !content.trim(),
  };
}

/**
 * Generate the education section
 */
function generateEducation(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile, education } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  if (education.length === 0) {
    return {
      id: 'education',
      title: sectionTitles.education[locale],
      content: '',
      isEmpty: true,
    };
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const educationParts: string[] = [];

  for (const edu of education) {
    const variables: Record<string, string | null | undefined> = {
      fullName,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      institution_name: edu.institution_name,
      start_year: edu.start_year?.toString(),
      end_year: edu.end_year?.toString(),
      genderPronounSubject: pronouns.subject,
      genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
      aAn: edu.degree ? getArticle(edu.degree) : 'a',
    };

    const templates = getSectionTemplates('education', locale).filter(
      (t) => !t.startsWith('{{#') && !t.startsWith('{{/')
    );
    const part = templates
      .map((t) => processTemplate(t, variables))
      .filter(Boolean)
      .join(' ');

    if (part.trim()) {
      educationParts.push(part);
    }
  }

  return {
    id: 'education',
    title: sectionTitles.education[locale],
    content: educationParts.join(' '),
    isEmpty: educationParts.length === 0,
  };
}

/**
 * Generate the career section
 */
function generateCareer(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile, employment } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const parts: string[] = [];

  // Add general occupation if available
  if (profile.occupation) {
    const occVariable: Record<string, string | null | undefined> = {
      fullName,
      occupation: profile.occupation,
      aAn: getArticle(profile.occupation),
      genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
    };

    const occTemplate =
      locale === 'ru'
        ? '{{fullName}} работал{{genderSuffix}} {{occupation}}.'
        : '{{fullName}} worked as {{aAn}} {{occupation}}.';

    parts.push(processTemplate(occTemplate, occVariable));
  }

  // Add employment history
  for (const emp of employment) {
    const variables: Record<string, string | null | undefined> = {
      fullName,
      position: emp.position,
      company_name: emp.company_name,
      location: emp.location,
      start_date: formatDate(emp.start_date, locale),
      end_date: formatDate(emp.end_date, locale),
      is_current: emp.is_current ? 'true' : '',
      genderPronounSubject: pronouns.subject,
      genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
    };

    const template =
      locale === 'ru'
        ? '{{genderPronounSubject}} работал{{genderSuffix}} {{position}} в {{company_name}}{{?location}} в {{location}}{{/location}}{{?start_date}} с {{start_date}}{{/start_date}}{{?end_date}} по {{end_date}}{{/end_date}}{{?is_current}} и продолжает по сей день{{/is_current}}.'
        : '{{genderPronounSubject}} worked as {{position}} at {{company_name}}{{?location}} in {{location}}{{/location}}{{?start_date}} from {{start_date}}{{/start_date}}{{?end_date}} to {{end_date}}{{/end_date}}{{?is_current}} and continues to this day{{/is_current}}.';

    const part = processTemplate(template, variables);
    if (part.trim()) {
      parts.push(part);
    }
  }

  return {
    id: 'career',
    title: sectionTitles.career[locale],
    content: parts.join(' '),
    isEmpty: parts.length === 0,
  };
}

/**
 * Generate the family section
 */
function generateFamily(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile, relationships, relatedProfiles } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const parts: string[] = [];

  // Categorize relationships
  const spouses: string[] = [];
  const parents: string[] = [];
  const children: string[] = [];
  const siblings: string[] = [];

  for (const rel of relationships) {
    const isUser1 = rel.user1_id === profile.id;
    const otherId = isUser1 ? rel.user2_id : rel.user1_id;
    const otherProfile = relatedProfiles.get(otherId);

    if (!otherProfile) continue;

    const otherName = [otherProfile.first_name, otherProfile.last_name]
      .filter(Boolean)
      .join(' ');

    const relType = rel.relationship_type;

    if (relType === 'spouse' || relType === 'partner') {
      spouses.push(otherName);
    } else if (relType === 'parent' && isUser1) {
      // Profile is the child, other is parent
      parents.push(otherName);
    } else if (relType === 'parent' && !isUser1) {
      // Profile is the parent, other is child
      children.push(otherName);
    } else if (relType === 'child' && isUser1) {
      children.push(otherName);
    } else if (relType === 'child' && !isUser1) {
      parents.push(otherName);
    } else if (relType === 'sibling') {
      siblings.push(otherName);
    }
  }

  // Build spouse sentence
  if (spouses.length > 0) {
    const isDeceased = profile.death_date != null;
    const spouseVerb =
      locale === 'ru'
        ? isDeceased
          ? profile.gender === 'female'
            ? 'была замужем за'
            : 'был женат на'
          : profile.gender === 'female'
            ? 'замужем за'
            : 'женат на'
        : isDeceased
          ? 'was married to'
          : 'is married to';

    const variables: Record<string, string | null | undefined> = {
      fullName,
      spouse: spouses.join(locale === 'ru' ? ' и ' : ' and '),
      spouseVerb,
      spouseVerbRu: spouseVerb,
    };

    const template =
      locale === 'ru'
        ? '{{fullName}} {{spouseVerbRu}} {{spouse}}.'
        : '{{fullName}} {{spouseVerb}} {{spouse}}.';

    parts.push(processTemplate(template, variables));
  }

  // Build children sentence
  if (children.length > 0) {
    const childWord = pluralize(
      children.length,
      locale === 'ru' ? 'ребёнок' : 'child',
      locale === 'ru' ? 'детей' : 'children',
      locale
    );

    const variables: Record<string, string | null | undefined> = {
      genderPronounSubject: pronouns.subject,
      genderPronounGenitive: locale === 'ru' ? (profile.gender === 'female' ? 'неё' : 'него') : '',
      childrenCount: children.length.toString(),
      childrenWord: childWord,
      childrenWordRu: childWord,
      children: children.join(locale === 'ru' ? ', ' : ', '),
      childrenVerb: profile.death_date ? 'had' : 'has',
    };

    const template =
      locale === 'ru'
        ? 'У {{genderPronounGenitive}} {{childrenCount}} {{childrenWordRu}}: {{children}}.'
        : '{{genderPronounSubject}} {{childrenVerb}} {{childrenCount}} {{childrenWord}}: {{children}}.';

    parts.push(processTemplate(template, variables));
  }

  // Build parents sentence
  if (parents.length > 0) {
    const variables: Record<string, string | null | undefined> = {
      genderPronounSubject: pronouns.subject,
      parents: parents.join(locale === 'ru' ? ' и ' : ' and '),
      childOfRu: profile.gender === 'female' ? 'дочь' : 'сын',
    };

    const template =
      locale === 'ru'
        ? '{{genderPronounSubject}} - {{childOfRu}} {{parents}}.'
        : '{{genderPronounSubject}} is the child of {{parents}}.';

    parts.push(processTemplate(template, variables));
  }

  // Build siblings sentence
  if (siblings.length > 0) {
    const siblingWord = pluralize(
      siblings.length,
      locale === 'ru' ? 'брат/сестра' : 'sibling',
      locale === 'ru' ? 'братьев и сестёр' : 'siblings',
      locale
    );

    const variables: Record<string, string | null | undefined> = {
      genderPronounSubject: pronouns.subject,
      genderPronounGenitive: locale === 'ru' ? (profile.gender === 'female' ? 'неё' : 'него') : '',
      siblingsCount: siblings.length.toString(),
      siblingsWord: siblingWord,
      siblingsWordRu: siblingWord,
      siblings: siblings.join(locale === 'ru' ? ', ' : ', '),
    };

    const template =
      locale === 'ru'
        ? 'У {{genderPronounGenitive}} {{siblingsCount}} {{siblingsWordRu}}: {{siblings}}.'
        : '{{genderPronounSubject}} has {{siblingsCount}} {{siblingsWord}}: {{siblings}}.';

    parts.push(processTemplate(template, variables));
  }

  return {
    id: 'family',
    title: sectionTitles.family[locale],
    content: parts.join(' '),
    isEmpty: parts.length === 0,
  };
}

/**
 * Generate the places section
 */
function generatePlaces(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile, residences } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const parts: string[] = [];

  // Current residence
  if (profile.current_city) {
    const variables: Record<string, string | null | undefined> = {
      fullName,
      current_city: profile.current_city,
      current_country: profile.current_country,
    };

    const template =
      locale === 'ru'
        ? 'В настоящее время {{fullName}} проживает в {{current_city}}{{?current_country}}, {{current_country}}{{/current_country}}.'
        : '{{fullName}} currently resides in {{current_city}}{{?current_country}}, {{current_country}}{{/current_country}}.';

    parts.push(processTemplate(template, variables));
  }

  // Historical residences
  for (const res of residences) {
    const variables: Record<string, string | null | undefined> = {
      genderPronounSubject: pronouns.subject,
      city: res.city,
      country: res.country,
      start_date: formatDate(res.start_date, locale),
      end_date: formatDate(res.end_date, locale),
      is_current: res.is_current ? 'true' : '',
      genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
    };

    const template =
      locale === 'ru'
        ? '{{genderPronounSubject}} жил{{genderSuffix}} в {{city}}{{?country}}, {{country}}{{/country}}{{?start_date}} с {{start_date}}{{/start_date}}{{?end_date}} по {{end_date}}{{/end_date}}{{?is_current}} и проживает там по сей день{{/is_current}}.'
        : '{{genderPronounSubject}} lived in {{city}}{{?country}}, {{country}}{{/country}}{{?start_date}} from {{start_date}}{{/start_date}}{{?end_date}} to {{end_date}}{{/end_date}}{{?is_current}} and currently lives there{{/is_current}}.';

    const part = processTemplate(template, variables);
    if (part.trim() && res.city) {
      parts.push(part);
    }
  }

  return {
    id: 'places',
    title: sectionTitles.places[locale],
    content: parts.join(' '),
    isEmpty: parts.length === 0,
  };
}

/**
 * Generate the legacy section (for deceased persons)
 */
function generateLegacy(
  data: EnrichedProfileData,
  locale: Locale
): BiographySection {
  const { profile, voiceStoriesCount, photosCount } = data;
  const pronouns = getGenderPronouns(profile.gender, locale);

  // Only show legacy section for deceased persons
  if (profile.is_living !== false && !profile.death_date) {
    return {
      id: 'legacy',
      title: sectionTitles.legacy[locale],
      content: '',
      isEmpty: true,
    };
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  const parts: string[] = [];

  // Death information
  if (profile.death_date) {
    const age = calculateAge(profile.birth_date, profile.death_date);

    const variables: Record<string, string | null | undefined> = {
      fullName,
      death_date: formatDate(profile.death_date, locale),
      death_place: profile.death_place,
      age: age?.toString(),
      genderSuffix: locale === 'ru' ? (profile.gender === 'female' ? 'а' : '') : '',
    };

    const template =
      locale === 'ru'
        ? '{{fullName}} скончал{{genderSuffix}}ся {{death_date}}{{?death_place}} в {{death_place}}{{/death_place}}{{?age}} в возрасте {{age}} лет{{/age}}.'
        : '{{fullName}} passed away on {{death_date}}{{?death_place}} in {{death_place}}{{/death_place}}{{?age}} at the age of {{age}}{{/age}}.';

    parts.push(processTemplate(template, variables));
  }

  // Voice stories
  if (voiceStoriesCount > 0) {
    const storiesWord = pluralize(
      voiceStoriesCount,
      locale === 'ru' ? 'историю' : 'story',
      locale === 'ru' ? 'историй' : 'stories',
      locale
    );

    const variables: Record<string, string | null | undefined> = {
      genderPronounPossessive: pronouns.possessive,
      voiceStoriesCount: voiceStoriesCount.toString(),
      storiesWord,
      storiesWordRu: locale === 'ru' ? 'ых историй' : '',
      storiesWordRu2: locale === 'ru' ? 'ых' : '',
      genderPronounPrepositional: locale === 'ru' ? (profile.gender === 'female' ? 'ней' : 'нём') : '',
    };

    const template =
      locale === 'ru'
        ? 'Память о {{genderPronounPrepositional}} живёт благодаря {{voiceStoriesCount}} записанн{{storiesWordRu}}, сохранённ{{storiesWordRu2}} семьёй.'
        : '{{genderPronounPossessive}} memory lives on through {{voiceStoriesCount}} recorded {{storiesWord}} preserved by family.';

    parts.push(processTemplate(template, variables));
  }

  // Photos
  if (photosCount > 0) {
    const photosWord = pluralize(
      photosCount,
      locale === 'ru' ? 'фотографию' : 'photo',
      locale === 'ru' ? 'фотографий' : 'photos',
      locale
    );

    const variables: Record<string, string | null | undefined> = {
      genderPronounPossessive: pronouns.possessive,
      photosCount: photosCount.toString(),
      photosWord,
      photosWordRu: photosWord,
    };

    const template =
      locale === 'ru'
        ? 'Семья сохранила {{photosCount}} {{photosWordRu}}, документирующих жизнь.'
        : 'The family has preserved {{photosCount}} {{photosWord}} documenting {{genderPronounPossessive}} life.';

    parts.push(processTemplate(template, variables));
  }

  return {
    id: 'legacy',
    title: sectionTitles.legacy[locale],
    content: parts.join(' '),
    isEmpty: parts.length === 0,
  };
}

/**
 * Identify missing fields for profile improvement prompts
 */
function identifyMissingFields(
  data: EnrichedProfileData,
  locale: Locale
): MissingField[] {
  const { profile, education, employment, residences, relationships, photosCount } = data;
  const missing: MissingField[] = [];
  const labels = missingFieldLabels[locale];

  // High importance fields
  if (!profile.birth_date) {
    missing.push({
      field: 'birth_date',
      ...labels.birth_date,
      importance: 'high',
      editPath: '/family-profile/settings',
    });
  }

  if (!profile.birth_place && !profile.birth_city) {
    missing.push({
      field: 'birth_place',
      ...labels.birth_place,
      importance: 'high',
      editPath: '/family-profile/settings',
    });
  }

  // Medium importance fields
  if (!profile.occupation) {
    missing.push({
      field: 'occupation',
      ...labels.occupation,
      importance: 'medium',
      editPath: '/family-profile/settings',
    });
  }

  if (!profile.bio || profile.bio.length < 50) {
    missing.push({
      field: 'bio',
      ...labels.bio,
      importance: 'medium',
      editPath: '/family-profile/settings',
    });
  }

  if (education.length === 0) {
    missing.push({
      field: 'education',
      ...labels.education,
      importance: 'medium',
      editPath: '/family-profile/settings',
    });
  }

  if (employment.length === 0 && !profile.occupation) {
    missing.push({
      field: 'employment',
      ...labels.employment,
      importance: 'medium',
      editPath: '/family-profile/settings',
    });
  }

  // Low importance fields
  if (residences.length === 0 && !profile.current_city) {
    missing.push({
      field: 'residences',
      ...labels.residences,
      importance: 'low',
      editPath: '/family-profile/settings',
    });
  }

  if (relationships.length === 0) {
    missing.push({
      field: 'relationships',
      ...labels.relationships,
      importance: 'low',
      editPath: '/people',
    });
  }

  if (photosCount === 0) {
    missing.push({
      field: 'photos',
      ...labels.photos,
      importance: 'low',
    });
  }

  return missing;
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(data: EnrichedProfileData): number {
  const { profile, education, employment, residences, relationships, photosCount, voiceStoriesCount } = data;

  let score = 0;
  const weights = {
    name: 10,
    birthDate: 10,
    birthPlace: 8,
    bio: 12,
    occupation: 8,
    education: 10,
    employment: 10,
    residences: 8,
    relationships: 12,
    photos: 6,
    voiceStories: 6,
  };

  // Name (always present)
  if (profile.first_name && profile.last_name) score += weights.name;

  // Birth date
  if (profile.birth_date) score += weights.birthDate;

  // Birth place
  if (profile.birth_place || profile.birth_city) score += weights.birthPlace;

  // Bio
  if (profile.bio && profile.bio.length >= 50) {
    score += weights.bio;
  } else if (profile.bio && profile.bio.length > 0) {
    score += weights.bio * 0.5;
  }

  // Occupation
  if (profile.occupation) score += weights.occupation;

  // Education
  if (education.length > 0) score += weights.education;

  // Employment
  if (employment.length > 0) score += weights.employment;

  // Residences
  if (residences.length > 0 || profile.current_city) score += weights.residences;

  // Relationships
  if (relationships.length > 0) {
    score += Math.min(weights.relationships, relationships.length * 3);
  }

  // Photos
  if (photosCount > 0) {
    score += Math.min(weights.photos, photosCount);
  }

  // Voice stories
  if (voiceStoriesCount > 0) {
    score += Math.min(weights.voiceStories, voiceStoriesCount * 2);
  }

  return Math.min(100, score);
}

/**
 * Main biography generation function
 */
export function generateBiography(
  data: EnrichedProfileData,
  locale: Locale
): GeneratedBiography {
  const { profile } = data;

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ');

  // Generate all sections
  const sections: BiographySection[] = [
    generateIntroduction(data, locale),
    generateEarlyLife(data, locale),
    generateEducation(data, locale),
    generateCareer(data, locale),
    generateFamily(data, locale),
    generatePlaces(data, locale),
    generateLegacy(data, locale),
  ];

  // Identify missing fields
  const missingFields = identifyMissingFields(data, locale);

  // Calculate completeness
  const completenessScore = calculateCompletenessScore(data);

  return {
    profileId: profile.id,
    fullName,
    sections: sections.filter((s) => !s.isEmpty),
    missingFields,
    completenessScore,
    generatedAt: new Date().toISOString(),
    locale,
  };
}

export { calculateAge, formatDate };
