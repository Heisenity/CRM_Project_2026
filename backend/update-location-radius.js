// Script to update existing daily locations with appropriate radius values
// Run this after the geocoding fix to update existing records

import "dotenv/config";
import { PrismaClient } from './generated/prisma/index.js';
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
  ssl: false
});
const prisma = new PrismaClient({ adapter });

async function updateLocationRadius() {
  console.log('Updating daily location radius values...\n');
  
  try {
    // Find all daily locations with small radius (100m) that might need updating
    const locations = await prisma.dailyLocation.findMany({
      where: {
        radius: 100 // Find locations with the old hardcoded 100m radius
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${locations.length} locations with 100m radius to potentially update`);

    for (const location of locations) {
      // For locations in Barrackpore area or other areas where we use fallback coordinates,
      // increase the radius to be more practical
      let newRadius = 100; // Default
      
      const address = location.address?.toLowerCase() || '';
      const city = location.city?.toLowerCase() || '';
      
      // Check if this looks like a fallback coordinate location
      if (address.includes('barrackpore') || city.includes('barrackpore') ||
          address.includes('chakraborty para') || 
          address.includes('north 24 parganas') ||
          address.includes('kolkata')) {
        
        // Use larger radius for area-based locations
        if (address.includes('barrackpore') || address.includes('chakraborty para')) {
          newRadius = 2000; // 2km for Barrackpore area
        } else if (address.includes('kolkata')) {
          newRadius = 3000; // 3km for general Kolkata area
        } else {
          newRadius = 1500; // 1.5km for other areas
        }
        
        await prisma.dailyLocation.update({
          where: { id: location.id },
          data: { 
            radius: newRadius,
            updatedAt: new Date()
          }
        });
        
        console.log(`Updated location for ${location.employee.name} (${location.employee.employeeId}): ${location.address} - radius: ${100}m → ${newRadius}m`);
      }
    }
    
    console.log('\n✅ Daily location radius update completed');
    
  } catch (error) {
    console.error('❌ Error updating location radius:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLocationRadius();