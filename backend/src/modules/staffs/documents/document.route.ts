import { Router } from 'express'
import { DocumentController } from './document.controller'
import { authenticateToken } from '../../../middleware/auth.middleware'
import { hrCenterOrAdmin } from '../../../middleware/hrCenterOrAdmin.middleware'

const router = Router()
const documentController = new DocumentController()

// Auth for all routes
router.use(authenticateToken)

// Admin / HR
router.get('/all', hrCenterOrAdmin, documentController.getAllDocuments)
router.delete('/:documentId', hrCenterOrAdmin, documentController.deleteDocument)

// ✅ PRESIGNED UPLOAD URL
router.post('/presigned-upload', hrCenterOrAdmin, documentController.getPresignedUploadUrl)

// ✅ SAVE METADATA (frontend POST /documents)
router.post('/', hrCenterOrAdmin, documentController.createDocument)

// Employee access
router.get('/employee/:employeeId', documentController.getEmployeeDocuments)
router.get('/download/:documentId', documentController.downloadDocument)

export default router
