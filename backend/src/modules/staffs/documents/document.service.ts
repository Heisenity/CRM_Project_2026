import { prisma } from '../../../lib/prisma'
import {
  EmployeeDocument,
  DocumentResponse,
  DocumentsResponse
} from './document.types'
import { getDownloadUrl, deleteFileFromS3 } from '@/services/s3.service'
import { Request, Response } from 'express'

export class DocumentService {

  /* -------------------------------------------------------------------------- */
  /*                         CREATE DOCUMENT (METADATA)                          */
  /* -------------------------------------------------------------------------- */
  async createDocument(data: {
    employeeId: string            // business ID like IO002
    title: string
    description?: string
    fileName: string
    filePath: string              // S3 URL or key
    fileSize?: number
    mimeType?: string
    uploadedBy: string
  }): Promise<DocumentResponse> {
    try {
      // Convert business employeeId → internal FK
      const employee = await prisma.employee.findUnique({
        where: { employeeId: data.employeeId }
      })

      if (!employee) {
        return { success: false, error: 'Employee not found' }
      }

      const document = await prisma.employeeDocument.create({
        data: {
          employeeId: employee.id,
          title: data.title,
          description: data.description,
          fileName: data.fileName,
          filePath: data.filePath,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          uploadedBy: data.uploadedBy
        },
        include: {
          employee: {
            select: {
              name: true,
              employeeId: true
            }
          }
        }
      })

      const response: EmployeeDocument = {
        id: document.id,
        employeeId: document.employee.employeeId,
        employeeName: document.employee.name,
        title: document.title,
        description: document.description || undefined,
        fileName: document.fileName,
        filePath: document.filePath,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt.toISOString(),
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString()
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('Error creating document:', error)
      return { success: false, error: 'Failed to create document' }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                        GET DOCUMENTS FOR EMPLOYEE                           */
  /* -------------------------------------------------------------------------- */
  async getEmployeeDocuments(employeeId: string): Promise<DocumentsResponse> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      })

      if (!employee) {
        return { success: false, error: 'Employee not found' }
      }

      const documents = await prisma.employeeDocument.findMany({
        where: { employeeId: employee.id },
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      })

      const response: EmployeeDocument[] = documents.map(doc => ({
        id: doc.id,
        employeeId,
        employeeName: doc.employee.name,
        title: doc.title,
        description: doc.description || undefined,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }))

      return { success: true, data: response }
    } catch (error) {
      console.error('Error fetching employee documents:', error)
      return { success: false, error: 'Failed to fetch documents' }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            GET ALL DOCUMENTS                                */
  /* -------------------------------------------------------------------------- */
  async getAllDocuments(): Promise<DocumentsResponse> {
    try {
      const documents = await prisma.employeeDocument.findMany({
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      })

      const response: EmployeeDocument[] = documents.map(doc => ({
        id: doc.id,
        employeeId: doc.employee.employeeId,
        employeeName: doc.employee.name,
        title: doc.title,
        description: doc.description || undefined,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }))

      return { success: true, data: response }
    } catch (error) {
      console.error('Error fetching all documents:', error)
      return { success: false, error: 'Failed to fetch documents' }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                          DOWNLOAD (SIGNED URL)                               */
  /* -------------------------------------------------------------------------- */
  async downloadDocument(req: Request, res: Response) {
    const { documentId } = req.params

    const document = await prisma.employeeDocument.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }

    const bucket = process.env.AWS_S3_EMPLOYEE_BUCKET
    if (!bucket) {
      return res.status(500).json({ success: false, error: 'Bucket not configured' })
    }

    const url = await getDownloadUrl(bucket, document.filePath, 60)

    // ✅ LET BROWSER HANDLE FILE TYPE
    return res.redirect(url)
  }


  /* -------------------------------------------------------------------------- */
  /*                              DELETE DOCUMENT                                 */
  /* -------------------------------------------------------------------------- */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const document = await prisma.employeeDocument.findUnique({
        where: { id: documentId }
      })

      if (!document) {
        return { success: false, error: 'Document not found' }
      }

      // OPTIONAL: delete from S3
      const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET
      if (bucket) {
        await deleteFileFromS3(bucket, document.filePath)
      }

      await prisma.employeeDocument.delete({
        where: { id: documentId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting document:', error)
      return { success: false, error: 'Failed to delete document' }
    }
  }
}
