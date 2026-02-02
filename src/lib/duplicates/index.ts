/**
 * Duplicate Detection System
 *
 * Provides smart merge suggestions when the same person is added twice.
 * Detects potential duplicates, shows confidence scores, and handles merging.
 *
 * Enhanced for deceased profile detection with:
 * - Cross-language name variant matching (EN/RU)
 * - Death date matching
 * - Shared relatives detection
 */

export * from './types';
export * from './detector';
export * from './merge-service';

// Re-export enhanced types from src/types/duplicate.ts
export type {
  EnhancedProfileData,
  ExtendedMatchReasons,
  EnhancedDuplicateScanResult,
  EnhancedPotentialDuplicate,
  EnhancedMergeRequest,
  EnhancedMergeResult,
  ExtendedDuplicateStatus,
  DuplicateScanOptions,
  DuplicateScanHistory,
  ProfileComparisonField,
} from '@/types/duplicate';

export {
  NAME_VARIANTS,
  areNameVariants,
  buildProfileComparison,
} from '@/types/duplicate';
