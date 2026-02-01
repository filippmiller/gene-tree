/**
 * Migration Data Extractor
 *
 * Extracts location data from profiles and builds migration paths
 * for the family tree visualization.
 */

import { getCoordinates, getDisplayName } from './coordinates';
import type {
  Coordinates,
  LocationPoint,
  PersonMigration,
  MigrationPath,
  MigrationData,
} from './types';

// Local type definitions to avoid strict Supabase type issues
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  birth_place: string | null;
  birth_city: string | null;
  birth_country: string | null;
  current_city: string | null;
  current_country: string | null;
  current_address: string | null;
  death_date: string | null;
  death_place: string | null;
  is_living: boolean | null;
}

interface Residence {
  id: string;
  person_id: string;
  city: string | null;
  country: string | null;
  place_text: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
}

interface LocationWithDate {
  location: string;
  coordinates: Coordinates;
  date?: string;
  year?: number;
  type: 'birth' | 'residence' | 'death' | 'current';
}

/**
 * Extract year from a date string
 */
function extractYear(dateStr: string | null | undefined): number | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : undefined;
}

/**
 * Build location string from components
 */
function buildLocationString(
  city?: string | null,
  country?: string | null,
  place?: string | null
): string | null {
  if (place) return place;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return null;
}

/**
 * Extract all locations from a profile
 */
function extractProfileLocations(profile: Profile): LocationWithDate[] {
  const locations: LocationWithDate[] = [];

  // Birth location
  const birthLocation = buildLocationString(
    profile.birth_city,
    profile.birth_country,
    profile.birth_place
  );
  if (birthLocation) {
    const coords = getCoordinates(birthLocation);
    if (coords) {
      locations.push({
        location: getDisplayName(birthLocation),
        coordinates: coords,
        date: profile.birth_date ?? undefined,
        year: extractYear(profile.birth_date),
        type: 'birth',
      });
    }
  }

  // Death location (for deceased)
  if (profile.death_place && !profile.is_living) {
    const coords = getCoordinates(profile.death_place);
    if (coords) {
      locations.push({
        location: getDisplayName(profile.death_place),
        coordinates: coords,
        date: profile.death_date ?? undefined,
        year: extractYear(profile.death_date),
        type: 'death',
      });
    }
  }

  // Current location (for living)
  const currentLocation = buildLocationString(
    profile.current_city,
    profile.current_country,
    profile.current_address
  );
  if (currentLocation && profile.is_living !== false) {
    const coords = getCoordinates(currentLocation);
    if (coords) {
      // Only add if different from birth location
      const isDifferent =
        !birthLocation ||
        birthLocation.toLowerCase() !== currentLocation.toLowerCase();
      if (isDifferent) {
        locations.push({
          location: getDisplayName(currentLocation),
          coordinates: coords,
          year: new Date().getFullYear(),
          type: 'current',
        });
      }
    }
  }

  return locations;
}

/**
 * Extract locations from residence history
 */
function extractResidenceLocations(residences: Residence[]): LocationWithDate[] {
  const locations: LocationWithDate[] = [];

  for (const res of residences) {
    const location = buildLocationString(res.city, res.country, res.place_text);
    if (location) {
      const coords = getCoordinates(location);
      if (coords) {
        locations.push({
          location: getDisplayName(location),
          coordinates: coords,
          date: res.start_date ?? undefined,
          year: extractYear(res.start_date),
          type: res.is_current ? 'current' : 'residence',
        });
      }
    }
  }

  return locations;
}

/**
 * Calculate generation based on birth year relative to root
 */
function calculateGeneration(
  personBirthYear: number | undefined,
  rootBirthYear: number | undefined
): number {
  if (!personBirthYear || !rootBirthYear) return 0;
  const diff = rootBirthYear - personBirthYear;
  // Roughly 25-30 years per generation
  return Math.round(diff / 27);
}

/**
 * Build migration paths from a person's locations
 */
function buildMigrationPaths(
  personId: string,
  personName: string,
  generation: number,
  locations: LocationWithDate[]
): MigrationPath[] {
  if (locations.length < 2) return [];

  // Sort locations by year
  const sorted = [...locations].sort((a, b) => {
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    return yearA - yearB;
  });

  const paths: MigrationPath[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i];
    const to = sorted[i + 1];

    // Skip if same location
    if (
      from.coordinates.lat === to.coordinates.lat &&
      from.coordinates.lng === to.coordinates.lng
    ) {
      continue;
    }

    paths.push({
      id: `${personId}-${i}`,
      personId,
      personName,
      generation,
      from: {
        id: `${personId}-loc-${i}`,
        name: from.location,
        coordinates: from.coordinates,
        date: from.date,
        year: from.year,
        type: from.type,
      },
      to: {
        id: `${personId}-loc-${i + 1}`,
        name: to.location,
        coordinates: to.coordinates,
        date: to.date,
        year: to.year,
        type: to.type,
      },
      year: to.year,
    });
  }

  return paths;
}

/**
 * Calculate year range from all paths
 */
function calculateYearRange(paths: MigrationPath[]): { min: number; max: number } {
  let min = new Date().getFullYear();
  let max = 1800;

  for (const path of paths) {
    if (path.from.year && path.from.year < min) min = path.from.year;
    if (path.from.year && path.from.year > max) max = path.from.year;
    if (path.to.year && path.to.year < min) min = path.to.year;
    if (path.to.year && path.to.year > max) max = path.to.year;
  }

  // Ensure reasonable defaults
  if (min > max) {
    min = 1900;
    max = new Date().getFullYear();
  }

  return { min, max };
}

/**
 * Calculate location statistics (how many people passed through each location)
 */
function calculateLocationStats(
  paths: MigrationPath[]
): { name: string; count: number; coordinates: Coordinates }[] {
  const stats = new Map<string, { count: number; coordinates: Coordinates }>();

  for (const path of paths) {
    // Count 'from' location
    const fromKey = `${path.from.coordinates.lat},${path.from.coordinates.lng}`;
    if (!stats.has(fromKey)) {
      stats.set(fromKey, { count: 0, coordinates: path.from.coordinates });
    }
    stats.get(fromKey)!.count++;

    // Count 'to' location
    const toKey = `${path.to.coordinates.lat},${path.to.coordinates.lng}`;
    if (!stats.has(toKey)) {
      stats.set(toKey, { count: 0, coordinates: path.to.coordinates });
    }
    stats.get(toKey)!.count++;
  }

  // Convert to array and sort by count
  const result: { name: string; count: number; coordinates: Coordinates }[] = [];

  for (const path of paths) {
    const fromKey = `${path.from.coordinates.lat},${path.from.coordinates.lng}`;
    const existing = result.find(
      (r) =>
        r.coordinates.lat === path.from.coordinates.lat &&
        r.coordinates.lng === path.from.coordinates.lng
    );
    if (!existing) {
      result.push({
        name: path.from.name,
        count: stats.get(fromKey)!.count,
        coordinates: path.from.coordinates,
      });
    }

    const toKey = `${path.to.coordinates.lat},${path.to.coordinates.lng}`;
    const existingTo = result.find(
      (r) =>
        r.coordinates.lat === path.to.coordinates.lat &&
        r.coordinates.lng === path.to.coordinates.lng
    );
    if (!existingTo) {
      result.push({
        name: path.to.name,
        count: stats.get(toKey)!.count,
        coordinates: path.to.coordinates,
      });
    }
  }

  return result.sort((a, b) => b.count - a.count);
}

/**
 * Main extraction function - fetches all family migration data
 *
 * @param supabase - Supabase client instance (any type to avoid version conflicts)
 * @param userId - The user ID to extract migration data for
 */
export async function extractMigrationData(
  supabase: { from: (table: string) => unknown },
  userId: string
): Promise<MigrationData> {
  const persons: PersonMigration[] = [];
  const allPaths: MigrationPath[] = [];

  // Get the root user's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rootProfile } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const rootBirthYear = rootProfile ? extractYear(rootProfile.birth_date) : undefined;

  // Get all related profiles through relationships
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: relationships } = await (supabase as any)
    .from('relationships')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  // Collect all related profile IDs
  const profileIds = new Set<string>([userId]);
  if (relationships) {
    for (const rel of relationships) {
      profileIds.add(rel.user1_id);
      profileIds.add(rel.user2_id);
    }
  }

  // Fetch all profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .in('id', Array.from(profileIds));

  // Fetch all residences for these profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allResidences } = await (supabase as any)
    .from('person_residence')
    .select('*')
    .in('person_id', Array.from(profileIds))
    .order('start_date', { ascending: true });

  // Group residences by person
  const residencesByPerson = new Map<string, Residence[]>();
  if (allResidences) {
    for (const res of allResidences) {
      if (!residencesByPerson.has(res.person_id)) {
        residencesByPerson.set(res.person_id, []);
      }
      residencesByPerson.get(res.person_id)!.push(res);
    }
  }

  // Process each profile
  if (profiles) {
    for (const profile of profiles) {
      const personName = `${profile.first_name} ${profile.last_name}`.trim();
      const birthYear = extractYear(profile.birth_date);
      const generation = calculateGeneration(birthYear, rootBirthYear);

      // Get locations from profile
      const profileLocations = extractProfileLocations(profile);

      // Get locations from residence history
      const residences = residencesByPerson.get(profile.id) || [];
      const residenceLocations = extractResidenceLocations(residences);

      // Merge and deduplicate locations
      const allLocations = [...profileLocations, ...residenceLocations];

      if (allLocations.length > 0) {
        // Build location points
        const locationPoints: LocationPoint[] = allLocations.map((loc, idx) => ({
          id: `${profile.id}-${idx}`,
          name: loc.location,
          coordinates: loc.coordinates,
          date: loc.date,
          year: loc.year,
          type: loc.type,
        }));

        persons.push({
          personId: profile.id,
          personName,
          birthYear,
          generation,
          locations: locationPoints,
        });

        // Build migration paths
        const paths = buildMigrationPaths(
          profile.id,
          personName,
          generation,
          allLocations
        );
        allPaths.push(...paths);
      }
    }
  }

  // Also process deceased relatives
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deceasedRelatives } = await (supabase as any)
    .from('deceased_relatives')
    .select('*')
    .eq('added_by_user_id', userId);

  if (deceasedRelatives) {
    for (const deceased of deceasedRelatives) {
      const personName = `${deceased.first_name} ${deceased.last_name}`.trim();
      const birthYear = extractYear(deceased.birth_date);
      const generation = calculateGeneration(birthYear, rootBirthYear);
      const locations: LocationWithDate[] = [];

      // Birth place
      if (deceased.birth_place) {
        const coords = getCoordinates(deceased.birth_place);
        if (coords) {
          locations.push({
            location: getDisplayName(deceased.birth_place),
            coordinates: coords,
            date: deceased.birth_date ?? undefined,
            year: birthYear,
            type: 'birth',
          });
        }
      }

      // Death place
      if (deceased.death_place) {
        const coords = getCoordinates(deceased.death_place);
        if (coords) {
          locations.push({
            location: getDisplayName(deceased.death_place),
            coordinates: coords,
            date: deceased.death_date ?? undefined,
            year: extractYear(deceased.death_date),
            type: 'death',
          });
        }
      }

      if (locations.length > 0) {
        const locationPoints: LocationPoint[] = locations.map((loc, idx) => ({
          id: `deceased-${deceased.id}-${idx}`,
          name: loc.location,
          coordinates: loc.coordinates,
          date: loc.date,
          year: loc.year,
          type: loc.type,
        }));

        persons.push({
          personId: deceased.id,
          personName,
          birthYear,
          generation,
          locations: locationPoints,
        });

        const paths = buildMigrationPaths(
          deceased.id,
          personName,
          generation,
          locations
        );
        allPaths.push(...paths);
      }
    }
  }

  return {
    persons,
    paths: allPaths,
    yearRange: calculateYearRange(allPaths),
    locationStats: calculateLocationStats(allPaths),
  };
}
