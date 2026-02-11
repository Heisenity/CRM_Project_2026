import { Router, Request, Response } from 'express'
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getEmployeeById,
  getNextEmployeeId,
  getEmployeeByEmployeeId,
  getEmployeePhotoUrl,
  getAvailablePrefixes,
  addCustomPrefix,
  updatePrefix,
  deletePrefix,
  getNextAvailableIds,
  generateEmployeeIdWithPrefix,
  previewNextEmployeeId
} from './employee.controller'


const router = Router()

// Get all employees - GET /employees
router.get('/', (req: Request, res: Response) => {
  return getAllEmployees(req, res)
})

// Get next employee ID - GET /employees/next-id
router.get('/next-id', (req: Request, res: Response) => {
  return getNextEmployeeId(req, res)
})

// Get available prefixes - GET /employees/prefixes
router.get('/prefixes', (req: Request, res: Response) => {
  return getAvailablePrefixes(req, res)
})

// Preview next employee ID for prefix (without incrementing) - GET /employees/prefixes/:prefix/preview
router.get('/prefixes/:prefix/preview', (req: Request, res: Response) => {
  return previewNextEmployeeId(req, res)
})

// Get next available IDs for prefix - GET /employees/next-available-ids
router.get('/next-available-ids', (req: Request, res: Response) => {
  return getNextAvailableIds(req, res)
})

// Add custom prefix - POST /employees/prefixes
router.post('/prefixes', (req: Request, res: Response) => {
  return addCustomPrefix(req, res)
})

// Update prefix - PUT /employees/prefixes/:prefix
router.put('/prefixes/:prefix', (req: Request, res: Response) => {
  return updatePrefix(req, res)
})

// Delete prefix - DELETE /employees/prefixes/:prefix
router.delete('/prefixes/:prefix', (req: Request, res: Response) => {
  return deletePrefix(req, res)
})

// Generate employee ID with custom prefix - POST /employees/generate-id
router.post('/generate-id', (req: Request, res: Response) => {
  return generateEmployeeIdWithPrefix(req, res)
})

// Get employee by employeeId - GET /employees/by-employee-id/:employeeId
router.get('/by-employee-id/:employeeId', (req: Request, res: Response) => {
  return getEmployeeByEmployeeId(req, res)
})

// Get presigned URL for employee photo - POST /employees/photo-url
router.post('/photo-url', (req: Request, res: Response) => {
  return getEmployeePhotoUrl(req, res)
})

// Get employee by ID - GET /employees/:id
router.get('/:id', (req: Request, res: Response) => {
  return getEmployeeById(req, res)
})

// Create new employee - POST /employees
router.post('/', (req: Request, res: Response) => {
  return createEmployee(req, res)
})

// Update employee - PUT /employees/:id
router.put('/:id', (req: Request, res: Response) => {
  return updateEmployee(req, res)
})

// Delete employee - DELETE /employees/:id
router.delete('/:id', (req: Request, res: Response) => {
  return deleteEmployee(req, res)
})

export default router