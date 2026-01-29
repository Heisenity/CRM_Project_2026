import { Router } from 'express'
import { NotificationController } from './notification.controller'
import { authenticateCustomer } from '@/middleware/customerAuth.middleware'

const router = Router()
const notificationController = new NotificationController()

// Admin notification routes
router.get('/admin/notifications', notificationController.getAdminNotifications.bind(notificationController))
router.put('/admin/notifications/:id/read', notificationController.markAsRead.bind(notificationController))
router.put('/admin/notifications/read-all', notificationController.markAllAsRead.bind(notificationController))
router.delete('/admin/notifications/:id', notificationController.deleteNotification.bind(notificationController))
router.get('/admin/notifications/unread-count', notificationController.getUnreadCount.bind(notificationController))
router.post('/admin/notifications/:id/accept-ticket', notificationController.acceptTicketFromNotification.bind(notificationController))

// Customer notification routes (authenticated customer)
router.get('/customers/notifications', authenticateCustomer, notificationController.getCustomerNotifications.bind(notificationController))
router.get('/customers/notifications/unread-count', authenticateCustomer, notificationController.getCustomerUnreadCount.bind(notificationController))
router.put('/customers/notifications/:id/read', authenticateCustomer, notificationController.markCustomerNotificationAsRead.bind(notificationController))
router.put('/customers/notifications/read-all', authenticateCustomer, notificationController.markAllCustomerNotificationsAsRead.bind(notificationController))

export default router