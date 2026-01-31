import { authenticatedFetch } from "./api-client"

export async function uploadAttendancePhotoToS3(
  blob: Blob,
  employeeId: string
): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined")
  }

  // 1️⃣ Ask backend for a presigned URL
  const presignRes = await fetch(`${backendUrl}/uploads/attendance-photo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: `${employeeId}-clockin.jpg`,
      fileType: "image/jpeg",
      employeeId,
    }),
  })

  if (!presignRes.ok) {
    throw new Error("Failed to request presigned URL")
  }

  const presignData = await presignRes.json()

  if (!presignData.success || !presignData.uploadUrl) {
    throw new Error("Invalid presigned URL response")
  }

  // 2️⃣ Upload directly to S3
  const uploadRes = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: blob,
  })

  if (!uploadRes.ok) {
    throw new Error("Failed to upload attendance photo to S3")
  }

  // 3️⃣ Return public file URL
  return presignData.fileUrl as string
}

export async function uploadDocumentToS3(
  file: File,
  employeeId: string,
) {
  // 1️⃣ Get presigned URL
  const presignRes = await authenticatedFetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/presigned-upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        employeeId,
      }),
    }
  )

  const presignResult = await presignRes.json()
  if (!presignResult.success) {
    throw new Error("Failed to get upload URL")
  }

  const { uploadUrl, fileUrl } = presignResult.data

  // 2️⃣ Upload directly to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  })

  if (!uploadRes.ok) {
    throw new Error("S3 upload failed")
  }

  return {
    fileName: file.name,
    fileUrl,
    fileSize: file.size,
    mimeType: file.type,
  }
}

export async function uploadEmployeePhotoToS3(
  file: File,
  employeeId: string
): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined")
  }

  // 1️⃣ Ask backend for a presigned URL
  const presignRes = await fetch(`${backendUrl}/uploads/employee-photo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      employeeId,
    }),
  })

  if (!presignRes.ok) {
    throw new Error("Failed to request presigned URL")
  }

  const presignData = await presignRes.json()

  if (!presignData.success || !presignData.uploadUrl) {
    throw new Error("Invalid presigned URL response")
  }

  // 2️⃣ Upload directly to S3
  const uploadRes = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  })

  if (!uploadRes.ok) {
    throw new Error("Failed to upload employee photo to S3")
  }

  // 3️⃣ Return S3 key instead of full URL
  return presignData.fileKey as string
}

