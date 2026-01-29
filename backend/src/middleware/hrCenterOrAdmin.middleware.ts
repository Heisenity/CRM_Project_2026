import { Request, Response, NextFunction } from 'express'
import { FeatureAccessService } from '../modules/staffs/featureAccess/featureAccess.service'

export const hrCenterOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    // Allow admins
    if (req.user.userType === 'ADMIN') {
      return next()
    }

    // Allow employees with HR_CENTER feature
    if (req.user.userType === 'EMPLOYEE') {
      const hasAccess = await FeatureAccessService.hasFeatureAccess(req.user.id, 'HR_CENTER' as any)
      if (hasAccess) return next()
    }

    return res.status(403).json({ success: false, message: 'Admin or HR Center access required' })
  } catch (error) {
    console.error('HR Center authorization error:', error)
    return res.status(403).json({ success: false, message: 'Authorization failed' })
  }
}