-- AlterTable
-- Add assignedByEmployee relation to Task model
-- This allows tracking which employee/admin assigned the task

-- First, we need to handle existing tasks that have NULL or 'admin' as assignedBy
-- We'll keep them as NULL since assignedBy is now optional
-- No need to update anything, just add the foreign key constraint

-- Make assignedBy nullable if it isn't already
ALTER TABLE "tasks" ALTER COLUMN "assignedBy" DROP NOT NULL;

-- Now we can add the foreign key constraint
-- Note: assignedBy can be NULL for system-assigned tasks or old tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedBy_fkey" 
  FOREIGN KEY ("assignedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "tasks_assignedBy_idx" ON "tasks"("assignedBy");
