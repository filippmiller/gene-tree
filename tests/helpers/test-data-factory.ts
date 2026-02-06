/**
 * Test Data Factory
 *
 * Generates mock family data for E2E tests.
 * Uses deterministic patterns for reproducibility.
 */

const FIRST_NAMES_MALE = ['James', 'Robert', 'William', 'David', 'Thomas', 'Michael', 'John', 'Richard'];
const FIRST_NAMES_FEMALE = ['Mary', 'Elizabeth', 'Margaret', 'Dorothy', 'Helen', 'Patricia', 'Linda', 'Barbara'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

let seedCounter = 0;

function nextSeed(): number {
  return seedCounter++;
}

export function resetSeed() {
  seedCounter = 0;
}

export interface MockPerson {
  firstName: string;
  lastName: string;
  birthYear: number;
  gender: 'male' | 'female';
  isDeceased: boolean;
}

export function generatePerson(options?: {
  gender?: 'male' | 'female';
  deceased?: boolean;
  birthYear?: number;
}): MockPerson {
  const idx = nextSeed();
  const gender = options?.gender || (idx % 2 === 0 ? 'male' : 'female');
  const names = gender === 'male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;

  return {
    firstName: names[idx % names.length],
    lastName: LAST_NAMES[idx % LAST_NAMES.length],
    birthYear: options?.birthYear || 1950 + (idx % 50),
    gender,
    isDeceased: options?.deceased ?? idx % 3 === 0,
  };
}

export interface MockFamily {
  mother: MockPerson;
  father: MockPerson;
  maternalGrandmother: MockPerson;
  maternalGrandfather: MockPerson;
  paternalGrandmother: MockPerson;
  paternalGrandfather: MockPerson;
  siblings: MockPerson[];
}

export function generateFamily(siblingCount: number = 1): MockFamily {
  resetSeed();

  return {
    mother: generatePerson({ gender: 'female', birthYear: 1960 }),
    father: generatePerson({ gender: 'male', birthYear: 1958 }),
    maternalGrandmother: generatePerson({ gender: 'female', birthYear: 1935, deceased: true }),
    maternalGrandfather: generatePerson({ gender: 'male', birthYear: 1933, deceased: true }),
    paternalGrandmother: generatePerson({ gender: 'female', birthYear: 1932, deceased: true }),
    paternalGrandfather: generatePerson({ gender: 'male', birthYear: 1930, deceased: true }),
    siblings: Array.from({ length: siblingCount }, () =>
      generatePerson({ birthYear: 1985 + nextSeed() })
    ),
  };
}

export interface MockStory {
  title: string;
  content: string;
  visibility: 'public' | 'family' | 'private';
}

const STORY_TEMPLATES = [
  {
    title: 'Summer at the Lake House',
    content: 'Every summer, our family would gather at the old lake house. The water was always crystal clear, and grandmother would make her famous apple pie.',
  },
  {
    title: 'The Wedding Day',
    content: 'It was a beautiful autumn afternoon when they said their vows. The golden leaves falling around them made the perfect backdrop.',
  },
  {
    title: 'First Day of School',
    content: 'I remember that September morning like it was yesterday. Mom packed my favorite lunch, and Dad walked me to the school gates.',
  },
];

export function generateStory(visibility: 'public' | 'family' | 'private' = 'family'): MockStory {
  const idx = nextSeed() % STORY_TEMPLATES.length;
  const template = STORY_TEMPLATES[idx];
  return {
    title: `[E2E Test] ${template.title}`,
    content: template.content,
    visibility,
  };
}

export function generateChatMessage(): string {
  const messages = [
    'Hello family! Hope everyone is having a great day.',
    'Did you see the old photos I found in the attic?',
    'Grandma would have loved this weather today.',
    'Who is coming to the reunion next month?',
    'Just wanted to say I love you all!',
  ];
  return messages[nextSeed() % messages.length];
}
