import { Request, Response } from 'express'
import { NotificationService } from './notification.service'

const notificationService = new NotificationService()

export class NotificationController {
  // GET /admin/notifications - Get all admin notifications
  async getAdminNotifications(req: Request, res: Response) {
    try {
      const { isRead, type, limit } = req.query

      const filters: any = {}
      if (isRead !== undefined) filters.isRead = isRead === 'true'
      if (type) filters.type = type as string
      if (limit) filters.limit = parseInt(limit as string)

      const result = await notificationService.getAdminNotifications(filters)

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in getAdminNotifications:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // PUT /admin/notifications/:id/read - Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const result = await notificationService.markAsRead(id)

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in markAsRead:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // PUT /admin/notifications/read-all - Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const result = await notificationService.markAllAsRead()

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // DELETE /admin/notifications/:id - Delete notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params
      const result = await notificationService.deleteNotification(id)

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // GET /admin/notifications/unread-count - Get unread notification count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const result = await notificationService.getUnreadCount()

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // --- Customer notification endpoints ---
  // GET /customers/notifications - Get notifications for authenticated customer
  async getCustomerNotifications(req: Request, res: Response) {
    try {
      const customer = (req as any).customer
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Unauthorized' })
      }

      const { isRead, limit } = req.query
      const filters: any = {}
      if (isRead !== undefined) filters.isRead = isRead === 'true'
      if (limit) filters.limit = parseInt(limit as string)

      const result = await notificationService.getCustomerNotifications(customer.id, filters)

      if (result.success) return res.json(result)
      return res.status(400).json(result)
    } catch (error) {
      console.error('Error in getCustomerNotifications:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  // GET /customers/notifications/unread-count - Get unread count for customer
  async getCustomerUnreadCount(req: Request, res: Response) {
    try {
      const customer = (req as any).customer
      if (!customer) return res.status(401).json({ success: false, error: 'Unauthorized' })

      const result = await notificationService.getCustomerUnreadCount(customer.id)
      if (result.success) return res.json(result)
      return res.status(400).json(result)
    } catch (error) {
      console.error('Error in getCustomerUnreadCount:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  // PUT /customers/notifications/:id/read - mark a customer notification as read
  async markCustomerNotificationAsRead(req: Request, res: Response) {
    try {
      const customer = (req as any).customer
      if (!customer) return res.status(401).json({ success: false, error: 'Unauthorized' })

      const { id } = req.params
      const result = await notificationService.markCustomerNotificationAsRead(id, customer.id)

      if (result.success) return res.json(result)
      return res.status(400).json(result)
    } catch (error) {
      console.error('Error in markCustomerNotificationAsRead:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  // PUT /customers/notifications/read-all - mark all customer notifications as read
  async markAllCustomerNotificationsAsRead(req: Request, res: Response) {
    try {
      const customer = (req as any).customer
      if (!customer) return res.status(401).json({ success: false, error: 'Unauthorized' })

      const result = await notificationService.markAllCustomerNotificationsAsRead(customer.id)

      if (result.success) return res.json(result)
      return res.status(400).json(result)
    } catch (error) {
      console.error('Error in markAllCustomerNotificationsAsRead:', error)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  // POST /admin/notifications/:id/accept-ticket - Accept ticket from notification
  async acceptTicketFromNotification(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { employeeId, adminId, userType } = req.body

      // Determine user ID and type
      let userId: string
      let userTypeEnum: 'ADMIN' | 'EMPLOYEE' = 'EMPLOYEE'

      if (adminId) {
        userId = adminId
        userTypeEnum = 'ADMIN'
      } else if (employeeId) {
        userId = employeeId
        userTypeEnum = 'EMPLOYEE'
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either employeeId or adminId is required'
        })
      }

      const result = await notificationService.acceptTicketFromNotification(id, userId, userTypeEnum)

      if (result.success) {
        res.json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error in acceptTicketFromNotification:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}