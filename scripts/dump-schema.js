#!/usr/bin/env node

/**
 * Dump Supabase Database Schema
 * 
 * This script dumps the current database schema to a markdown file
 * for easy reference when coding and for AI assistants.
 * 
 * Usage:
 *   npm run supabase:dump-schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getConnectionString() {
  try {
    // Get connection string from supabase status
    const status = execSync('supabase status', { encoding: 'utf-8' });
    const dbUrlMatch = status.match(/DB URL: (postgres:\/\/[^\s]+)/);
    
    if (dbUrlMatch) {
      return dbUrlMatch[1];
    }
    
    // Fallback to default local connection
    return 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  } catch (error) {
    log('Warning: Could not get connection string from supabase status, using default', colors.yellow);
    return 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  }
}

function dumpSchema() {
  log('\n📊 Dumping Database Schema...', colors.bright);
  
  const connectionString = getConnectionString();
  const outputFile = path.join(__dirname, '..', 'DATABASE_SCHEMA.md');
  
  try {
    // Check if Supabase is running
    try {
      execSync('supabase status', { stdio: 'ignore' });
    } catch (error) {
      log('❌ Error: Supabase is not running. Please start it with: supabase start', colors.red);
      process.exit(1);
    }
    
    log('📥 Fetching schema from database...', colors.blue);
    
    // Use Supabase CLI to dump schema (avoids pg_dump version issues)
    let schemaSQL;
    try {
      schemaSQL = execSync(
        'supabase db dump --local --schema public',
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );
    } catch (error) {
      // Fallback to psql queries if supabase dump fails
      log('⚠️  Supabase dump failed, using psql queries...', colors.yellow);
      schemaSQL = execSync(
        `psql "${connectionString}" -t -c "SELECT pg_catalog.pg_get_tabledef(c.oid) FROM pg_catalog.pg_class c LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname = 'public';"`,
        { encoding: 'utf-8' }
      );
    }
    
    // Get table descriptions
    const tableDescriptions = execSync(
      `psql "${connectionString}" -t -c "SELECT table_name, obj_description((quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass, 'pg_class') FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"`,
      { encoding: 'utf-8' }
    );
    
    // Get list of tables with row counts
    const tablesInfo = execSync(
      `psql "${connectionString}" -t -c "SELECT schemaname||'.'||relname as table, n_live_tup as rows FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname;"`,
      { encoding: 'utf-8' }
    );
    
    // Generate markdown content
    const timestamp = new Date().toISOString();
    let markdown = `# Database Schema\n\n`;
    markdown += `> **Auto-generated:** ${timestamp}\n`;
    markdown += `> **Purpose:** This file serves as a reference for the current database schema.\n`;
    markdown += `> It helps developers and AI assistants understand the data structure.\n\n`;
    markdown += `## Quick Reference\n\n`;
    
    // Parse and add table summary
    const tables = tablesInfo.trim().split('\n').filter(line => line.trim());
    markdown += `### Tables Overview\n\n`;
    markdown += `| Table | Estimated Rows |\n`;
    markdown += `|-------|----------------|\n`;
    tables.forEach(line => {
      const [table, rows] = line.split('|').map(s => s.trim());
      if (table && table.includes('.')) {
        const tableName = table.split('.')[1];
        markdown += `| \`${tableName}\` | ${rows || '0'} |\n`;
      }
    });
    markdown += `\n`;
    
    // Add full schema
    markdown += `## Complete Schema\n\n`;
    markdown += `\`\`\`sql\n`;
    markdown += schemaSQL;
    markdown += `\n\`\`\`\n`;
    
    // Write to file
    fs.writeFileSync(outputFile, markdown, 'utf-8');
    
    log(`✅ Schema dumped successfully to: ${path.relative(process.cwd(), outputFile)}`, colors.green);
    log(`📄 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`, colors.blue);
    
    // Also create a simplified version with just table definitions
    const simpleOutputFile = path.join(__dirname, '..', 'supabase', 'CURRENT_SCHEMA.md');
    
    // Extract just CREATE TABLE statements
    const tableMatches = schemaSQL.match(/CREATE TABLE[^;]+;/gs) || [];
    let simpleMarkdown = `# Current Database Tables\n\n`;
    simpleMarkdown += `> **Auto-generated:** ${timestamp}\n`;
    simpleMarkdown += `> **Note:** This is a simplified version. See DATABASE_SCHEMA.md for the complete schema.\n\n`;
    
    tableMatches.forEach(createStmt => {
      // Match table name, handling both "CREATE TABLE" and "CREATE TABLE IF NOT EXISTS"
      const tableNameMatch = createStmt.match(/CREATE TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:"public"\.|public\.)?(?:")?(\w+)(?:")?\s*\(/i);
      if (tableNameMatch) {
        const tableName = tableNameMatch[1];
        // Skip system tables
        if (tableName.startsWith('IF') || tableName.startsWith('NOT') || tableName.startsWith('EXISTS')) {
          return;
        }
        simpleMarkdown += `## Table: \`${tableName}\`\n\n`;
        simpleMarkdown += `\`\`\`sql\n${createStmt.trim()}\n\`\`\`\n\n`;
      }
    });
    
    fs.writeFileSync(simpleOutputFile, simpleMarkdown, 'utf-8');
    log(`✅ Simplified schema also saved to: ${path.relative(process.cwd(), simpleOutputFile)}`, colors.green);
    
  } catch (error) {
    log(`❌ Error dumping schema: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the schema dump
dumpSchema();

