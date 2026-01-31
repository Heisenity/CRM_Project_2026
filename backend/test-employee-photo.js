// Test script to add a photo URL to an existing employee
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEmployeePhoto() {
  try {
    // Find the first employee
    const employee = await prisma.employee.findFirst()
    
    if (!employee) {
      console.log('No employees found')
      return
    }
    
    console.log('Found employee:', employee.name, employee.employeeId)
    
    // Update with a test photo URL (using a sample image)
    const testPhotoUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: { photoUrl: testPhotoUrl },
      select: {
        id: true,
        name: true,
        employeeId: true,
        photoUrl: true
      }
    })
    
    console.log('Updated employee with photo:', updatedEmployee)
    console.log('Photo URL set to:', updatedEmployee.photoUrl)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmployeePhoto()