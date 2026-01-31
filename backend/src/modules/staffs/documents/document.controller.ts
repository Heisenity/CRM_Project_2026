import { Request, Response } from 'express'
import { DocumentService } from './document.service'
import { CreateDocumentRequest } from './document.types'
import { getEmployeeDocumentUploadUrl } from '@/services/s3.service'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/services/s3.service'


export class DocumentController {
  private documentService: DocumentService

  constructor() {
    this.documentService = new DocumentService()
  }

  // Upload document
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const {
        employeeId,
        title,
        description,
        uploadedBy,
        fileName,
        filePath,
        fileSize,
        mimeType,
      } = req.body

      // ✅ Validate required metadata (NO file)
      if (!employeeId || !title || !uploadedBy || !fileName || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        })
      }

      const requestData: CreateDocumentRequest = {
        employeeId,
        title: title.trim(),
        description: description?.trim(),
        fileName,
        filePath,
        fileSize,
        mimeType,
        uploadedBy,
      }

      const result = await this.documentService.createDocument(requestData)

      if (result.success) {
        return res.status(201).json(result)
      } else {
        return res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }


  createDocument = async (req: Request, res: Response) => {
    const {
      employeeId,
      title,
      description,
      uploadedBy,
      fileName,
      filePath,
      fileSize,
      mimeType,
    } = req.body

    if (!employeeId || !title || !fileName || !filePath) {
      return res.status(400).json({ success: false, error: 'Missing fields' })
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId }
    })

    if (!employee) {
      return res.status(400).json({
        success: false,
        error: 'Employee not found'
      })
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        title,
        description,
        uploadedBy,
        fileName,
        filePath,
        fileSize,
        mimeType,
      }
    })

    res.json({ success: true, data: document })
  }

  // Get employee documents
  getEmployeeDocuments = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID is required'
        })
      }

      const result = await this.documentService.getEmployeeDocuments(employeeId)

      if (result.success) {
        return res.status(200).json(result)
      } else {
        return res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error in getEmployeeDocuments:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Get all documents (admin)
  getAllDocuments = async (req: Request, res: Response) => {
    try {
      const result = await this.documentService.getAllDocuments()

      if (result.success) {
        return res.status(200).json(result)
      } else {
        return res.status(500).json(result)
      }
    } catch (error) {
      console.error('Error in getAllDocuments:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Download document
  downloadDocument = async (req: Request, res: Response) => {
    const { documentId } = req.params

    const doc = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
    })

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Not found' })
    }

    const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET!

    const signedUrl = await getDownloadUrl(bucket, doc.filePath, 60)

    res.json({
      success: true,
      data: { url: signedUrl }
    })
  }

  // Delete document (admin only)
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: 'Document ID is required'
        })
      }

      const result = await this.documentService.deleteDocument(documentId)

      if (result.success) {
        return res.status(200).json(result)
      } else {
        return res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in deleteDocument:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  getPresignedUploadUrl = async (req: Request, res: Response) => {
    const { fileName, fileType, employeeId } = req.body

    if (!fileName || !fileType || !employeeId) {
      return res.status(400).json({ success: false, error: 'Missing fields' })
    }

    const { uploadUrl, fileUrl } =
      await getEmployeeDocumentUploadUrl(fileName, fileType, employeeId)

    res.json({
      success: true,
      data: { uploadUrl, fileUrl }
    })
  }

}

