import { Router } from 'express'
import { DocumentController } from './document.controller'
import { authenticateToken } from '../../../middleware/auth.middleware'
import { adminOnly } from '../../../middleware/adminOnly.middleware'
import { prisma } from '../../../lib/prisma'

const router = Router()
const documentController = new DocumentController()

// Apply authentication to all routes
router.use(authenticateToken)

// Get all documents (admin or HR_CENTER staff)
import { hrCenterOrAdmin } from '../../../middleware/hrCenterOrAdmin.middleware'
router.get('/all', hrCenterOrAdmin, documentController.getAllDocuments)

// Debug endpoint to check all documents (temporary)
router.get('/debug/all', async (req, res) => {
  try {
    const documents = await prisma.employeeDocument.findMany({
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        employeeUUID: doc.employeeId,
        employeeStringId: doc.employee.employeeId,
        employeeName: doc.employee.name,
        createdAt: doc.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

// Upload document (authenticated users)
router.post('/upload', documentController.uploadMiddleware, documentController.uploadDocument)

router.delete('/:documentId', hrCenterOrAdmin, documentController.deleteDocument)

// Employee routes (authenticated employees can access their own documents)
router.get('/employee/:employeeId', documentController.getEmployeeDocuments)
router.get('/download/:documentId', documentController.downloadDocument)

export default router