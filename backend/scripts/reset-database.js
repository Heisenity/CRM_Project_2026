/**
 * Reset Database - Delete All Data
 * 
 * This script deletes all data from the database while preserving the schema.
 * Use with caution!
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('\n' + '='.repeat(60))
  console.log('⚠️  DATABASE RESET - DELETE ALL DATA')
  console.log('='.repeat(60))
  console.log('\n⚠️  WARNING: This will delete ALL data from the database!')
  console.log('⚠️  The database schema will be preserved.\n')

  try {
    console.log('🗑️  Starting database cleanup...\n')

    // Delete in order to respect foreign key constraints
    const deletions = [
      { name: 'Customer Sessions', fn: () => prisma.customerSession.deleteMany() },
      { name: 'Admin Sessions', fn: () => prisma.adminSession.deleteMany() },
      { name: 'Employee Sessions', fn: () => prisma.employeeSession.deleteMany() },
      { name: 'Notifications', fn: () => prisma.notification.deleteMany() },
      { name: 'Meeting Participants', fn: () => prisma.meetingParticipant.deleteMany() },
      { name: 'Meetings', fn: () => prisma.meeting.deleteMany() },
      { name: 'Calendly Integrations', fn: () => prisma.calendlyIntegration.deleteMany() },
      { name: 'Customer Support Requests', fn: () => prisma.customerSupportRequest.deleteMany() },
      { name: 'Tickets', fn: () => prisma.ticket.deleteMany() },
      { name: 'Ticket Categories', fn: () => prisma.ticketCategory.deleteMany() },
      { name: 'Barcode Checkouts', fn: () => prisma.barcodeCheckout.deleteMany() },
      { name: 'Barcodes', fn: () => prisma.barcode.deleteMany() },
      { name: 'Allocations', fn: () => prisma.allocation.deleteMany() },
      { name: 'Products', fn: () => prisma.product.deleteMany() },
      { name: 'Payrolls', fn: () => prisma.payroll.deleteMany() },
      { name: 'Leave Applications', fn: () => prisma.leaveApplication.deleteMany() },
      { name: 'Documents', fn: () => prisma.document.deleteMany() },
      { name: 'Attendance Sessions', fn: () => prisma.attendanceSession.deleteMany() },
      { name: 'Attendance Records', fn: () => prisma.attendance.deleteMany() },
      { name: 'Task Assignments', fn: () => prisma.taskAssignment.deleteMany() },
      { name: 'Tasks', fn: () => prisma.task.deleteMany() },
      { name: 'Vehicle Assignments', fn: () => prisma.vehicleAssignment.deleteMany() },
      { name: 'Vehicles', fn: () => prisma.vehicle.deleteMany() },
      { name: 'Employees', fn: () => prisma.employee.deleteMany() },
      { name: 'Teams', fn: () => prisma.team.deleteMany() },
      { name: 'Staff Feature Access', fn: () => prisma.staffFeatureAccess.deleteMany() },
      { name: 'Tender Documents', fn: () => prisma.tenderDocument.deleteMany() },
      { name: 'Tender EMDs', fn: () => prisma.tenderEMD.deleteMany() },
      { name: 'Tenders', fn: () => prisma.tender.deleteMany() },
      { name: 'Projects', fn: () => prisma.project.deleteMany() },
      { name: 'Customers', fn: () => prisma.customer.deleteMany() },
      { name: 'Customer ID Configs', fn: () => prisma.customerIdConfig.deleteMany() },
      { name: 'Employee ID Configs', fn: () => prisma.employeeIdConfig.deleteMany() },
      { name: 'System Configs', fn: () => prisma.systemConfig.deleteMany() },
      { name: 'Admins', fn: () => prisma.admin.deleteMany() },
    ]

    let totalDeleted = 0

    for (const deletion of deletions) {
      try {
        const result = await deletion.fn()
        const count = result.count || 0
        if (count > 0) {
          console.log(`  ✓ Deleted ${count.toString().padStart(4)} ${deletion.name}`)
          totalDeleted += count
        } else {
          console.log(`  - No ${deletion.name} to delete`)
        }
      } catch (error) {
        console.log(`  ⚠ Error deleting ${deletion.name}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Database reset complete!`)
    console.log(`📊 Total records deleted: ${totalDeleted}`)
    console.log('='.repeat(60))
    console.log('\n💡 Next steps:')
    console.log('   1. Run seed scripts to create initial data')
    console.log('   2. Create admin user: node scripts/seed-deployment-admin.js')
    console.log('   3. Create teams: npx ts-node prisma/seed-teams.ts')
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Error resetting database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Confirmation prompt
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Are you sure you want to delete ALL data? Type "YES" to confirm: ', (answer) => {
  if (answer === 'YES') {
    rl.close()
    resetDatabase()
      .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
      })
  } else {
    console.log('\n❌ Database reset cancelled.')
    rl.close()
    process.exit(0)
  }
})
