import { Router } from 'express'
import { getPayrollRecords, generatePayslip, updatePayrollRecord, sendPayslip } from './payroll.controller'
import { authenticateToken } from '../../../middleware/auth.middleware'
import { adminOnly } from '../../../middleware/adminOnly.middleware'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Admin only routes
// Allow admins or HR_CENTER staff to manage payslips
import { hrCenterOrAdmin } from '../../../middleware/hrCenterOrAdmin.middleware'
router.get('/', hrCenterOrAdmin, getPayrollRecords)
router.post('/generate', hrCenterOrAdmin, generatePayslip)
router.put('/:id', hrCenterOrAdmin, updatePayrollRecord)
router.post('/:id/send', hrCenterOrAdmin, sendPayslip)

export default router