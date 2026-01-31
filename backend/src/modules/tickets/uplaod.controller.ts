import { Request, Response } from 'express'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 } from '@/config/aws'
import { v4 as uuid } from 'uuid'

export const getPresignedUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType are required'
      })
    }

    const key = `tickets/${uuid()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_MISCELLANEOUS_BUCKET!,
      Key: key,
      ContentType: fileType
    })

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300 // 5 minutes
    })

    return res.json({
      success: true,
      uploadUrl,
      filePath: key
    })
  } catch (error) {
    console.error('Presigned URL error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate upload URL'
    })
  }
}
