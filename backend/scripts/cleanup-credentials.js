/**
 * Cleanup Deployment Credentials
 * Safely removes credential files after admin setup is complete
 */

const fs = require('fs');
const path = require('path');

function cleanupCredentials() {
  const credentialsDir = path.join(__dirname, '..', 'deployment-credentials');
  
  try {
    if (fs.existsSync(credentialsDir)) {
      // List files before deletion
      const files = fs.readdirSync(credentialsDir);
      console.log('🗑️  Cleaning up deployment credentials...');
      console.log(`📁 Found ${files.length} credential file(s):`);
      
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
      
      // Remove the entire directory
      fs.rmSync(credentialsDir, { recursive: true, force: true });
      
      console.log('✅ Credential files cleaned up successfully!');
      console.log('🔐 Make sure you have saved your new admin credentials securely.');
    } else {
      console.log('ℹ️  No credential files found to clean up.');
    }
  } catch (error) {
    console.error('❌ Error cleaning up credentials:', error);
    process.exit(1);
  }
}

// Confirmation prompt
function promptConfirmation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('⚠️  WARNING: This will permanently delete deployment credential files!');
  console.log('   Make sure you have:');
  console.log('   1. ✅ Successfully logged in with the generated credentials');
  console.log('   2. ✅ Changed your admin credentials using HR Center');
  console.log('   3. ✅ Saved your new credentials securely');
  console.log('');

  rl.question('Are you sure you want to delete the credential files? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      cleanupCredentials();
    } else {
      console.log('❌ Cleanup cancelled. Credential files preserved.');
    }
    rl.close();
  });
}

// Check if running with --force flag
if (process.argv.includes('--force')) {
  console.log('🚀 Force cleanup mode - skipping confirmation...');
  cleanupCredentials();
} else {
  promptConfirmation();
}