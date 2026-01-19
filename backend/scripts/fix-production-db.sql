-- Emergency fix for production database schema mismatch
-- This script removes the problematic columns that were removed in migration

-- Remove columns from attendances table if they exist
ALTER TABLE "attendances" DROP COLUMN IF EXISTS "taskId";
ALTER TABLE "attendances" DROP COLUMN IF EXISTS "taskStartTime";
ALTER TABLE "attendances" DROP COLUMN IF EXISTS "taskEndTime";
ALTER TABLE "attendances" DROP COLUMN IF EXISTS "taskLocation";

-- Add new columns to tasks table if they don't exist
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "checkIn" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "checkOut" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "relatedTicketId" TEXT;

-- Drop old columns from tasks table if they exist
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "startTime";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "endTime";

-- Add index for relatedTicketId if it doesn't exist
CREATE INDEX IF NOT EXISTS "tasks_relatedTicketId_idx" ON "tasks"("relatedTicketId");

-- Update ticket status enum values (this might need manual handling)
-- Note: This is a simplified approach - in production you might need to handle data migration

COMMIT;