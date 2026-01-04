import { Router } from 'express';
import { detectDevice } from './attendance.controller';

const router = Router();

// Device detection for attendance tracking
router.get('/device', detectDevice);

// Future attendance routes can be added here:
// router.post('/clock-in', clockIn);
// router.post('/clock-out', clockOut);
// router.get('/history/:staffId', getAttendanceHistory);

export default router;
