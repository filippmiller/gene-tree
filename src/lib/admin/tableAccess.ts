export type AccessLevel = 'full' | 'read-only' | 'no-delete' | 'hidden';

export type TableCategory = 'core' | 'content' | 'system' | 'reference';

export interface TableConfig {
  accessLevel: AccessLevel;
  category: TableCategory;
  displayName?: string;
}

/**
 * Table access configuration
 * Defines which tables are visible and what operations are allowed
 */
export const TABLE_CONFIG: Record<string, TableConfig> = {
  // Core tables - full access
  user_profiles: { accessLevel: 'full', category: 'core', displayName: 'User Profiles' },
  relationships: { accessLevel: 'full', category: 'core', displayName: 'Relationships' },
  deceased_relatives: { accessLevel: 'full', category: 'core', displayName: 'Deceased Relatives' },

  // Content tables - full access
  stories: { accessLevel: 'full', category: 'content', displayName: 'Stories' },
  family_stories: { accessLevel: 'full', category: 'content', displayName: 'Family Stories' },
  voice_stories: { accessLevel: 'full', category: 'content', displayName: 'Voice Stories' },
  comments: { accessLevel: 'full', category: 'content', displayName: 'Comments' },
  photos: { accessLevel: 'full', category: 'content', displayName: 'Photos' },
  photo_people: { accessLevel: 'full', category: 'content', displayName: 'Photo People Tags' },
  photo_reviews: { accessLevel: 'full', category: 'content', displayName: 'Photo Reviews' },

  // Engagement tables
  elder_questions: { accessLevel: 'full', category: 'content', displayName: 'Elder Questions' },
  elder_answers: { accessLevel: 'full', category: 'content', displayName: 'Elder Answers' },
  memory_prompts: { accessLevel: 'full', category: 'content', displayName: 'Memory Prompts' },
  profile_interests: { accessLevel: 'full', category: 'content', displayName: 'Profile Interests' },

  // System tables - restricted
  audit_logs: { accessLevel: 'read-only', category: 'system', displayName: 'Audit Logs' },
  notifications: { accessLevel: 'no-delete', category: 'system', displayName: 'Notifications' },
  media_jobs: { accessLevel: 'read-only', category: 'system', displayName: 'Media Jobs' },
  invitations: { accessLevel: 'full', category: 'system', displayName: 'Invitations' },

  // Reference tables - read only
  kin_types: { accessLevel: 'read-only', category: 'reference', displayName: 'Kin Types' },
  kinship_labels: { accessLevel: 'read-only', category: 'reference', displayName: 'Kinship Labels' },
  relationship_types: { accessLevel: 'read-only', category: 'reference', displayName: 'Relationship Types' },
};

// Tables to always hide (internal/system)
export const HIDDEN_TABLES = [
  'schema_migrations',
  'supabase_migrations',
  '_prisma_migrations',
];

/**
 * Get the configuration for a table
 */
export function getTableConfig(tableName: string): TableConfig | null {
  if (HIDDEN_TABLES.includes(tableName)) {
    return null;
  }
  return TABLE_CONFIG[tableName] || {
    accessLevel: 'full',
    category: 'content',
    displayName: tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  };
}

/**
 * Check if a table allows a specific operation
 */
export function canPerformOperation(
  tableName: string,
  operation: 'read' | 'create' | 'update' | 'delete'
): boolean {
  const config = getTableConfig(tableName);
  if (!config) return false;

  switch (config.accessLevel) {
    case 'hidden':
      return false;
    case 'read-only':
      return operation === 'read';
    case 'no-delete':
      return operation !== 'delete';
    case 'full':
      return true;
    default:
      return false;
  }
}

/**
 * Get all visible tables grouped by category
 */
export function getVisibleTables(): Record<TableCategory, string[]> {
  const grouped: Record<TableCategory, string[]> = {
    core: [],
    content: [],
    system: [],
    reference: [],
  };

  for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
    if (config.accessLevel !== 'hidden') {
      grouped[config.category].push(tableName);
    }
  }

  return grouped;
}
