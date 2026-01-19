#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚨 EMERGENCY DATABASE FIX');
console.log('=========================');

async function emergencyFix() {
  try {
    console.log('🔄 Step 1: Generating fresh Prisma client...');
    execSync('npx prisma generate --force', { stdio: 'inherit' });
    
    console.log('🔄 Step 2: Checking current migration status...');
    try {
      execSync('npx prisma migrate status', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️  Migration status unavailable, proceeding...');
    }
    
    console.log('🔄 Step 3: Applying all pending migrations...');
    execSync('npx prisma migrate deploy --force', { stdio: 'inherit' });
    
    console.log('🔄 Step 4: Pushing schema to ensure sync...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('✅ Emergency fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
    
    console.log('\n🔄 Attempting nuclear option: complete reset...');
    try {
      execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
      console.log('✅ Database reset completed!');
    } catch (resetError) {
      console.error('💥 Complete failure:', resetError.message);
      process.exit(1);
    }
  }
}

emergencyFix();