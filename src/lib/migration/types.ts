/**
 * Migration Map Types
 *
 * Type definitions for the family migration visualization feature.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  date?: string;
  year?: number;
  type: 'birth' | 'residence' | 'death' | 'current';
}

export interface PersonMigration {
  personId: string;
  personName: string;
  birthYear?: number;
  generation: number;
  locations: LocationPoint[];
}

export interface MigrationPath {
  id: string;
  personId: string;
  personName: string;
  generation: number;
  from: LocationPoint;
  to: LocationPoint;
  year?: number;
}

export interface MigrationData {
  persons: PersonMigration[];
  paths: MigrationPath[];
  yearRange: {
    min: number;
    max: number;
  };
  locationStats: {
    name: string;
    count: number;
    coordinates: Coordinates;
  }[];
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
