import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userType: 'ADMIN' | 'EMPLOYEE';
        role?: 'IN_OFFICE' | 'FIELD_ENGINEER';
        sessionToken: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Validate session token
    const session = await sessionService.validateSession(token);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info to request
    req.user = {
      id: session.adminId || session.employeeId || '',
      userType: session.userType,
      role: session.employee?.role as 'IN_OFFICE' | 'FIELD_ENGINEER' | undefined,
      sessionToken: token
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};