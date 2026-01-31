import { Router } from 'express'
import { authenticateToken } from '../../middleware/auth.middleware'
import { getPresignedUploadUrl } from './uplaod.controller'

const router = Router()

router.use(authenticateToken)

// POST /uploads/presigned-url
router.post('/presigned-url', getPresignedUploadUrl)

export default router
