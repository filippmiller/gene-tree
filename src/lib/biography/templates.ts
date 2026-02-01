/**
 * Biography Templates
 *
 * Template-based narrative generation for bilingual biographies.
 * Uses variable placeholders that get replaced with actual profile data.
 *
 * Template Syntax:
 * - {{variable}} - simple replacement
 * - {{?variable}}...{{/variable}} - conditional block (only shown if variable exists)
 * - {{#list}}...{{/list}} - list iteration
 */

import { Locale } from './types';

/**
 * Section titles by locale
 */
export const sectionTitles: Record<string, Record<Locale, string>> = {
  introduction: {
    en: 'Overview',
    ru: 'Обзор',
  },
  early_life: {
    en: 'Early Life',
    ru: 'Ранние годы',
  },
  education: {
    en: 'Education',
    ru: 'Образование',
  },
  career: {
    en: 'Career',
    ru: 'Карьера',
  },
  family: {
    en: 'Family',
    ru: 'Семья',
  },
  places: {
    en: 'Places Lived',
    ru: 'Места проживания',
  },
  legacy: {
    en: 'Legacy',
    ru: 'Наследие',
  },
};

/**
 * Missing field labels by locale
 */
export const missingFieldLabels: Record<Locale, Record<string, { label: string; description: string }>> = {
  en: {
    birth_date: {
      label: 'Birth Date',
      description: 'Add the birth date to complete the early life section',
    },
    birth_place: {
      label: 'Birth Place',
      description: 'Add where they were born for a richer story',
    },
    death_date: {
      label: 'Death Date',
      description: 'Add the passing date if applicable',
    },
    death_place: {
      label: 'Place of Passing',
      description: 'Add where they passed away',
    },
    occupation: {
      label: 'Occupation',
      description: 'Add their profession or career for the career section',
    },
    bio: {
      label: 'Biography',
      description: 'Add a personal biography or life story',
    },
    education: {
      label: 'Education',
      description: 'Add education history to enrich their story',
    },
    employment: {
      label: 'Employment',
      description: 'Add work history to complete the career section',
    },
    residences: {
      label: 'Residences',
      description: 'Add places they lived for the places section',
    },
    relationships: {
      label: 'Family Connections',
      description: 'Add family relationships for the family section',
    },
    photos: {
      label: 'Photos',
      description: 'Add photos to bring their story to life',
    },
  },
  ru: {
    birth_date: {
      label: 'Дата рождения',
      description: 'Добавьте дату рождения для раздела о ранних годах',
    },
    birth_place: {
      label: 'Место рождения',
      description: 'Добавьте место рождения для более полной истории',
    },
    death_date: {
      label: 'Дата смерти',
      description: 'Добавьте дату смерти, если применимо',
    },
    death_place: {
      label: 'Место смерти',
      description: 'Добавьте место смерти',
    },
    occupation: {
      label: 'Профессия',
      description: 'Добавьте профессию для раздела о карьере',
    },
    bio: {
      label: 'Биография',
      description: 'Добавьте личную биографию или историю жизни',
    },
    education: {
      label: 'Образование',
      description: 'Добавьте историю образования для обогащения истории',
    },
    employment: {
      label: 'Трудоустройство',
      description: 'Добавьте историю работы для раздела о карьере',
    },
    residences: {
      label: 'Места проживания',
      description: 'Добавьте места проживания для соответствующего раздела',
    },
    relationships: {
      label: 'Семейные связи',
      description: 'Добавьте семейные связи для раздела о семье',
    },
    photos: {
      label: 'Фотографии',
      description: 'Добавьте фотографии, чтобы оживить историю',
    },
  },
};

/**
 * Introduction templates
 */
export const introductionTemplates: Record<Locale, string[]> = {
  en: [
    '{{fullName}}{{?nickname}} (known as "{{nickname}}"){{/nickname}} {{lifeSpan}}.',
    '{{?occupation}}{{genderPronounSubject}} was {{aAn}} {{occupation}}.{{/occupation}}',
    '{{?bio}}{{bio}}{{/bio}}',
  ],
  ru: [
    '{{fullName}}{{?nickname}} (известен как "{{nickname}}"){{/nickname}} {{lifeSpan}}.',
    '{{?occupation}}{{genderPronounSubject}} {{occupationVerb}} {{occupation}}.{{/occupation}}',
    '{{?bio}}{{bio}}{{/bio}}',
  ],
};

/**
 * Early life templates
 */
export const earlyLifeTemplates: Record<Locale, string[]> = {
  en: [
    '{{?birth_date}}{{fullName}} was born on {{birth_date}}{{?birth_place}} in {{birth_place}}{{/birth_place}}.{{/birth_date}}',
    '{{?birth_place}}{{^birth_date}}{{fullName}} was born in {{birth_place}}.{{/birth_date}}{{/birth_place}}',
    '{{?maiden_name}}{{genderPronounSubject}} was born {{maiden_name}} before marriage.{{/maiden_name}}',
  ],
  ru: [
    '{{?birth_date}}{{fullName}} родил{{genderSuffix}} {{birth_date}}{{?birth_place}} в городе {{birth_place}}{{/birth_place}}.{{/birth_date}}',
    '{{?birth_place}}{{^birth_date}}{{fullName}} родил{{genderSuffix}} в городе {{birth_place}}.{{/birth_date}}{{/birth_place}}',
    '{{?maiden_name}}До замужества носил{{genderSuffix}} фамилию {{maiden_name}}.{{/maiden_name}}',
  ],
};

/**
 * Education templates
 */
export const educationTemplates: Record<Locale, string[]> = {
  en: [
    '{{#education}}',
    '{{?degree}}{{fullName}} earned {{aAn}} {{degree}}{{?field_of_study}} in {{field_of_study}}{{/field_of_study}} from {{institution_name}}{{?end_year}} in {{end_year}}{{/end_year}}.{{/degree}}',
    '{{^degree}}{{fullName}} attended {{institution_name}}{{?start_year}} starting in {{start_year}}{{/start_year}}{{?end_year}} until {{end_year}}{{/end_year}}.{{/degree}}',
    '{{/education}}',
  ],
  ru: [
    '{{#education}}',
    '{{?degree}}{{fullName}} получил{{genderSuffix}} {{degree}}{{?field_of_study}} по специальности {{field_of_study}}{{/field_of_study}} в {{institution_name}}{{?end_year}} в {{end_year}} году{{/end_year}}.{{/degree}}',
    '{{^degree}}{{fullName}} учил{{genderSuffix}}ся в {{institution_name}}{{?start_year}} с {{start_year}} года{{/start_year}}{{?end_year}} по {{end_year}} год{{/end_year}}.{{/degree}}',
    '{{/education}}',
  ],
};

/**
 * Career templates
 */
export const careerTemplates: Record<Locale, string[]> = {
  en: [
    '{{?occupation}}{{fullName}} worked as {{aAn}} {{occupation}}.{{/occupation}}',
    '{{#employment}}',
    '{{genderPronounSubject}} worked as {{position}} at {{company_name}}{{?location}} in {{location}}{{/location}}{{?start_date}} from {{start_date}}{{/start_date}}{{?end_date}} to {{end_date}}{{/end_date}}{{?is_current}} and continues to this day{{/is_current}}.',
    '{{/employment}}',
  ],
  ru: [
    '{{?occupation}}{{fullName}} работал{{genderSuffix}} {{occupation}}.{{/occupation}}',
    '{{#employment}}',
    '{{genderPronounSubject}} работал{{genderSuffix}} {{position}} в {{company_name}}{{?location}} в {{location}}{{/location}}{{?start_date}} с {{start_date}}{{/start_date}}{{?end_date}} по {{end_date}}{{/end_date}}{{?is_current}} и продолжает по сей день{{/is_current}}.',
    '{{/employment}}',
  ],
};

/**
 * Family templates
 */
export const familyTemplates: Record<Locale, string[]> = {
  en: [
    '{{?spouse}}{{fullName}} {{spouseVerb}} {{spouse}}{{?marriage_date}} on {{marriage_date}}{{/marriage_date}}{{?marriage_place}} in {{marriage_place}}{{/marriage_place}}.{{/spouse}}',
    '{{?children}}{{genderPronounSubject}} {{childrenVerb}} {{childrenCount}} {{childrenWord}}: {{children}}.{{/children}}',
    '{{?parents}}{{genderPronounSubject}} is the child of {{parents}}.{{/parents}}',
    '{{?siblings}}{{genderPronounSubject}} has {{siblingsCount}} {{siblingsWord}}: {{siblings}}.{{/siblings}}',
  ],
  ru: [
    '{{?spouse}}{{fullName}} {{spouseVerbRu}} {{spouse}}{{?marriage_date}} {{marriage_date}}{{/marriage_date}}{{?marriage_place}} в {{marriage_place}}{{/marriage_place}}.{{/spouse}}',
    '{{?children}}У {{genderPronounGenitive}} {{childrenCount}} {{childrenWordRu}}: {{children}}.{{/children}}',
    '{{?parents}}{{genderPronounSubject}} - {{childOfRu}} {{parents}}.{{/parents}}',
    '{{?siblings}}У {{genderPronounGenitive}} {{siblingsCount}} {{siblingsWordRu}}: {{siblings}}.{{/siblings}}',
  ],
};

/**
 * Places templates
 */
export const placesTemplates: Record<Locale, string[]> = {
  en: [
    '{{?current_city}}{{fullName}} currently resides in {{current_city}}{{?current_country}}, {{current_country}}{{/current_country}}.{{/current_city}}',
    '{{#residences}}',
    '{{genderPronounSubject}} lived in {{city}}{{?country}}, {{country}}{{/country}}{{?start_date}} from {{start_date}}{{/start_date}}{{?end_date}} to {{end_date}}{{/end_date}}{{?is_current}} and currently lives there{{/is_current}}.',
    '{{/residences}}',
  ],
  ru: [
    '{{?current_city}}В настоящее время {{fullName}} проживает в {{current_city}}{{?current_country}}, {{current_country}}{{/current_country}}.{{/current_city}}',
    '{{#residences}}',
    '{{genderPronounSubject}} жил{{genderSuffix}} в {{city}}{{?country}}, {{country}}{{/country}}{{?start_date}} с {{start_date}}{{/start_date}}{{?end_date}} по {{end_date}}{{/end_date}}{{?is_current}} и проживает там по сей день{{/is_current}}.',
    '{{/residences}}',
  ],
};

/**
 * Legacy templates (for deceased persons)
 */
export const legacyTemplates: Record<Locale, string[]> = {
  en: [
    '{{?death_date}}{{fullName}} passed away on {{death_date}}{{?death_place}} in {{death_place}}{{/death_place}}{{?age}} at the age of {{age}}{{/age}}.{{/death_date}}',
    '{{?voiceStoriesCount}}{{genderPronounPossessive}} memory lives on through {{voiceStoriesCount}} recorded {{storiesWord}} preserved by family.{{/voiceStoriesCount}}',
    '{{?photosCount}}The family has preserved {{photosCount}} {{photosWord}} documenting {{genderPronounPossessive}} life.{{/photosCount}}',
  ],
  ru: [
    '{{?death_date}}{{fullName}} скончал{{genderSuffix}}ся {{death_date}}{{?death_place}} в {{death_place}}{{/death_place}}{{?age}} в возрасте {{age}} лет{{/age}}.{{/death_date}}',
    '{{?voiceStoriesCount}}Память о {{genderPronounPrepositional}} живёт благодаря {{voiceStoriesCount}} записанн{{storiesWordRu}}, сохранённ{{storiesWordRu2}} семьёй.{{/voiceStoriesCount}}',
    '{{?photosCount}}Семья сохранила {{photosCount}} {{photosWordRu}}, документирующих жизнь.{{/photosCount}}',
  ],
};

/**
 * Get all templates for a section
 */
export function getSectionTemplates(
  sectionId: string,
  locale: Locale
): string[] {
  switch (sectionId) {
    case 'introduction':
      return introductionTemplates[locale];
    case 'early_life':
      return earlyLifeTemplates[locale];
    case 'education':
      return educationTemplates[locale];
    case 'career':
      return careerTemplates[locale];
    case 'family':
      return familyTemplates[locale];
    case 'places':
      return placesTemplates[locale];
    case 'legacy':
      return legacyTemplates[locale];
    default:
      return [];
  }
}

/**
 * Gender-specific words
 */
export const genderWords: Record<Locale, Record<string, Record<string, string>>> = {
  en: {
    male: {
      subject: 'He',
      object: 'him',
      possessive: 'His',
      reflexive: 'himself',
    },
    female: {
      subject: 'She',
      object: 'her',
      possessive: 'Her',
      reflexive: 'herself',
    },
    other: {
      subject: 'They',
      object: 'them',
      possessive: 'Their',
      reflexive: 'themselves',
    },
  },
  ru: {
    male: {
      subject: 'Он',
      object: 'его',
      possessive: 'Его',
      genitive: 'него',
      prepositional: 'нём',
      suffix: '',
      suffixA: '',
    },
    female: {
      subject: 'Она',
      object: 'её',
      possessive: 'Её',
      genitive: 'неё',
      prepositional: 'ней',
      suffix: 'а',
      suffixA: 'а',
    },
    other: {
      subject: 'Они',
      object: 'их',
      possessive: 'Их',
      genitive: 'них',
      prepositional: 'них',
      suffix: 'и',
      suffixA: 'и',
    },
  },
};

/**
 * Get a/an article for English
 */
export function getArticle(word: string): string {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = word.trim().toLowerCase()[0];
  return vowels.includes(firstLetter) ? 'an' : 'a';
}

/**
 * Pluralization helpers
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  locale: Locale
): string {
  if (locale === 'en') {
    return count === 1 ? singular : plural;
  }

  // Russian pluralization (simplified)
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return plural; // genitive plural for 11-19
  }

  if (lastDigit === 1) {
    return singular;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return plural.replace(/ей$/, 'я').replace(/ов$/, 'а'); // genitive singular
  }

  return plural; // genitive plural
}
