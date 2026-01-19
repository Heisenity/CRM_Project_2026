import { Router } from 'express'
import { TicketUploadController } from './upload.controller'
import { authenticateToken } from '../../middleware/auth.middleware'

const router = Router()
const uploadController = new TicketUploadController()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Upload file for ticket
router.post('/upload', (req, res, next) => {
  console.log('=== UPLOAD ROUTE HIT ===')
  console.log('Headers:', req.headers)
  console.log('User:', (req as any).user)
  
  uploadController.uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err)
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      })
    }
    next()
  })
}, uploadController.uploadFile)

// Download file
router.get('/download/:filename', uploadController.downloadFile)

export { router as ticketUploadRouter }