#!/usr/bin/env node

/**
 * Run a specific migration file against the local Supabase database
 * Usage: npm run supabase:migrate:local <migration-file-name>
 * Example: npm run supabase:migrate:local 20240101000015_fix_admin_policy_recursion.sql
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Please provide a migration file name');
  console.log('\nUsage: npm run supabase:migrate:local <migration-file-name>');
  console.log('Example: npm run supabase:migrate:local 20240101000015_fix_admin_policy_recursion.sql');
  process.exit(1);
}

// Construct full path to migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

// Check if file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: Migration file not found: ${migrationPath}`);
  console.log('\nAvailable migrations:');
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  files.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}

// Database connection string
const dbUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';

console.log(`\n🚀 Running migration: ${migrationFile}`);
console.log(`📁 Path: ${migrationPath}\n`);

try {
  // Execute the migration
  execSync(`psql ${dbUrl} -f "${migrationPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log(`\n✅ Migration completed successfully!`);
  
  // Auto-dump schema after successful migration
  console.log(`\n📊 Auto-dumping database schema...`);
  try {
    execSync('node scripts/dump-schema.js', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (dumpError) {
    console.log(`⚠️  Warning: Could not auto-dump schema (this is optional)`);
  }
} catch (error) {
  console.error(`\n❌ Migration failed!`);
  console.error(error.message);
  process.exit(1);
}

