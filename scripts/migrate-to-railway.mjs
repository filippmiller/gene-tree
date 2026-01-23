#!/usr/bin/env node
/**
 * Migration Script: Supabase Cloud → Railway Self-hosted Supabase
 *
 * This script handles:
 * 1. Database export (pg_dump)
 * 2. Storage bucket download
 * 3. Database import to Railway (pg_restore)
 * 4. Storage bucket upload to Railway
 *
 * Prerequisites:
 * - pg_dump and pg_restore in PATH
 * - Node.js 18+
 * - Environment variables configured
 */

import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (n, msg) => console.log(`\n${colors.bold}${colors.cyan}Step ${n}:${colors.reset} ${msg}`)
};

const BACKUP_DIR = './migration-backup';
const DB_BACKUP_FILE = path.join(BACKUP_DIR, 'database.dump');
const STORAGE_DIR = path.join(BACKUP_DIR, 'storage');

async function main() {
  console.log(`
${colors.bold}╔════════════════════════════════════════════════════════════╗
║     Gene-Tree: Supabase → Railway Migration Tool           ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // Get source configuration
  log.step(1, 'Source Supabase Configuration (Current)');

  const sourceUrl = await ask('Enter your CURRENT Supabase URL (NEXT_PUBLIC_SUPABASE_URL): ');
  const sourceServiceKey = await ask('Enter your CURRENT Service Role Key (SUPABASE_SERVICE_ROLE_KEY): ');
  const sourceDbUrl = await ask('Enter your CURRENT Database URL (from Supabase Dashboard → Settings → Database): ');

  // Get target configuration
  log.step(2, 'Target Railway Supabase Configuration');
  console.log(`
${colors.yellow}If you haven't deployed Supabase on Railway yet:${colors.reset}
1. Go to: https://railway.com/deploy/supabase
2. Click "Deploy Now"
3. Wait for all services to start
4. Get credentials from Railway dashboard
`);

  const targetUrl = await ask('Enter your NEW Railway Supabase URL: ');
  const targetServiceKey = await ask('Enter your NEW Railway Service Role Key: ');
  const targetDbUrl = await ask('Enter your NEW Railway Database URL: ');

  // Initialize Supabase clients
  const sourceSupabase = createClient(sourceUrl, sourceServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const targetSupabase = createClient(targetUrl, targetServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Step 3: Export Database
  log.step(3, 'Exporting Database');
  try {
    log.info('Running pg_dump...');
    execSync(
      `pg_dump "${sourceDbUrl}" --no-owner --no-acl --clean --if-exists -F c -f "${DB_BACKUP_FILE}"`,
      { stdio: 'inherit' }
    );
    log.success(`Database exported to ${DB_BACKUP_FILE}`);
  } catch (error) {
    log.error('Database export failed. Check your connection string.');
    log.warn('You can also export manually from Supabase Dashboard → Database → Backups');
    const cont = await ask('Continue with storage export? (y/n): ');
    if (cont.toLowerCase() !== 'y') {
      rl.close();
      process.exit(1);
    }
  }

  // Step 4: Export Storage
  log.step(4, 'Exporting Storage Buckets');
  const buckets = ['avatars', 'media', 'audio'];

  for (const bucket of buckets) {
    const bucketDir = path.join(STORAGE_DIR, bucket);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    log.info(`Downloading bucket: ${bucket}`);

    try {
      const { data: files, error } = await sourceSupabase.storage
        .from(bucket)
        .list('', { limit: 1000 });

      if (error) {
        log.warn(`Could not list bucket ${bucket}: ${error.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        log.info(`Bucket ${bucket} is empty`);
        continue;
      }

      // Download each file
      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;

        await downloadFile(sourceSupabase, bucket, file.name, bucketDir);

        // If it's a folder, list and download its contents
        if (file.id === null) {
          await downloadFolder(sourceSupabase, bucket, file.name, bucketDir);
        }
      }

      log.success(`Downloaded ${bucket} bucket`);
    } catch (error) {
      log.warn(`Error with bucket ${bucket}: ${error.message}`);
    }
  }

  // Step 5: Import Database to Railway
  log.step(5, 'Importing Database to Railway');

  if (fs.existsSync(DB_BACKUP_FILE)) {
    const proceed = await ask('Ready to import database to Railway? This will overwrite existing data. (y/n): ');

    if (proceed.toLowerCase() === 'y') {
      try {
        log.info('Running pg_restore...');
        execSync(
          `pg_restore -d "${targetDbUrl}" --no-owner --no-acl --clean --if-exists "${DB_BACKUP_FILE}"`,
          { stdio: 'inherit' }
        );
        log.success('Database imported successfully');
      } catch (error) {
        log.warn('Some restore warnings are normal (e.g., "does not exist" for clean operations)');
      }
    }
  } else {
    log.warn('No database backup found, skipping import');
  }

  // Step 6: Create buckets and upload to Railway
  log.step(6, 'Creating Storage Buckets on Railway');

  const bucketConfigs = [
    { name: 'avatars', public: true },
    { name: 'media', public: false },
    { name: 'audio', public: false }
  ];

  for (const config of bucketConfigs) {
    try {
      const { error } = await targetSupabase.storage.createBucket(config.name, {
        public: config.public
      });

      if (error && !error.message.includes('already exists')) {
        log.warn(`Could not create bucket ${config.name}: ${error.message}`);
      } else {
        log.success(`Bucket ${config.name} ready`);
      }
    } catch (error) {
      log.warn(`Bucket ${config.name}: ${error.message}`);
    }
  }

  // Step 7: Upload storage files
  log.step(7, 'Uploading Storage Files to Railway');

  for (const bucket of buckets) {
    const bucketDir = path.join(STORAGE_DIR, bucket);
    if (!fs.existsSync(bucketDir)) continue;

    await uploadDirectory(targetSupabase, bucket, bucketDir, '');
  }

  // Step 8: Generate new .env
  log.step(8, 'Generating New Environment Configuration');

  const newEnv = `# Railway Supabase Configuration
# Generated by migration script on ${new Date().toISOString()}

NEXT_PUBLIC_SUPABASE_URL=${targetUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get-from-railway-dashboard>
SUPABASE_SERVICE_ROLE_KEY=${targetServiceKey}
DATABASE_URL=${targetDbUrl}

# Keep your existing integrations
TWILIO_ACCOUNT_SID=<your-value>
TWILIO_AUTH_TOKEN=<your-value>
TWILIO_PHONE_NUMBER=<your-value>
RESEND_API_KEY=<your-value>
RESEND_FROM_EMAIL=<your-value>
INVITES_MAX_PER_DAY=25
`;

  fs.writeFileSync(path.join(BACKUP_DIR, '.env.railway'), newEnv);
  log.success(`New environment template saved to ${BACKUP_DIR}/.env.railway`);

  // Done
  console.log(`
${colors.bold}${colors.green}╔════════════════════════════════════════════════════════════╗
║                    Migration Complete!                      ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bold}Next Steps:${colors.reset}
1. Copy ${BACKUP_DIR}/.env.railway to .env.local (fill in missing values)
2. Get ANON_KEY from Railway dashboard
3. Test the app: npm run dev
4. Verify all features work
5. Once confirmed, cancel your Supabase project

${colors.yellow}Backup location:${colors.reset} ${path.resolve(BACKUP_DIR)}
`);

  rl.close();
}

// Helper: Download a single file
async function downloadFile(supabase, bucket, filePath, localDir) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      log.warn(`  Could not download ${filePath}: ${error.message}`);
      return;
    }

    const localPath = path.join(localDir, filePath);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    log.info(`  Downloaded: ${filePath}`);
  } catch (error) {
    log.warn(`  Error downloading ${filePath}: ${error.message}`);
  }
}

// Helper: Download folder contents recursively
async function downloadFolder(supabase, bucket, folderPath, localDir) {
  try {
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit: 1000 });

    if (error || !files) return;

    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder') continue;

      const fullPath = `${folderPath}/${file.name}`;

      if (file.id === null) {
        // It's a folder
        await downloadFolder(supabase, bucket, fullPath, localDir);
      } else {
        // It's a file
        await downloadFile(supabase, bucket, fullPath, localDir);
      }
    }
  } catch (error) {
    log.warn(`Error listing folder ${folderPath}: ${error.message}`);
  }
}

// Helper: Upload directory contents
async function uploadDirectory(supabase, bucket, localDir, remotePath) {
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remoteFilePath = remotePath ? `${remotePath}/${item}` : item;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      await uploadDirectory(supabase, bucket, localPath, remoteFilePath);
    } else {
      try {
        const fileBuffer = fs.readFileSync(localPath);
        const { error } = await supabase.storage
          .from(bucket)
          .upload(remoteFilePath, fileBuffer, { upsert: true });

        if (error) {
          log.warn(`  Could not upload ${remoteFilePath}: ${error.message}`);
        } else {
          log.info(`  Uploaded: ${remoteFilePath}`);
        }
      } catch (error) {
        log.warn(`  Error uploading ${remoteFilePath}: ${error.message}`);
      }
    }
  }
}

main().catch(error => {
  log.error(`Migration failed: ${error.message}`);
  rl.close();
  process.exit(1);
});
