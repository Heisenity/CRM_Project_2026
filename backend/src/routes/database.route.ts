import { Router } from 'express'
import { DatabaseController } from '../controllers/database.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()
const databaseController = new DatabaseController()

// Database management routes (only for development)
router.delete('/database/reset', databaseController.resetDatabase.bind(databaseController))
router.delete('/database/attendance', databaseController.clearAttendance.bind(databaseController))
router.delete('/database/tasks', databaseController.clearTasks.bind(databaseController))
router.delete('/database/notifications', databaseController.clearNotifications.bind(databaseController))
router.post('/database/unassign-vehicles', databaseController.unassignAllVehicles.bind(databaseController))
router.get('/database/stats', authenticateToken, databaseController.getDatabaseStats.bind(databaseController))

export default router