-- Check if tasks are being created with checkIn values
SELECT 
    t.id,
    t."employeeId",
    t.title,
    t."checkIn",
    t."checkOut",
    t.status,
    t."createdAt",
    t."assignedAt"
FROM tasks t
ORDER BY t."createdAt" DESC
LIMIT 5;