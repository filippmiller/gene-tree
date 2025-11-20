#!/usr/bin/env node
/**
 * Adds notifications and notification_recipients table types to supabase.ts
 * This is a temporary fix until migration 0027 is applied to production database
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const typesFilePath = join(projectRoot, 'src', 'lib', 'types', 'supabase.ts');

// Read the current types file
const content = readFileSync(typesFilePath, 'utf-8');
const lines = content.split('\n');

// Find the line with "invitations:" table
let insertLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s+invitations:\s*{/)) {
        // Find the closing brace for invitations table
        let braceCount = 0;
        let foundStart = false;
        for (let j = i; j < lines.length; j++) {
            const line = lines[j];
            if (line.includes('{')) {
                braceCount++;
                foundStart = true;
            }
            if (line.includes('}')) {
                braceCount--;
                if (foundStart && braceCount === 0) {
                    insertLineIndex = j + 1;
                    break;
                }
            }
        }
        break;
    }
}

if (insertLineIndex === -1) {
    console.error('Could not find invitations table in types file');
    process.exit(1);
}

// Check if notifications already exists
if (content.includes('notifications:')) {
    console.log('notifications table types already exist, skipping...');
    process.exit(0);
}

const notificationsTypes = `      notification_recipients: {
        Row: {
          is_read: boolean
          notification_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          is_read?: boolean
          notification_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          is_read?: boolean
          notification_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_profile_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          primary_profile_id: string | null
          related_profile_id: string | null
        }
        Insert: {
          actor_profile_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          primary_profile_id?: string | null
          related_profile_id?: string | null
        }
        Update: {
          actor_profile_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          primary_profile_id?: string | null
          related_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }`;

// Insert the notifications types
lines.splice(insertLineIndex, 0, notificationsTypes);

// Write back
writeFileSync(typesFilePath, lines.join('\n'), 'utf-8');

console.log('✅ Successfully added notifications table types to supabase.ts');
console.log(`   Inserted at line ${insertLineIndex + 1}`);
