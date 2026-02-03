/**
 * Manual Admin Creation Script
 * Run this script manually if automatic seeding fails
 * Usage: node create-admin-manual.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🚀 Creating admin account manually...');
    
    // Admin credentials
    const adminData = {
      adminId: 'ADMIN001',
      name: 'System Administrator',
      email: 'admin@mediainfotech.org',
      password: 'Admin@123',
      phone: null,
      status: 'ACTIVE'
    };
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: adminData.email },
          { adminId: adminData.adminId }
        ]
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists, updating password...');
      
      // Update existing admin
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      
      const updatedAdmin = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminData.name,
          email: adminData.email,
          adminId: adminData.adminId,
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ Admin updated successfully!');
      console.log('📧 Email:', updatedAdmin.email);
      console.log('👤 Admin ID:', updatedAdmin.adminId);
      console.log('🔒 Password: Admin@123');
      
    } else {
      console.log('📝 Creating new admin account...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      
      // Create new admin
      const admin = await prisma.admin.create({
        data: {
          ...adminData,
          password: hashedPassword
        }
      });
      
      console.log('✅ Admin created successfully!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Admin ID:', admin.adminId);
      console.log('🔒 Password: Admin@123');
    }
    
    console.log('\n🌐 Login URL: [YOUR_FRONTEND_URL]/admin-login');
    console.log('\n⚠️  Remember to change these credentials after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    
    // More detailed error information
    if (error.code === 'P2002') {
      console.error('💡 Unique constraint violation - admin might already exist');
    } else if (error.code === 'P1001') {
      console.error('💡 Database connection failed - check your DATABASE_URL');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('🎉 Admin creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdmin };