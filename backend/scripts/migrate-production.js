#!/usr/bin/env node

/**
 * Production Database Migration Script
 * 
 * This script applies Prisma migrations to the production database.
 * Run this on Render or any production environment to ensure the database schema is up to date.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting production database migration...');

try {
  // Change to the backend directory
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📁 Current directory:', process.cwd());
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log('🔗 Database URL found');
  
  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Apply migrations
  console.log('📊 Applying database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Optional: Seed the database if needed
  // console.log('🌱 Seeding database...');
  // execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('✅ Production database migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}