/**
 * Check Database Status
 * Shows count of records in each table
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabaseStatus() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 DATABASE STATUS')
  console.log('='.repeat(60) + '\n')

  try {
    const tables = [
      { name: 'Admins', fn: () => prisma.admin.count() },
      { name: 'Employees', fn: () => prisma.employee.count() },
      { name: 'Teams', fn: () => prisma.team.count() },
      { name: 'Customers', fn: () => prisma.customer.count() },
      { name: 'Projects', fn: () => prisma.project.count() },
      { name: 'Tenders', fn: () => prisma.tender.count() },
      { name: 'Tasks', fn: () => prisma.task.count() },
      { name: 'Vehicles', fn: () => prisma.vehicle.count() },
      { name: 'Attendance Records', fn: () => prisma.attendance.count() },
      { name: 'Attendance Sessions', fn: () => prisma.attendanceSession.count() },
      { name: 'Leave Applications', fn: () => prisma.leaveApplication.count() },
      { name: 'Products', fn: () => prisma.product.count() },
      { name: 'Barcodes', fn: () => prisma.barcode.count() },
      { name: 'Allocations', fn: () => prisma.allocation.count() },
      { name: 'Barcode Checkouts', fn: () => prisma.barcodeCheckout.count() },
      { name: 'Ticket Categories', fn: () => prisma.ticketCategory.count() },
      { name: 'Customer Support Requests', fn: () => prisma.customerSupportRequest.count() },
      { name: 'Meetings', fn: () => prisma.meeting.count() },
      { name: 'Customer Sessions', fn: () => prisma.customerSession.count() },
      { name: 'Employee ID Configs', fn: () => prisma.employeeIdConfig.count() },
      { name: 'Customer ID Configs', fn: () => prisma.customerIdConfig.count() },
      { name: 'Staff Feature Access', fn: () => prisma.staffFeatureAccess.count() },
    ]

    let totalRecords = 0
    let emptyTables = 0
    let nonEmptyTables = 0

    for (const table of tables) {
      try {
        const count = await table.fn()
        totalRecords += count
        
        if (count > 0) {
          console.log(`  ✓ ${table.name.padEnd(30)} ${count.toString().padStart(5)} records`)
          nonEmptyTables++
        } else {
          console.log(`  - ${table.name.padEnd(30)} ${count.toString().padStart(5)} records`)
          emptyTables++
        }
      } catch (error) {
        console.log(`  ⚠ ${table.name.padEnd(30)} Error: ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📊 Summary:`)
    console.log(`   Total Records: ${totalRecords}`)
    console.log(`   Non-Empty Tables: ${nonEmptyTables}`)
    console.log(`   Empty Tables: ${emptyTables}`)
    console.log('='.repeat(60) + '\n')

    if (totalRecords === 0) {
      console.log('✅ Database is completely empty!')
      console.log('\n💡 To set up initial data:')
      console.log('   1. Create admin: node scripts/seed-deployment-admin.js')
      console.log('   2. Create teams: npx ts-node prisma/seed-teams.ts')
      console.log('   3. Create employees through the UI\n')
    } else {
      console.log(`ℹ️  Database contains ${totalRecords} records\n`)
    }

  } catch (error) {
    console.error('\n❌ Error checking database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseStatus()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
