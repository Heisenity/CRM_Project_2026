import { prisma } from '../lib/prisma'

class PayslipIdGeneratorService {
  /**
   * Generate the next payslip ID
   * Format: MIS00001, MIS00002, etc.
   */
  async generatePayslipId(): Promise<string> {
    const prefix = 'MIS'
    
    // Get or create the config
    let config = await prisma.payslipIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      // Create initial config
      config = await prisma.payslipIdConfig.create({
        data: {
          prefix,
          nextSequence: 1,
          isActive: true
        }
      })
    }

    const payslipId = `${prefix}${config.nextSequence.toString().padStart(5, '0')}`

    // Increment the sequence for next time
    await prisma.payslipIdConfig.update({
      where: { prefix },
      data: {
        nextSequence: config.nextSequence + 1
      }
    })

    return payslipId
  }

  /**
   * Get the next payslip ID without incrementing (preview)
   */
  async getNextPayslipId(): Promise<string> {
    const prefix = 'MIS'
    
    let config = await prisma.payslipIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      config = await prisma.payslipIdConfig.create({
        data: {
          prefix,
          nextSequence: 1,
          isActive: true
        }
      })
    }

    return `${prefix}${config.nextSequence.toString().padStart(5, '0')}`
  }
}

export const payslipIdGeneratorService = new PayslipIdGeneratorService()
