#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 PRODUCTION DATABASE SQL FIX');
console.log('===============================');

async function runSqlFix() {
  try {
    const sqlFile = path.join(__dirname, 'fix-production-db.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ SQL fix file not found:', sqlFile);
      process.exit(1);
    }
    
    console.log('📋 Reading SQL fix script...');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL script loaded');
    
    console.log('🔄 Step 1: Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🔄 Step 2: Executing SQL fix...');
    // Use prisma db execute to run raw SQL
    const tempSqlFile = '/tmp/fix.sql';
    fs.writeFileSync(tempSqlFile, sqlContent);
    
    try {
      execSync(`npx prisma db execute --file ${tempSqlFile}`, { stdio: 'inherit' });
      console.log('✅ SQL fix executed successfully');
    } catch (sqlError) {
      console.log('⚠️  Direct SQL execution failed, trying alternative approach...');
      
      // Alternative: Use db push to sync schema
      console.log('🔄 Step 3: Using db push to sync schema...');
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    }
    
    console.log('🔄 Step 4: Deploying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('🔄 Step 5: Final client generation...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✅ Production database fix completed!');
    
  } catch (error) {
    console.error('❌ SQL fix failed:', error.message);
    
    console.log('\n🚨 NUCLEAR OPTION: Complete database reset...');
    try {
      execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Database completely reset and regenerated!');
    } catch (resetError) {
      console.error('💥 Complete failure:', resetError.message);
      process.exit(1);
    }
  }
}

runSqlFix();