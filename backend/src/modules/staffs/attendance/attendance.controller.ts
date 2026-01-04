// Staff device information
import { Request, Response } from 'express';
import { getDeviceInfo } from '@/utils/deviceinfo';

export const detectDevice = (req: Request, res: Response) => {
  const userAgent = req.headers['user-agent'] || '';
  const device = getDeviceInfo(userAgent);

  return res.status(200).json({
    device
  });
};