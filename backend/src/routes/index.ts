import { Router, Request, Response } from 'express';
import attendanceRoutes from '@/modules/staffs/attendance/attendance.route';

const router = Router();

// Mount attendance routes
router.use('/attendance', attendanceRoutes);

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CRM Backend API'
  });
});

// Test endpoint
router.get('/test', (_req: Request, res: Response) => {
  res.json({ 
    message: 'CRM Backend API is running!',
    version: '1.0.0'
  });
});

export default router;