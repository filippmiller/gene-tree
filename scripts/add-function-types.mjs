#!/usr/bin/env node
/**
 * Adds get_family_circle_profile_ids function type to supabase.ts
 * Inserts it alphabetically after get_descendants_with_depth
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const typesFilePath = join(projectRoot, 'src', 'lib', 'types', 'supabase.ts');

// Read the current types file
let content = readFileSync(typesFilePath, 'utf-8');

// Check if function already exists
if (content.includes('get_family_circle_profile_ids:')) {
  console.log('get_family_circle_profile_ids function type already exists, skipping...');
  process.exit(0);
}

// Find get_descendants_with_depth and insert after it
const lines = content.split('\n');
let insertIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('get_descendants_with_depth:')) {
    // Find the closing brace for this function
    let braceCount = 0;
    let foundStart = false;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('{')) {
        braceCount++;
        foundStart = true;
      }
      if (lines[j].includes('}')) {
        braceCount--;
        if (foundStart && braceCount === 0) {
          insertIndex = j + 1;
          break;
        }
      }
    }
    break;
  }
}

if (insertIndex === -1) {
  console.error('Could not find get_descendants_with_depth function');
  process.exit(1);
}

// Insert the new function
const functionLines = [
  '      get_family_circle_profile_ids: {',
  '        Args: { p_user_id: string }',
  '        Returns: { profile_id: string }[]',
  '      }'
];

lines.splice(insertIndex, 0, ...functionLines);

// Write back
writeFileSync(typesFilePath, lines.join('\n'), 'utf-8');

console.log('✅ Successfully added get_family_circle_profile_ids function type to supabase.ts');
console.log(`   Inserted at line ${insertIndex + 1}`);
