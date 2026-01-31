import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/aws";



function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "")
}

function makeFileUrl(bucket: string, region: string, key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}


function extractKeyFromUrl(fileUrl: string): string {
  const rawKey = fileUrl.replace(/^https?:\/\/[^/]+\//, "")
  return decodeURIComponent(rawKey)
}

export async function getEmployeePhotoUploadUrl(
  fileName: string,
  fileType: string,
  employeeId?: string
) {
  const bucket = process.env.AWS_S3_EMPLOYEE_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error("Missing AWS_S3_EMPLOYEE_BUCKET or AWS_REGION");

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "");
  const key = `employees/${employeeId ?? "temp"}-${Date.now()}-${safeName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      // DON'T set ACL here if you want bucket to remain private; use presigned GET to read.
    });

    // increase expiry so browser has time to PUT
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 /* seconds */ });

    const fileUrl = makeFileUrl(bucket, region, key); // public-style URL (may 403 if bucket private)
    return { uploadUrl, fileUrl, key };
  } catch (err: any) {
    console.error("getEmployeePhotoUploadUrl error:", err);
    throw new Error("Failed to create presigned upload url");
  }
}

export async function getAttendancePhotoUploadUrl(
  fileName: string,
  fileType: string,
  employeeId: string
) {
  const bucket = process.env.AWS_S3_ATTENDANCE_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region) {
    throw new Error("Missing AWS_S3_ATTENDANCE_BUCKET or AWS_REGION");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "");
  const key = `attendance/${employeeId}/${Date.now()}-${safeName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

    return { uploadUrl, fileUrl, fileKey: key };
  } catch (err: any) {
    console.error("getAttendancePhotoUploadUrl error:", err);
    throw new Error("Failed to create attendance photo upload URL");
  }
}


export async function getTenderDocumentUploadUrl(
  fileName: string,
  fileType: string,
  tenderId: string
) {
  const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET
  const region = process.env.AWS_REGION

  if (!bucket || !region) {
    throw new Error("Missing AWS_S3_TENDER_BUCKET or AWS_REGION")
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "")
  const key = `tenders/${tenderId}/${Date.now()}-${safeName}`

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    })

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60, // seconds
    })

    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

    return { uploadUrl, fileUrl }
  } catch (err: any) {
    console.error("getTenderDocumentUploadUrl error:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    })
    throw new Error("Failed to create tender document upload URL")
  }
}

export async function getDownloadUrl(
  bucket: string,
  fileUrl: string,
  expiresIn = 3600
) {
  const key = extractKeyFromUrl(fileUrl)

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn })
}

export async function deleteFileFromS3(bucket: string, fileUrl: string) {
  const key = extractKeyFromUrl(fileUrl)

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await s3.send(command)
}

export async function getEmployeeDocumentUploadUrl(
  fileName: string,
  fileType: string,
  employeeId: string
) {
  const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET
  const region = process.env.AWS_REGION

  if (!bucket || !region) {
    throw new Error("Missing AWS_S3_EMPLOYEE_BUCKET or AWS_REGION")
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "")
  const key = `documents/${employeeId}/${Date.now()}-${safeName}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 })

  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`

  return { uploadUrl, fileUrl }
}

export async function uploadPayslipToS3(
  pdfBuffer: Buffer,
  fileName: string,
  employeeId: string
): Promise<string> {
  const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET
  const region = process.env.AWS_REGION

  if (!bucket || !region) {
    throw new Error("Missing AWS_S3_MISCELLANEOUS_BUCKET or AWS_REGION")
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "")
  const key = `payslips/${employeeId}/${Date.now()}-${safeName}`

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })

    await s3.send(command)
    return key // Return the S3 key for storage in database
  } catch (err: any) {
    console.error("uploadPayslipToS3 error:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    })
    throw new Error("Failed to upload payslip to S3")
  }
}
