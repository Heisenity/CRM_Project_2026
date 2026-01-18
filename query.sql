SELECT 
    t.id,
    t."employeeId",
    t."checkIn",
    a."clockIn",
    a."date"
FROM tasks t
JOIN attendances a ON t."employeeId" = a."employeeId"
WHERE t."checkIn" IS NOT NULL
AND a."clockIn" IS NOT NULL
AND t."checkIn" = a."clockIn";