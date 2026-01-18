-- Check attendance records for the same employee
SELECT 
    a."employeeId",
    a."date",
    a."clockIn",
    a."clockOut",
    a.status
FROM attendances a
WHERE a."employeeId" = 'cmkj7uygp000avsu0sl60jj6m'
AND a."date" = '2026-01-18'
ORDER BY a."date" DESC;