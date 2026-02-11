// routes/upload.route.ts
import { Router, Request, Response } from "express";
import {
  getEmployeePhotoUploadUrl,
  getAttendancePhotoUploadUrl,
  getTenderDocumentUploadUrl,
  deleteFileFromS3,
  getDownloadUrl,
} from "../services/s3.service";
import { getPresignedUploadUrl } from "../modules/tickets/uplaod.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { authenticateCustomer } from "../middleware/customerAuth.middleware";

const router = Router();

/**
 * POST /api/v1/uploads/employee-photo
 */
router.post("/employee-photo", async (req, res) => {
  try {
    const { fileName, fileType, employeeId } = req.body;
    if (!fileName || !fileType) return res.status(400).json({ success: false, error: "Missing fileName/fileType" });

    const { uploadUrl, fileUrl, key } = await getEmployeePhotoUploadUrl(fileName, fileType, employeeId);

    // Optionally: save 'key' and/or 'fileUrl' to DB immediately (or later when employee is created).
    return res.json({ success: true, uploadUrl, fileUrl, fileKey: key });
  } catch (err: any) {
    console.error("uploads/employee-photo error:", err);
    return res.status(500).json({ success: false, error: "Failed to create upload URL" });
  }
});

/**
 * POST /api/v1/uploads/attendance-photo
 */
router.post("/attendance-photo", async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, employeeId } = req.body;

    if (!fileName || !fileType || !employeeId) {
      return res.status(400).json({
        success: false,
        error: "fileName, fileType and employeeId are required",
      });
    }

    const data = await getAttendancePhotoUploadUrl(
      fileName,
      fileType,
      employeeId
    );

    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Attendance photo upload URL error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate upload URL",
    });
  }
});

/**
 * POST /api/v1/uploads/presigned-url
 * For ticket attachments (employee/admin authentication)
 */
router.post("/presigned-url", authenticateToken, getPresignedUploadUrl);

/**
 * POST /api/v1/uploads/customer-presigned-url
 * For customer support attachments (customer authentication)
 */
router.post("/customer-presigned-url", authenticateCustomer, getPresignedUploadUrl);

/**
 * POST /api/v1/uploads/petrol-bill
 */
router.post("/petrol-bill", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, employeeId } = req.body;

    if (!fileName || !fileType || !employeeId) {
      return res.status(400).json({
        success: false,
        error: "fileName, fileType and employeeId are required",
      });
    }

    const { getPetrolBillUploadUrl } = await import("../services/s3.service");
    const data = await getPetrolBillUploadUrl(fileName, fileType, employeeId);

    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Petrol bill upload URL error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate upload URL",
    });
  }
});


export default router;
