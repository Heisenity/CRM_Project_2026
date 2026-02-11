import { Request, Response } from 'express'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { EmployeeIdGeneratorService } from '../../../services/employeeIdGenerator.service'
import { getDownloadUrl } from '../../../services/s3.service'

// Generate next employee ID
export const generateEmployeeId = async (): Promise<string> => {
  try {
    // Get the latest employee by employeeId
    const latestEmployee = await prisma.employee.findFirst({
      orderBy: {
        employeeId: 'desc'
      }
    })

    if (!latestEmployee) {
      return 'EMP001'
    }

    // Extract number from employeeId (e.g., EMP001 -> 001)
    const currentNumber = parseInt(latestEmployee.employeeId.replace('EMP', ''))
    const nextNumber = currentNumber + 1
    
    // Format with leading zeros (e.g., 2 -> 002)
    return `EMP${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating employee ID:', error)
    throw new Error('Failed to generate employee ID')
  }
}

// Get all employees
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', search, status, role } = req.query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 50
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { employeeId: { contains: search as string } },
        { email: { contains: search as string } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (role && (role === 'FIELD_ENGINEER' || role === 'IN_OFFICE')) {
      whereClause.role = role
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        phone: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        designation: true,
        isTeamLeader: true,
        role: true,
        status: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true,
        salary: true,
        address: true,
        aadharCard: true,
        panCard: true,
        uanNumber: true,
        esiNumber: true,
        bankAccountNumber: true,
        photoKey: true,
        createdAt: true,
        updatedAt: true,
        assignedBy: true
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.employee.count({
      where: whereClause
    })

    // Generate presigned URLs for employee photos
    const bucket = process.env.AWS_S3_EMPLOYEE_BUCKET!
    const region = process.env.AWS_REGION!
    const employeesWithPhoto = await Promise.all(employees.map(async (e) => {
      let photoUrl = null
      if (e.photoKey) {
        try {
          photoUrl = await getDownloadUrl(bucket, e.photoKey, 3600) // 1 hour
        } catch (err) {
          console.error('Presigned GET failed for employee', e.id, err)
        }
      }
      return {
        ...e,
        photoUrl
      }
    }))

    return res.status(200).json({
      success: true,
      data: {
        employees: employeesWithPhoto,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error getting employees:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get employees'
    })
  }
}

// Create new employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      teamId, 
      designation,
      isTeamLeader = false, 
      assignedBy, 
      password, 
      role = 'IN_OFFICE', 
      sickLeaveBalance = 12, 
      casualLeaveBalance = 12,
      salary,
      address,
      aadharCard,
      panCard,
      uanNumber,
      esiNumber,
      bankAccountNumber,
      photoKey,
      employeeId // Add this to accept custom employee ID
    } = req.body

    // Validate required fields
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name and password are required'
      })
    }

    // Validate role
    if (!['FIELD_ENGINEER', 'IN_OFFICE'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be FIELD_ENGINEER or IN_OFFICE'
      })
    }

    // Check if email already exists (only if email is provided)
    if (email) {
      const existingEmployee = await prisma.employee.findUnique({
        where: { email }
      })

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this email already exists'
        })
      }
    }

    // Check if Aadhar card already exists (if provided)
    if (aadharCard) {
      const existingAadhar = await prisma.employee.findUnique({
        where: { aadharCard }
      })

      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this Aadhar card already exists'
        })
      }
    }

    // Check if PAN card already exists (if provided)
    if (panCard) {
      const existingPan = await prisma.employee.findUnique({
        where: { panCard }
      })

      if (existingPan) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this PAN card already exists'
        })
      }
    }

    // Handle employee ID - either provided or auto-generated
    let finalEmployeeId: string
    
    if (employeeId) {
      // Custom employee ID provided - validate and auto-learn prefix
      const customPattern = /^([A-Z0-9]+)(\d{3})$/
      const match = employeeId.match(customPattern)
      
      if (!match) {
        return res.status(400).json({
          success: false,
          error: 'Invalid employee ID format. Use format like DEV001, HR001, FIELD001'
        })
      }
      
      const prefix = match[1]
      const number = parseInt(match[2], 10)
      
      // Check if employee ID already exists
      const existingEmployeeId = await prisma.employee.findUnique({
        where: { employeeId }
      })
      
      if (existingEmployeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID already exists'
        })
      }
      
      // Auto-learn: Create or update prefix config
      const existingConfig = await prisma.employeeIdConfig.findUnique({
        where: { prefix }
      })
      
      if (!existingConfig) {
        // New prefix - create it
        await prisma.employeeIdConfig.create({
          data: {
            prefix,
            nextSequence: number + 1,
            isActive: true,
            description: `Auto-learned from ${employeeId}`
          }
        })
        console.log(`✨ Auto-learned new prefix: ${prefix}`)
      } else {
        // Existing prefix - update sequence if needed
        if (number >= existingConfig.nextSequence) {
          await prisma.employeeIdConfig.update({
            where: { prefix },
            data: { nextSequence: number + 1 }
          })
          console.log(`📈 Updated ${prefix} sequence to ${number + 1}`)
        }
      }
      
      finalEmployeeId = employeeId
    } else {
      // No employee ID provided - generate one
      finalEmployeeId = await EmployeeIdGeneratorService.generateNextEmployeeId(role)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        name,
        employeeId: finalEmployeeId,
        email: email || null,
        password: hashedPassword,
        phone: phone || null,
        teamId: teamId || null,
        designation: designation || null, 
        isTeamLeader: Boolean(isTeamLeader),
        assignedBy: assignedBy || null,
        role: role,
        status: 'ACTIVE',
        sickLeaveBalance: parseInt(sickLeaveBalance) || 12,
        casualLeaveBalance: parseInt(casualLeaveBalance) || 12,
        salary: salary ? parseFloat(salary) : null,
        address: address || null,
        aadharCard: aadharCard || null,
        panCard: panCard || null,
        uanNumber: uanNumber || null,
        esiNumber: esiNumber || null,
        bankAccountNumber: bankAccountNumber || null,
        photoKey: photoKey || null
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        phone: true,
        teamId: true,
        designation: true,
        isTeamLeader: true,
        role: true,
        status: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true,
        salary: true,
        address: true,
        aadharCard: true,
        panCard: true,
        uanNumber: true,
        esiNumber: true,
        bankAccountNumber: true,
        photoKey: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    })
  } catch (error) {
    console.error('Error creating employee:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create employee'
    })
  }
}

// Update employee
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { 
      name, 
      email, 
      phone, 
      teamId, 
      designation,
      isTeamLeader, 
      status, 
      password, 
      sickLeaveBalance, 
      casualLeaveBalance,
      salary,
      address,
      aadharCard,
      panCard,
      uanNumber,
      esiNumber,
      bankAccountNumber,
      photoKey
    } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      })
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      })
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email }
      })

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this email already exists'
        })
      }
    }

    // Check if Aadhar card is being changed and if it already exists
    if (aadharCard && aadharCard !== existingEmployee.aadharCard) {
      const aadharExists = await prisma.employee.findUnique({
        where: { aadharCard }
      })

      if (aadharExists) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this Aadhar card already exists'
        })
      }
    }

    // Check if PAN card is being changed and if it already exists
    if (panCard && panCard !== existingEmployee.panCard) {
      const panExists = await prisma.employee.findUnique({
        where: { panCard }
      })

      if (panExists) {
        return res.status(400).json({
          success: false,
          error: 'Employee with this PAN card already exists'
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (teamId !== undefined) updateData.teamId = teamId
    if (designation !== undefined) {updateData.designation = designation}
    if (isTeamLeader !== undefined) updateData.isTeamLeader = Boolean(isTeamLeader)
    if (status) updateData.status = status
    if (sickLeaveBalance !== undefined) updateData.sickLeaveBalance = parseInt(sickLeaveBalance)
    if (casualLeaveBalance !== undefined) updateData.casualLeaveBalance = parseInt(casualLeaveBalance)
    if (salary !== undefined) updateData.salary = salary ? parseFloat(salary) : null
    if (address !== undefined) updateData.address = address
    if (aadharCard !== undefined) updateData.aadharCard = aadharCard
    if (panCard !== undefined) updateData.panCard = panCard
    if (uanNumber !== undefined) updateData.uanNumber = uanNumber
    if (esiNumber !== undefined) updateData.esiNumber = esiNumber
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber
    if (photoKey !== undefined) updateData.photoKey = photoKey
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        phone: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        designation: true,
        isTeamLeader: true,
        role: true,
        status: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true,
        salary: true,
        address: true,
        aadharCard: true,
        panCard: true,
        uanNumber: true,
        esiNumber: true,
        bankAccountNumber: true,
        photoKey: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update employee'
    })
  }
}

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      })
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      })
    }

    // Delete employee (this will cascade delete related records)
    await prisma.employee.delete({
      where: { id }
    })

    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete employee'
    })
  }
}

// Get employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      })
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        phone: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        designation: true,
        isTeamLeader: true,
        role: true,
        status: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true,
        salary: true,
        address: true,
        aadharCard: true,
        panCard: true,
        uanNumber: true,
        esiNumber: true,
        bankAccountNumber: true,
        createdAt: true,
        updatedAt: true,
        assignedBy: true
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error getting employee:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get employee'
    })
  }
}

// Get next employee ID (for preview)
export const getNextEmployeeId = async (req: Request, res: Response) => {
  try {
    const { role = 'IN_OFFICE' } = req.query
    
    // Validate role
    if (!['FIELD_ENGINEER', 'IN_OFFICE'].includes(role as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be FIELD_ENGINEER or IN_OFFICE'
      })
    }
    
    const nextId = await EmployeeIdGeneratorService.generateNextEmployeeId(role as 'FIELD_ENGINEER' | 'IN_OFFICE')
    
    return res.status(200).json({
      success: true,
      data: { nextEmployeeId: nextId, role: role }
    })
  } catch (error) {
    console.error('Error getting next employee ID:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next employee ID'
    })
  }
}

// Get employee by employeeId (not internal ID)
export const getEmployeeByEmployeeId = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      })
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        teamId: true,
        isTeamLeader: true,
        sickLeaveBalance: true,
        casualLeaveBalance: true,
        photoKey: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      })
    }

    // Generate presigned URL for employee photo if it exists
    let photoUrl = null
    if (employee.photoKey) {
      try {
        const bucket = process.env.AWS_S3_EMPLOYEE_BUCKET!
        const region = process.env.AWS_REGION!
        const { getDownloadUrl } = require('../../../services/s3.service')
        
        photoUrl = await getDownloadUrl(bucket, employee.photoKey, 3600) // 1 hour
      } catch (err) {
        console.error('Error generating presigned URL for employee photo:', err)
        // Continue without photo URL if there's an error
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...employee,
        photoUrl
      }
    })
  } catch (error) {
    console.error('Error getting employee by employeeId:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get employee'
    })
  }
}

// Get presigned URL for employee photo
export const getEmployeePhotoUrl = async (req: Request, res: Response) => {
  try {
    const { photoKey } = req.body

    if (!photoKey) {
      return res.status(400).json({
        success: false,
        error: 'Photo key is required'
      })
    }

    const bucket = process.env.AWS_S3_EMPLOYEE_BUCKET
    const region = process.env.AWS_REGION
    if (!bucket || !region) {
      return res.status(500).json({
        success: false,
        error: 'S3 bucket or region not configured'
      })
    }

    // Import getDownloadUrl from s3.service
    const { getDownloadUrl } = require('../../../services/s3.service')
    
    // Generate presigned URL for viewing (1 hour expiry)
    const photoUrl = await getDownloadUrl(bucket, photoKey, 3600)

    return res.status(200).json({
      success: true,
      photoUrl
    })
  } catch (error) {
    console.error('Error getting employee photo URL:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get photo URL'
    })
  }
}


// Get all available employee ID prefixes
export const getAvailablePrefixes = async (req: Request, res: Response) => {
  try {
    const prefixes = await EmployeeIdGeneratorService.getAvailablePrefixes()
    
    return res.status(200).json({
      success: true,
      data: prefixes
    })
  } catch (error) {
    console.error('Error getting available prefixes:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available prefixes'
    })
  }
}

// Add custom employee ID prefix
export const addCustomPrefix = async (req: Request, res: Response) => {
  try {
    const { prefix, description, roleType } = req.body

    if (!prefix) {
      return res.status(400).json({
        success: false,
        error: 'Prefix is required'
      })
    }

    await EmployeeIdGeneratorService.addCustomPrefix(prefix, description, roleType)
    
    return res.status(201).json({
      success: true,
      message: 'Prefix added successfully'
    })
  } catch (error) {
    console.error('Error adding custom prefix:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add custom prefix'
    })
  }
}

// Update employee ID prefix
export const updatePrefix = async (req: Request, res: Response) => {
  try {
    const { prefix } = req.params
    const { description, isActive, roleType } = req.body

    await EmployeeIdGeneratorService.updatePrefix(prefix, description, isActive, roleType)
    
    return res.status(200).json({
      success: true,
      message: 'Prefix updated successfully'
    })
  } catch (error) {
    console.error('Error updating prefix:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update prefix'
    })
  }
}

// Delete employee ID prefix
export const deletePrefix = async (req: Request, res: Response) => {
  try {
    const { prefix } = req.params

    await EmployeeIdGeneratorService.deletePrefix(prefix)
    
    return res.status(200).json({
      success: true,
      message: 'Prefix deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting prefix:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete prefix'
    })
  }
}

// Get next available employee IDs for a prefix (preview)
export const getNextAvailableIds = async (req: Request, res: Response) => {
  try {
    const { prefix, count = '5' } = req.query

    if (!prefix) {
      return res.status(400).json({
        success: false,
        error: 'Prefix is required'
      })
    }

    const ids = await EmployeeIdGeneratorService.getNextAvailableIds(
      prefix as string,
      parseInt(count as string)
    )
    
    return res.status(200).json({
      success: true,
      data: ids
    })
  } catch (error) {
    console.error('Error getting next available IDs:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next available IDs'
    })
  }
}

// Generate employee ID with custom prefix
export const generateEmployeeIdWithPrefix = async (req: Request, res: Response) => {
  try {
    const { prefix } = req.body

    if (!prefix) {
      return res.status(400).json({
        success: false,
        error: 'Prefix is required'
      })
    }

    const employeeId = await EmployeeIdGeneratorService.generateEmployeeIdWithPrefix(prefix)
    
    return res.status(200).json({
      success: true,
      data: { employeeId, prefix }
    })
  } catch (error) {
    console.error('Error generating employee ID with prefix:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate employee ID'
    })
  }
}

// Preview next employee ID for a prefix WITHOUT incrementing
export const previewNextEmployeeId = async (req: Request, res: Response) => {
  try {
    const { prefix } = req.params

    if (!prefix) {
      return res.status(400).json({
        success: false,
        error: 'Prefix is required'
      })
    }

    const nextId = await EmployeeIdGeneratorService.previewNextEmployeeId(prefix)
    
    return res.status(200).json({
      success: true,
      data: { nextId, prefix }
    })
  } catch (error) {
    console.error('Error previewing next employee ID:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview employee ID'
    })
  }
}
