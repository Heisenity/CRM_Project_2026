import { Request, Response } from 'express';
import { tenderService } from './tender.service';
import { TenderType, TenderStatus, TenderDocumentType, DocumentStatus, EMDStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getDownloadUrl, deleteFileFromS3, getTenderDocumentUploadUrl } from '../../services/s3.service';

import fs from "fs"

// Configure multer for file uploads

export class TenderController {
  // Create new tender
  async createTender(req: Request, res: Response) {
    try {
      const {
        name,
        department,
        requiredDocuments,
        totalEMDInvested,
        totalEMDRefunded,
        totalEMDForfeited
      } = req.body;

      const createdBy = req.user?.id;
      if (!createdBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Validate required fields
      if (!name || !department) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const tender = await tenderService.createTender({
        name,
        department,
        requiredDocuments,
        totalEMDInvested: totalEMDInvested ? parseFloat(totalEMDInvested) : undefined,
        totalEMDRefunded: totalEMDRefunded ? parseFloat(totalEMDRefunded) : undefined,
        totalEMDForfeited: totalEMDForfeited ? parseFloat(totalEMDForfeited) : undefined,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Tender created successfully',
        data: tender
      });
    } catch (error) {
      console.error('Error creating tender:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all tenders with filters
  async getTenders(req: Request, res: Response) {
    try {
      const {
        status,
        department,
        tenderType,
        dateFrom,
        dateTo,
        page,
        limit
      } = req.query;

      const filters: any = {};

      if (status && Object.values(TenderStatus).includes(status as TenderStatus)) {
        filters.status = status as TenderStatus;
      }

      if (department) filters.department = department as string;

      if (tenderType && Object.values(TenderType).includes(tenderType as TenderType)) {
        filters.tenderType = tenderType as TenderType;
      }

      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await tenderService.getTenders(filters);

      res.json({
        success: true,
        data: result.tenders,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching tenders:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get tender by ID
  async getTenderById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tender = await tenderService.getTenderById(id);

      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      res.json({
        success: true,
        data: tender
      });
    } catch (error) {
      console.error('Error fetching tender:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update tender
  async updateTender(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const updateData: any = {};
      const allowedFields = [
        'name', 'description', 'department', 'projectMapping',
        'tenderType', 'submissionDate', 'deadline', 'totalValue', 'internalRemarks', 'requiredDocuments'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'submissionDate' || field === 'deadline') {
            updateData[field] = new Date(req.body[field]);
          } else if (field === 'totalValue') {
            updateData[field] = parseFloat(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      const tender = await tenderService.updateTender(id, updateData, updatedBy);

      res.json({
        success: true,
        message: 'Tender updated successfully',
        data: tender
      });
    } catch (error: any) {
      console.error('Error updating tender:', error);
      if (error.message === 'Tender not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update tender status
  async updateTenderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!status || !Object.values(TenderStatus).includes(status as TenderStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const tender = await tenderService.updateTenderStatus(id, status, updatedBy, remarks);

      res.json({
        success: true,
        message: 'Tender status updated successfully',
        data: tender
      });
    } catch (error: any) {
      console.error('Error updating tender status:', error);
      if (error.message === 'Tender not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Upload tender document
  async uploadDocument(req: Request, res: Response) {
    try {
      const { tenderId } = req.params;
      const uploadedBy = req.user?.id;
      if (!uploadedBy) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Expect metadata posted from frontend after presigned upload
      const {
        documentType,
        isRequired,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        originalName
      } = req.body;

      if (!documentType || !Object.values(TenderDocumentType).includes(documentType as TenderDocumentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or missing documentType'
        });
      }

      if (!fileName || !fileUrl || !fileSize || !mimeType) {
        return res.status(400).json({
          success: false,
          message: 'Missing file metadata. Expecting fileName, fileUrl, fileSize, mimeType'
        });
      }

      const created = await prisma.tenderDocument.create({
        data: {
          tenderId,
          documentType: documentType as TenderDocumentType,
          isRequired: Boolean(isRequired),
          fileName,
          originalName: originalName || fileName,
          filePath: fileUrl,   // store S3 URL here
          fileSize: Number(fileSize),
          mimeType,
          uploadedBy,
          uploadedAt: new Date()
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Document metadata saved successfully',
        data: created
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


  // Update document status
  async updateDocumentStatus(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { status, remarks } = req.body;
      const verifiedBy = req.user?.id;

      if (!verifiedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!status || !Object.values(DocumentStatus).includes(status as DocumentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const document = await tenderService.updateDocumentStatus(documentId, status, verifiedBy, remarks);

      res.json({
        success: true,
        message: 'Document status updated successfully',
        data: document
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add EMD record
  async addEMDRecord(req: Request, res: Response) {
    try {
      const { tenderId } = req.params;
      const { amount, status, remarks } = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!amount || !status) {
        return res.status(400).json({
          success: false,
          message: 'Amount and status are required'
        });
      }

      if (!Object.values(EMDStatus).includes(status as EMDStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid EMD status'
        });
      }

      const emdRecord = await tenderService.addEMDRecord({
        tenderId,
        amount: parseFloat(amount),
        status,
        remarks,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'EMD record added successfully',
        data: emdRecord
      });
    } catch (error) {
      console.error('Error adding EMD record:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update EMD status
  async updateEMDStatus(req: Request, res: Response) {
    try {
      const { emdId } = req.params;
      const { status, remarks } = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!status || !Object.values(EMDStatus).includes(status as EMDStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid EMD status'
        });
      }

      const emdRecord = await tenderService.updateEMDStatus(emdId, status, updatedBy, remarks);

      res.json({
        success: true,
        message: 'EMD status updated successfully',
        data: emdRecord
      });
    } catch (error: any) {
      console.error('Error updating EMD status:', error);
      if (error.message === 'EMD record not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get EMD summary
  async getEMDSummary(req: Request, res: Response) {
    try {
      const summary = await tenderService.getEMDSummary();

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching EMD summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get tender statistics
  async getTenderStatistics(req: Request, res: Response) {
    try {
      const statistics = await tenderService.getTenderStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching tender statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete tender
  async deleteTender(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const tender = await tenderService.deleteTender(id, deletedBy);

      res.json({
        success: true,
        message: 'Tender deleted successfully',
        data: tender
      });
    } catch (error) {
      console.error('Error deleting tender:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Download document
  async downloadDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;

      const document = await prisma.tenderDocument.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isUrl = typeof document.filePath === 'string' && /^https?:\/\//i.test(document.filePath);
      if (isUrl) {
        const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET;
        if (!bucket) {
          console.error('Missing AWS_S3_MISCELLANEOUS_BUCKET env for S3 download');
          return res.status(500).json({ success: false, message: 'Server misconfiguration' });
        }

        try {
          const presigned = await getDownloadUrl(bucket, document.filePath, 120); // expiry seconds
          return res.redirect(presigned);
        } catch (err) {
          console.error('Error generating presigned download URL:', err);
          return res.status(500).json({ success: false, message: 'Failed to generate download URL' });
        }
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName || document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType);

      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
  
  async deleteDocument(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    const deletedBy = req.user?.id;
    if (!deletedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const document = await prisma.tenderDocument.findUnique({ where: { id: documentId }});
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const isUrl = typeof document.filePath === 'string' && /^https?:\/\//i.test(document.filePath);

    if (isUrl) {
      const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET;
      if (!bucket) {
        console.error('Missing AWS_S3_MISCELLANEOUS_BUCKET env for S3 delete');
        return res.status(500).json({ success: false, message: 'Server misconfiguration' });
      }
      try {
        await deleteFileFromS3(bucket, document.filePath);
      } catch (err) {
        console.error('Failed to delete file from S3:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete file from S3' });
      }
    } else {
      // legacy local file delete (optional)
      try {
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
      } catch (err) {
        console.error('Failed to delete local file:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete local file' });
      }
    }

    await prisma.tenderDocument.delete({ where: { id: documentId } });

    return res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async getTenderDocumentPresign(req: Request, res: Response) {
  const { tenderId } = req.params
  const { fileName, fileType } = req.body

  if (!fileName || !fileType) {
    return res.status(400).json({
      success: false,
      message: "fileName and fileType are required",
    })
  }

  const { uploadUrl, fileUrl } =
    await getTenderDocumentUploadUrl(fileName, fileType, tenderId)

  return res.json({
    success: true,
    uploadUrl,
    fileUrl,
  })
}


}

export const tenderController = new TenderController();