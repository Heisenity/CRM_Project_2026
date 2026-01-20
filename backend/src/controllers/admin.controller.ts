import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// Get all admins
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', search, status } = req.query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 50
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { adminId: { contains: search as string } },
        { email: { contains: search as string } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    const admins = await prisma.admin.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        adminId: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.admin.count({
      where: whereClause
    })

    return res.status(200).json({
      success: true,
      data: admins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    })
  } catch (error) {
    console.error('Error getting admins:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get admins'
    })
  }
}

// Get admin by ID
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required'
      })
    }

    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        adminId: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: admin
    })
  } catch (error) {
    console.error('Error getting admin:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get admin'
    })
  }
}

// Update admin
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, email, phone, status } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required'
      })
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id }
    })

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      })
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingAdmin.email) {
      const emailExists = await prisma.admin.findUnique({
        where: { email }
      })

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Admin with this email already exists'
        })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (status) updateData.status = status

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        adminId: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: updatedAdmin
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update admin'
    })
  }
}