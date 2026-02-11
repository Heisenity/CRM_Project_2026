import { prisma } from '../lib/prisma'

export class EmployeeIdGeneratorService {
  /**
   * Get next sequence number for a given prefix
   * @param autoCreate - If true, creates the prefix if it doesn't exist (for auto-learning)
   */
  private static async getNextSequenceForPrefix(prefix: string, autoCreate: boolean = false): Promise<number> {
    // Get config for this prefix
    let config = await prisma.employeeIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      if (!autoCreate) {
        throw new Error(`Prefix ${prefix} does not exist. Please create it first.`)
      }
      
      // Create new config for this prefix (auto-learning)
      config = await prisma.employeeIdConfig.create({
        data: {
          prefix,
          nextSequence: 1,
          isActive: true,
          description: `Auto-learned from custom employee ID`
        }
      })
    }

    // Get the next sequence and increment it
    const nextSequence = config.nextSequence
    
    await prisma.employeeIdConfig.update({
      where: { prefix },
      data: { nextSequence: nextSequence + 1 }
    })

    return nextSequence
  }

  /**
   * Preview next employee ID for a prefix WITHOUT incrementing the sequence
   */
  static async previewNextEmployeeId(prefix: string): Promise<string> {
    // Get config for this prefix (DO NOT auto-create)
    const config = await prisma.employeeIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      throw new Error(`Prefix ${prefix} does not exist. Please create it first.`)
    }

    // Return the preview ID WITHOUT incrementing
    return `${prefix}${config.nextSequence.toString().padStart(3, '0')}`
  }

  /**
   * Generate employee ID with custom prefix
   * This is used when generating from prefix selector (no auto-create)
   */
  static async generateEmployeeIdWithPrefix(prefix: string): Promise<string> {
    // Get config for this prefix (DO NOT auto-create)
    const config = await prisma.employeeIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      throw new Error(`Prefix ${prefix} does not exist. Please create it first.`)
    }

    const sequence = await this.getNextSequenceForPrefix(prefix, false) // Don't auto-create
    return `${prefix}${sequence.toString().padStart(3, '0')}`
  }

  /**
   * Generate the next available employee ID based on role (backward compatible)
   * Field Engineers: FE001, FE002, etc.
   * In-Office Employees: IO001, IO002, etc.
   */
  static async generateNextEmployeeId(role: 'FIELD_ENGINEER' | 'IN_OFFICE' = 'FIELD_ENGINEER'): Promise<string> {
    const prefix = role === 'FIELD_ENGINEER' ? 'FE' : 'IO'
    return this.generateEmployeeIdWithPrefix(prefix)
  }

  /**
   * Get all available prefixes
   */
  static async getAvailablePrefixes(): Promise<Array<{ prefix: string; description: string | null; nextSequence: number; roleType: string }>> {
    const configs = await prisma.employeeIdConfig.findMany({
      where: { isActive: true },
      select: { 
        prefix: true,
        description: true,
        nextSequence: true,
        roleType: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    return configs
  }

  /**
   * Add a custom prefix
   */
  static async addCustomPrefix(prefix: string, description?: string, roleType: 'FIELD_ENGINEER' | 'IN_OFFICE' = 'IN_OFFICE'): Promise<void> {
    // Basic validation - just ensure it's not empty and is uppercase
    if (!prefix || prefix.trim().length === 0) {
      throw new Error('Prefix cannot be empty')
    }

    const trimmedPrefix = prefix.trim().toUpperCase()

    // Check if prefix already exists
    const existing = await prisma.employeeIdConfig.findUnique({
      where: { prefix: trimmedPrefix }
    })

    if (existing) {
      throw new Error('Prefix already exists')
    }

    await prisma.employeeIdConfig.create({
      data: {
        prefix: trimmedPrefix,
        nextSequence: 1,
        isActive: true,
        description,
        roleType
      }
    })
  }

  /**
   * Update prefix description
   */
  static async updatePrefix(prefix: string, description: string, isActive: boolean, roleType?: 'FIELD_ENGINEER' | 'IN_OFFICE'): Promise<void> {
    const updateData: any = { description, isActive }
    if (roleType) {
      updateData.roleType = roleType
    }
    
    await prisma.employeeIdConfig.update({
      where: { prefix },
      data: updateData
    })
  }

  /**
   * Delete a custom prefix (only if no employees use it)
   */
  static async deletePrefix(prefix: string): Promise<void> {
    // Check if any employees use this prefix
    const employeesWithPrefix = await prisma.employee.count({
      where: {
        employeeId: {
          startsWith: prefix
        }
      }
    })

    if (employeesWithPrefix > 0) {
      throw new Error(`Cannot delete prefix ${prefix}: ${employeesWithPrefix} employees are using it`)
    }

    await prisma.employeeIdConfig.delete({
      where: { prefix }
    })
  }

  /**
   * Check if an employee ID is available
   */
  static async isEmployeeIdAvailable(employeeId: string): Promise<boolean> {
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    })

    return !existingEmployee
  }

  /**
   * Validate employee ID format
   */
  static validateEmployeeIdFormat(employeeId: string): boolean {
    // Format: Any uppercase letters/numbers followed by 3 digits
    return /^[A-Z0-9]+\d{3}$/.test(employeeId)
  }

  /**
   * Get the next few available employee IDs for a specific prefix (for preview)
   */
  static async getNextAvailableIds(prefix: string, count: number = 5): Promise<string[]> {
    const config = await prisma.employeeIdConfig.findUnique({
      where: { prefix }
    })

    if (!config) {
      throw new Error(`Prefix ${prefix} not found`)
    }

    const ids: string[] = []
    for (let i = 0; i < count; i++) {
      const number = config.nextSequence + i
      ids.push(`${prefix}${number.toString().padStart(3, '0')}`)
    }

    return ids
  }
}
