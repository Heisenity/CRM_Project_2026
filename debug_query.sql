-- Check what tasks exist with checkIn times
SELECT 
    t.id,
    t."employeeId",
    t.title,
    t."checkIn",
    t.status
FROM tasks t
WHERE t."checkIn" IS NOT NULL
ORDER BY t."checkIn" DESC
LIMIT 10;