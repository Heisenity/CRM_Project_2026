import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function addDemoUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { employeeId: 'xyzyyzy' }
    });

    if (existingUser) {
      console.log('Demo user already exists:', existingUser);
      return;
    }

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        name: 'Demo Employee',
        employeeId: 'xyzyyzy',
        email: 'demo@company.com',
        phone: '+1234567890',
        role: 'STAFF',
        status: 'ACTIVE'
      }
    });

    console.log('Demo user created successfully:', demoUser);
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoUser();