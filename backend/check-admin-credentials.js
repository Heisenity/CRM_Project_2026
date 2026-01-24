const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

require('dotenv').config();

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
const prisma = new PrismaClient({ adapter });

async function checkAdminCredentials() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        adminId: true,
        email: true,
        name: true,
        status: true,
        createdAt: true
      }
    });

    console.log('\n🔍 Current Admin Accounts:');
    console.log('='.repeat(50));
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name}`);
        console.log(`   Admin ID: ${admin.adminId}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error checking admin credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminCredentials();