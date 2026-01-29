import { Router } from 'express'
import { getAllAdmins, getAdminById, updateAdmin, resetAdminCredentials } from '../controllers/admin.controller'
import { authenticateToken } from '../middleware/auth.middleware'
import { adminOnly } from '../middleware/adminOnly.middleware'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Apply admin-only middleware to sensitive admin routes
// For some routes we allow admins OR HR_CENTER staff (see individual routes)

// Get all admins (admin or HR_CENTER)
import { hrCenterOrAdmin } from '../middleware/hrCenterOrAdmin.middleware'
router.get('/', hrCenterOrAdmin, getAllAdmins)

// Get admin by ID (admin only)
router.get('/:id', adminOnly, getAdminById)

// Update admin (admin only)
router.put('/:id', adminOnly, updateAdmin)

// Reset admin credentials (admin or HR_CENTER)
router.put('/:id/reset-credentials', hrCenterOrAdmin, resetAdminCredentials)

export default router