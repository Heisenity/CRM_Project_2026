#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('💥 NUCLEAR DATABASE FIX - COMPLETE RESET');
console.log('=========================================');
console.log('⚠️  WARNING: This will reset the entire database!');

function executeCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - SUCCESS`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FAILED:`, error.message);
    return false;
  }
}

async function nuclearFix() {
  console.log('\n🚀 Starting nuclear database fix...\n');
  
  // Step 1: Generate fresh client
  executeCommand('npx prisma generate', 'Generating fresh Prisma client');
  
  // Step 2: Nuclear option - complete reset
  console.log('\n💥 EXECUTING NUCLEAR RESET...');
  if (executeCommand('npx prisma migrate reset --force --skip-seed', 'Complete database reset')) {
    console.log('✅ Nuclear reset successful!');
  } else {
    console.log('⚠️  Nuclear reset failed, trying alternative...');
    
    // Alternative: Force push schema
    if (executeCommand('npx prisma db push --force-reset', 'Force schema push')) {
      console.log('✅ Force schema push successful!');
    } else {
      console.error('💥 All methods failed!');
      process.exit(1);
    }
  }
  
  // Step 3: Final generation
  executeCommand('npx prisma generate', 'Final client generation');
  
  console.log('\n🎉 NUCLEAR FIX COMPLETED!');
  console.log('📝 Database has been completely reset and synced with current schema.');
}

nuclearFix().catch(error => {
  console.error('💥 Nuclear fix script failed:', error);
  process.exit(1);
});