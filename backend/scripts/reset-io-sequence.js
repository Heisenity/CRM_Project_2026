/**
 * Reset IO Sequence to 1
 * WARNING: Only use this if you've deleted all IO employees
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetIOSequence() {
  console.log('\n⚠️  WARNING: Resetting IO sequence to 1')
  console.log('This should only be done if you have NO employees with IO prefix!\n')

  try {
    // Check for existing IO employees
    const ioEmployees = await prisma.employee.count({
      where: {
        employeeId: {
          startsWith: 'IO'
        }
      }
    })

    if (ioEmployees > 0) {
      console.log(`❌ ERROR: Found ${ioEmployees} employees with IO prefix`)
      console.log('Cannot reset sequence while employees exist.')
      console.log('\nOptions:')
      console.log('1. Delete all IO employees first')
      console.log('2. Use a different prefix for new employees')
      console.log('3. Keep the current sequence\n')
      return
    }

    // Reset the sequence
    await prisma.employeeIdConfig.update({
      where: { prefix: 'IO' },
      data: { nextSequence: 1 }
    })

    console.log('✅ IO sequence reset to 1')
    console.log('Next employee will be: IO001\n')

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetIOSequence()
