/**
 * Test Deployment Admin Seeding
 * Verifies that the admin seeding process works correctly
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

async function testDeploymentAdminSeed() {
  try {
    console.log('🧪 Testing deployment admin seeding...');
    
    // Clear any existing admins for testing
    console.log('🧹 Clearing existing admins for test...');
    await prisma.admin.deleteMany({});
    
    // Import and run the seeder
    const { seedDeploymentAdmin } = require('./scripts/seed-deployment-admin.js');
    
    console.log('🚀 Running deployment admin seeder...');
    const credentials = await seedDeploymentAdmin();
    
    if (!credentials) {
      throw new Error('No credentials returned from seeder');
    }
    
    console.log('✅ Seeder completed successfully');
    
    // Verify admin was created in database
    console.log('🔍 Verifying admin in database...');
    const admin = await prisma.admin.findUnique({
      where: { adminId: credentials.adminId }
    });
    
    if (!admin) {
      throw new Error('Admin not found in database');
    }
    
    console.log('✅ Admin found in database');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Admin ID: ${admin.adminId}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Status: ${admin.status}`);
    
    // Verify password hash
    console.log('🔐 Verifying password hash...');
    const isValidPassword = await bcrypt.compare(credentials.password, admin.password);
    
    if (!isValidPassword) {
      throw new Error('Password verification failed');
    }
    
    console.log('✅ Password hash verified');
    
    // Verify credential files were created
    console.log('📁 Verifying credential files...');
    const credentialsDir = path.join(__dirname, 'deployment-credentials');
    const txtFile = path.join(credentialsDir, 'initial-admin-credentials.txt');
    const jsonFile = path.join(credentialsDir, 'initial-admin-credentials.json');
    
    if (!fs.existsSync(txtFile)) {
      throw new Error('Credentials TXT file not created');
    }
    
    if (!fs.existsSync(jsonFile)) {
      throw new Error('Credentials JSON file not created');
    }
    
    console.log('✅ Credential files created successfully');
    
    // Verify JSON file content
    const jsonContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    if (jsonContent.adminId !== credentials.adminId) {
      throw new Error('JSON file admin ID mismatch');
    }
    
    if (jsonContent.email !== credentials.email) {
      throw new Error('JSON file email mismatch');
    }
    
    console.log('✅ JSON file content verified');
    
    // Test duplicate prevention
    console.log('🔄 Testing duplicate admin prevention...');
    const secondResult = await seedDeploymentAdmin();
    
    if (secondResult !== null) {
      throw new Error('Seeder should have skipped duplicate admin creation');
    }
    
    console.log('✅ Duplicate prevention working correctly');
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await prisma.admin.deleteMany({});
    
    if (fs.existsSync(credentialsDir)) {
      fs.rmSync(credentialsDir, { recursive: true, force: true });
    }
    
    console.log('✅ Test cleanup completed');
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Admin seeding functionality');
    console.log('✅ Database admin creation');
    console.log('✅ Password hashing and verification');
    console.log('✅ Credential file generation');
    console.log('✅ JSON file content accuracy');
    console.log('✅ Duplicate prevention');
    console.log('✅ Test cleanup');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDeploymentAdminSeed()
  .then(() => {
    console.log('\n🎉 Deployment admin seeding test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment admin seeding test failed:', error);
    process.exit(1);
  });