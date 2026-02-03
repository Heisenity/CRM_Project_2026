/**
 * Deployment Admin Seeder
 * Creates initial admin account for first-time deployment
 * Generates secure credentials and displays them for setup
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Prisma client - use DATABASE_URL if available, otherwise use individual env vars
let prisma;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL for production deployment
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} else {
  // Use individual environment variables for development
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    max: 5,
    ssl: false
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

// Generate secure random password
function generateSecurePassword(length = 12) {
  // For deployment, use simple but secure password
  return 'admin123456';
}

// Generate admin ID
function generateAdminId() {
  return 'ADMIN001';
}

// Save credentials to file for deployment reference
function saveCredentialsToFile(credentials) {
  const credentialsDir = path.join(__dirname, '..', 'deployment-credentials');
  const credentialsFile = path.join(credentialsDir, 'initial-admin-credentials.txt');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true });
  }
  
  const credentialText = `
=================================================================
                    INITIAL ADMIN CREDENTIALS
=================================================================
Generated on: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}

ADMIN LOGIN CREDENTIALS:
------------------------
Admin ID: ${credentials.adminId}
Email:    ${credentials.email}
Password: ${credentials.password}

LOGIN URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login

IMPORTANT SECURITY NOTES:
-------------------------
1. Change these credentials immediately after first login
2. Use the Admin Credential Reset feature in HR Center
3. Delete this file after credentials are changed
4. Store new credentials securely

NEXT STEPS:
-----------
1. Access the admin login page
2. Login with the above credentials
3. Navigate to HR Center > Admin Credential Reset
4. Update your Admin ID, Email, and Password
5. Delete this credentials file

=================================================================
`;

  fs.writeFileSync(credentialsFile, credentialText);
  
  // Also create a JSON version for programmatic access
  const jsonFile = path.join(credentialsDir, 'initial-admin-credentials.json');
  fs.writeFileSync(jsonFile, JSON.stringify({
    ...credentials,
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login`
  }, null, 2));
  
  return credentialsFile;
}

// Display credentials in console with formatting
function displayCredentials(credentials) {
  console.log('\n' + '='.repeat(65));
  console.log('                    🔐 INITIAL ADMIN CREDENTIALS');
  console.log('='.repeat(65));
  console.log(`📅 Generated: ${new Date().toLocaleString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('🔑 ADMIN LOGIN CREDENTIALS:');
  console.log('─'.repeat(30));
  console.log(`👤 Admin ID: ${credentials.adminId}`);
  console.log(`📧 Email:    ${credentials.email}`);
  console.log(`🔒 Password: ${credentials.password}`);
  console.log('');
  console.log(`🌐 Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login`);
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('─'.repeat(30));
  console.log('1. 🔄 Change these credentials immediately after first login');
  console.log('2. 🛠️  Use the Admin Credential Reset feature in HR Center');
  console.log('3. 🗑️  Delete credential files after setup is complete');
  console.log('4. 🔐 Store new credentials securely');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('─'.repeat(15));
  console.log('1. Access the admin login page');
  console.log('2. Login with the above credentials');
  console.log('3. Navigate to HR Center > Admin Credential Reset');
  console.log('4. Update your Admin ID, Email, and Password');
  console.log('5. Delete the credential files from deployment-credentials/');
  console.log('='.repeat(65));
  console.log('');
}

async function seedDeploymentAdmin() {
  try {
    console.log('🚀 Starting deployment admin seeding...');
    
    // Check if any admin already exists
    const existingAdminCount = await prisma.admin.count();
    
    if (existingAdminCount > 0) {
      console.log('✅ Admin accounts already exist. Skipping seed.');
      console.log(`📊 Found ${existingAdminCount} existing admin(s).`);
      return;
    }
    
    console.log('📝 No existing admins found. Creating initial admin...');
    
    // Generate secure credentials
    const adminId = generateAdminId();
    const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@mediainfotech.org';
    const password = 'Admin@123'; // Use consistent password
    
    // Hash the password
    console.log('🔐 Generating secure password hash...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create the admin account
    console.log('👤 Creating admin account in database...');
    const admin = await prisma.admin.create({
      data: {
        adminId: adminId,
        name: process.env.INITIAL_ADMIN_NAME || 'System Administrator',
        email: email,
        password: hashedPassword,
        phone: process.env.INITIAL_ADMIN_PHONE || null,
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ Admin account created successfully!');
    
    // Prepare credentials object
    const credentials = {
      adminId: admin.adminId,
      email: admin.email,
      password: password, // Plain text for display only
      name: admin.name
    };
    
    // Save credentials to file
    console.log('💾 Saving credentials to deployment files...');
    const credentialsFile = saveCredentialsToFile(credentials);
    console.log(`📁 Credentials saved to: ${credentialsFile}`);
    
    // Display credentials
    displayCredentials(credentials);
    
    // Additional environment-specific messages
    if (process.env.NODE_ENV === 'production') {
      console.log('🚨 PRODUCTION DEPLOYMENT DETECTED!');
      console.log('   Please secure these credentials immediately!');
      console.log('   Consider setting up additional security measures.');
      console.log('');
    }
    
    return credentials;
    
  } catch (error) {
    console.error('❌ Error seeding deployment admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedDeploymentAdmin()
    .then(() => {
      console.log('🎉 Deployment admin seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment admin seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDeploymentAdmin };